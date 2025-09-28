package installer

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/chameleon-nexus/agents-cli/pkg/registry"
)

// ClaudeCodeInstaller handles installation for Claude Code CLI
type ClaudeCodeInstaller struct {
	installDir string
}

// NewClaudeCodeInstaller creates a new Claude Code installer
func NewClaudeCodeInstaller() *ClaudeCodeInstaller {
	homeDir, _ := os.UserHomeDir()
	installDir := filepath.Join(homeDir, ".claude", "agents")
	
	return &ClaudeCodeInstaller{
		installDir: installDir,
	}
}

// Install installs an agent to the Claude Code directory
func (c *ClaudeCodeInstaller) Install(agentID, content string) error {
	// Ensure install directory exists
	if err := os.MkdirAll(c.installDir, 0755); err != nil {
		return fmt.Errorf("failed to create install directory: %w", err)
	}

	// Create agent file
	agentPath := filepath.Join(c.installDir, agentID+".md")
	if err := os.WriteFile(agentPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write agent file: %w", err)
	}

	// Update installation registry
	if err := c.updateInstallRegistry(agentID, agentPath); err != nil {
		return fmt.Errorf("failed to update install registry: %w", err)
	}

	return nil
}

// ListInstalled returns a list of installed agents
func (c *ClaudeCodeInstaller) ListInstalled() ([]InstalledAgent, error) {
	registryPath := filepath.Join(c.installDir, ".registry.json")
	
	if _, err := os.Stat(registryPath); os.IsNotExist(err) {
		return []InstalledAgent{}, nil
	}

	data, err := os.ReadFile(registryPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read install registry: %w", err)
	}

	var agents []InstalledAgent
	if err := json.Unmarshal(data, &agents); err != nil {
		return nil, fmt.Errorf("failed to parse install registry: %w", err)
	}

	return agents, nil
}

// GetInstalled returns information about a specific installed agent
func (c *ClaudeCodeInstaller) GetInstalled(agentID string) (InstalledAgent, error) {
	agents, err := c.ListInstalled()
	if err != nil {
		return InstalledAgent{}, err
	}

	for _, agent := range agents {
		if agent.ID == agentID {
			return agent, nil
		}
	}

	return InstalledAgent{}, fmt.Errorf("agent %s is not installed", agentID)
}

// IsCompatible checks if an agent is compatible with Claude Code
func (c *ClaudeCodeInstaller) IsCompatible(compatibility registry.Compatibility) bool {
	// For now, assume all agents are compatible with Claude Code
	// In the future, we could check version requirements
	return compatibility.ClaudeCode != nil
}

// GetInstallPath returns the installation path for an agent
func (c *ClaudeCodeInstaller) GetInstallPath(agentID string) string {
	return filepath.Join(c.installDir, agentID+".md")
}

// Uninstall removes an installed agent
func (c *ClaudeCodeInstaller) Uninstall(agentID string) error {
	// Remove agent file
	agentPath := c.GetInstallPath(agentID)
	if err := os.Remove(agentPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove agent file: %w", err)
	}

	// Update installation registry
	agents, err := c.ListInstalled()
	if err != nil {
		return err
	}

	var updated []InstalledAgent
	for _, agent := range agents {
		if agent.ID != agentID {
			updated = append(updated, agent)
		}
	}

	return c.saveInstallRegistry(updated)
}

// updateInstallRegistry updates the installation registry
func (c *ClaudeCodeInstaller) updateInstallRegistry(agentID, agentPath string) error {
	agents, err := c.ListInstalled()
	if err != nil {
		return err
	}

	// Update existing or add new
	found := false
	for i, agent := range agents {
		if agent.ID == agentID {
			agents[i].InstalledAt = time.Now()
			agents[i].Path = agentPath
			found = true
			break
		}
	}

	if !found {
		agents = append(agents, InstalledAgent{
			ID:          agentID,
			Version:     "latest", // TODO: Get actual version
			InstalledAt: time.Now(),
			Path:        agentPath,
		})
	}

	return c.saveInstallRegistry(agents)
}

// saveInstallRegistry saves the installation registry
func (c *ClaudeCodeInstaller) saveInstallRegistry(agents []InstalledAgent) error {
	registryPath := filepath.Join(c.installDir, ".registry.json")
	
	data, err := json.MarshalIndent(agents, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal install registry: %w", err)
	}

	if err := os.WriteFile(registryPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write install registry: %w", err)
	}

	return nil
}
