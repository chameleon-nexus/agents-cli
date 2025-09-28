package registry

import "time"

// Registry represents the main registry structure
type Registry struct {
	Version      string            `json:"version"`
	LastUpdated  time.Time         `json:"lastUpdated"`
	TotalAgents  int               `json:"totalAgents"`
	Agents       map[string]Agent  `json:"agents"`
	Categories   map[string]Category `json:"categories"`
	Stats        Stats             `json:"stats"`
}

// Agent represents an agent in the registry
type Agent struct {
	ID           string            `json:"id"`
	Name         LocalizedString   `json:"name"`
	Description  LocalizedString   `json:"description"`
	Author       string            `json:"author"`
	Category     string            `json:"category"`
	Tags         []string          `json:"tags"`
	Latest       string            `json:"latest"`
	Versions     []string          `json:"versions"`
	Downloads    int               `json:"downloads"`
	Rating       float64           `json:"rating"`
	RatingCount  int               `json:"ratingCount"`
	License      string            `json:"license"`
	Compatibility Compatibility    `json:"compatibility"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}

// AgentMetadata represents detailed agent metadata
type AgentMetadata struct {
	ID              string            `json:"id"`
	Name            LocalizedString   `json:"name"`
	Description     LocalizedString   `json:"description"`
	LongDescription LocalizedString   `json:"longDescription"`
	Author          string            `json:"author"`
	License         string            `json:"license"`
	Homepage        string            `json:"homepage"`
	Category        string            `json:"category"`
	Tags            []string          `json:"tags"`
	Compatibility   Compatibility     `json:"compatibility"`
	Versions        map[string]Version `json:"versions"`
	Latest          string            `json:"latest"`
	Downloads       int               `json:"downloads"`
	Rating          float64           `json:"rating"`
	RatingCount     int               `json:"ratingCount"`
	CreatedAt       time.Time         `json:"createdAt"`
	UpdatedAt       time.Time         `json:"updatedAt"`
}

// LocalizedString represents a string with multiple language versions
type LocalizedString struct {
	En string `json:"en"`
	Zh string `json:"zh"`
}

// Category represents an agent category
type Category struct {
	Name        LocalizedString `json:"name"`
	Description LocalizedString `json:"description"`
	Icon        string          `json:"icon"`
}

// Compatibility represents compatibility information
type Compatibility struct {
	ClaudeCode *CompatibilityInfo `json:"claudeCode,omitempty"`
	Codex      *CompatibilityInfo `json:"codex,omitempty"`
	Copilot    *CompatibilityInfo `json:"copilot,omitempty"`
}

// CompatibilityInfo represents compatibility details for a specific CLI
type CompatibilityInfo struct {
	MinVersion string   `json:"minVersion"`
	Tested     []string `json:"tested"`
}

// Version represents a specific version of an agent
type Version struct {
	ReleaseDate time.Time         `json:"releaseDate"`
	Changes     string            `json:"changes"`
	Files       map[string]string `json:"files"`
}

// Stats represents registry statistics
type Stats struct {
	TotalDownloads int      `json:"totalDownloads"`
	ActiveUsers    int      `json:"activeUsers"`
	TopAgents      []string `json:"topAgents"`
	RecentUpdates  []string `json:"recentUpdates"`
}

// SearchFilters represents search filter options
type SearchFilters struct {
	Category string
	Tag      string
	Author   string
	SortBy   string
	Limit    int
}
