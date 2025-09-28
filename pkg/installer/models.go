package installer

import "time"

// InstalledAgent represents an installed agent
type InstalledAgent struct {
	ID          string    `json:"id"`
	Version     string    `json:"version"`
	InstalledAt time.Time `json:"installedAt"`
	Path        string    `json:"path"`
}

// InstallationTarget represents different CLI targets
type InstallationTarget string

const (
	TargetClaudeCode InstallationTarget = "claude-code"
	TargetCodex      InstallationTarget = "codex"
	TargetCopilot    InstallationTarget = "copilot"
)
