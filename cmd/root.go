package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string
var version = "1.0.0"

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "agents",
	Short: "Chameleon Agent CLI - Manage AI agents for your development workflow",
	Long: `Chameleon Agent CLI is a command-line tool for discovering, installing, 
and managing AI agents that work with Claude Code, Codex, and other AI development tools.

Examples:
  agents search "code review"     # Search for agents
  agents install code-reviewer    # Install an agent
  agents list --installed         # List installed agents
  agents update                   # Update all agents`,
	Version: version,
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.agents-cli/config.yaml)")
	rootCmd.PersistentFlags().Bool("verbose", false, "verbose output")
	rootCmd.PersistentFlags().String("registry", "", "registry URL (default: https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main)")

	// Bind flags to viper
	viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
	viper.BindPFlag("registry", rootCmd.PersistentFlags().Lookup("registry"))

	// Add subcommands
	rootCmd.AddCommand(searchCmd)
	rootCmd.AddCommand(installCmd)
	rootCmd.AddCommand(listCmd)
	rootCmd.AddCommand(updateCmd)
	rootCmd.AddCommand(publishCmd)
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		// Search config in home directory with name ".agents-cli" (without extension).
		viper.AddConfigPath(home + "/.agents-cli")
		viper.SetConfigType("yaml")
		viper.SetConfigName("config")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// Set defaults
	viper.SetDefault("registry.url", "https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main")
	viper.SetDefault("registry.cache_ttl", 300)
	viper.SetDefault("install.target", "claude-code")
	viper.SetDefault("install.directory", "~/.claude/agents")
	viper.SetDefault("logging.level", "info")

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		if viper.GetBool("verbose") {
			fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
		}
	}
}
