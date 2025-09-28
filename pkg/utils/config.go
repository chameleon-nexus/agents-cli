package utils

import (
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// InitConfig initializes the configuration
func InitConfig() error {
	// Set config file path
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	configDir := filepath.Join(home, ".agents-cli")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(configDir)

	// Set defaults
	setDefaults()

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Config file not found, create default
			return createDefaultConfig(configDir)
		}
		return err
	}

	return nil
}

// setDefaults sets default configuration values
func setDefaults() {
	viper.SetDefault("registry.url", "https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main")
	viper.SetDefault("registry.cache_ttl", 300) // 5 minutes
	viper.SetDefault("install.target", "claude-code")
	viper.SetDefault("install.directory", "~/.claude/agents")
	viper.SetDefault("logging.level", "info")
	viper.SetDefault("logging.file", "~/.agents-cli/logs/agents.log")
}

// createDefaultConfig creates a default configuration file
func createDefaultConfig(configDir string) error {
	configPath := filepath.Join(configDir, "config.yaml")
	
	defaultConfig := `# Agents CLI Configuration

registry:
  url: "https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main"
  cache_ttl: 300  # Cache TTL in seconds (5 minutes)

install:
  target: "claude-code"  # Default installation target
  directory: "~/.claude/agents"  # Installation directory

github:
  token: ""  # GitHub token for publishing (optional)

logging:
  level: "info"  # Log level (debug, info, warn, error)
  file: "~/.agents-cli/logs/agents.log"  # Log file path
`

	return os.WriteFile(configPath, []byte(defaultConfig), 0644)
}
