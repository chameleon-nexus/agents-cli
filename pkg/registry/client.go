package registry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Client represents a registry client
type Client struct {
	baseURL    string
	httpClient *http.Client
	cache      *Cache
}

// NewClient creates a new registry client
func NewClient() *Client {
	baseURL := viper.GetString("registry.url")
	if baseURL == "" {
		baseURL = "https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main"
	}

	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		cache: NewCache(),
	}
}

// GetRegistry fetches the main registry
func (c *Client) GetRegistry() (*Registry, error) {
	// Check cache first
	if cached := c.cache.Get("registry"); cached != nil {
		if registry, ok := cached.(*Registry); ok {
			return registry, nil
		}
	}

	url := fmt.Sprintf("%s/registry.json", c.baseURL)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch registry: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registry request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read registry response: %w", err)
	}

	var registry Registry
	if err := json.Unmarshal(body, &registry); err != nil {
		return nil, fmt.Errorf("failed to parse registry: %w", err)
	}

	// Cache the result
	c.cache.Set("registry", &registry, viper.GetDuration("registry.cache_ttl")*time.Second)

	return &registry, nil
}

// GetAllAgents returns all agents from the registry
func (c *Client) GetAllAgents() ([]Agent, error) {
	registry, err := c.GetRegistry()
	if err != nil {
		return nil, err
	}

	agents := make([]Agent, 0, len(registry.Agents))
	for _, agent := range registry.Agents {
		agents = append(agents, agent)
	}

	return agents, nil
}

// SearchAgents searches for agents based on query and filters
func (c *Client) SearchAgents(query string, filters SearchFilters) ([]Agent, error) {
	agents, err := c.GetAllAgents()
	if err != nil {
		return nil, err
	}

	// Apply filters
	var filtered []Agent
	for _, agent := range agents {
		if matchesFilters(agent, query, filters) {
			filtered = append(filtered, agent)
		}
	}

	// Sort results
	sortAgents(filtered, filters.SortBy)

	// Apply limit
	if filters.Limit > 0 && len(filtered) > filters.Limit {
		filtered = filtered[:filters.Limit]
	}

	return filtered, nil
}

// GetAgentMetadata fetches detailed metadata for a specific agent
func (c *Client) GetAgentMetadata(agentID string) (*AgentMetadata, error) {
	// Check cache first
	cacheKey := fmt.Sprintf("metadata_%s", agentID)
	if cached := c.cache.Get(cacheKey); cached != nil {
		if metadata, ok := cached.(*AgentMetadata); ok {
			return metadata, nil
		}
	}

	// Determine author and agent name from ID
	author, name := parseAgentID(agentID)
	
	url := fmt.Sprintf("%s/agents/%s/%s/metadata.json", c.baseURL, author, name)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch agent metadata: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("agent metadata request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read metadata response: %w", err)
	}

	var metadata AgentMetadata
	if err := json.Unmarshal(body, &metadata); err != nil {
		return nil, fmt.Errorf("failed to parse metadata: %w", err)
	}

	// Cache the result
	c.cache.Set(cacheKey, &metadata, viper.GetDuration("registry.cache_ttl")*time.Second)

	return &metadata, nil
}

// DownloadAgent downloads the agent file content
func (c *Client) DownloadAgent(agentID, version string) (string, error) {
	// Determine author and agent name from ID
	author, name := parseAgentID(agentID)
	
	url := fmt.Sprintf("%s/agents/%s/%s/agent.md", c.baseURL, author, name)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to download agent: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("agent download failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read agent content: %w", err)
	}

	return string(body), nil
}

// Helper functions

func parseAgentID(agentID string) (author, name string) {
	parts := strings.SplitN(agentID, "/", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	// Default to community if no author specified
	return "community", agentID
}

func matchesFilters(agent Agent, query string, filters SearchFilters) bool {
	// Category filter
	if filters.Category != "" && agent.Category != filters.Category {
		return false
	}

	// Tag filter
	if filters.Tag != "" {
		found := false
		for _, tag := range agent.Tags {
			if tag == filters.Tag {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	// Author filter
	if filters.Author != "" && agent.Author != filters.Author {
		return false
	}

	// Query filter (search in name, description, tags)
	if query != "" {
		query = strings.ToLower(query)
		searchText := strings.ToLower(fmt.Sprintf("%s %s %s %s",
			agent.Name.En, agent.Name.Zh,
			agent.Description.En, agent.Description.Zh))
		
		for _, tag := range agent.Tags {
			searchText += " " + strings.ToLower(tag)
		}

		if !strings.Contains(searchText, query) {
			return false
		}
	}

	return true
}

func sortAgents(agents []Agent, sortBy string) {
	switch sortBy {
	case "downloads":
		sort.Slice(agents, func(i, j int) bool {
			return agents[i].Downloads > agents[j].Downloads
		})
	case "rating":
		sort.Slice(agents, func(i, j int) bool {
			return agents[i].Rating > agents[j].Rating
		})
	case "name":
		sort.Slice(agents, func(i, j int) bool {
			return agents[i].Name.En < agents[j].Name.En
		})
	case "updated":
		sort.Slice(agents, func(i, j int) bool {
			return agents[i].UpdatedAt.After(agents[j].UpdatedAt)
		})
	default:
		// Default sort by downloads
		sort.Slice(agents, func(i, j int) bool {
			return agents[i].Downloads > agents[j].Downloads
		})
	}
}
