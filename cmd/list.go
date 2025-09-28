package cmd

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
	"github.com/chameleon-nexus/agents-cli/pkg/registry"
	"github.com/chameleon-nexus/agents-cli/pkg/installer"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List available or installed agents",
	Long: `List agents from the registry or show locally installed agents.

Examples:
  agents list                    # List all available agents
  agents list --installed        # List installed agents
  agents list --category=development  # List by category
  agents list --updates          # List agents with updates`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Get flags
		installed, _ := cmd.Flags().GetBool("installed")
		category, _ := cmd.Flags().GetString("category")
		updates, _ := cmd.Flags().GetBool("updates")

		if installed {
			return listInstalledAgents()
		} else if updates {
			return listUpdatableAgents()
		} else {
			return listAvailableAgents(category)
		}
	},
}

func init() {
	// Add flags
	listCmd.Flags().Bool("installed", false, "List installed agents")
	listCmd.Flags().String("category", "", "Filter by category")
	listCmd.Flags().Bool("updates", false, "List agents with available updates")
}

func listAvailableAgents(category string) error {
	client := registry.NewClient()
	
	agents, err := client.GetAllAgents()
	if err != nil {
		return fmt.Errorf("failed to get agents: %w", err)
	}

	// Filter by category if specified
	if category != "" {
		var filtered []registry.Agent
		for _, agent := range agents {
			if agent.Category == category {
				filtered = append(filtered, agent)
			}
		}
		agents = filtered
	}

	if len(agents) == 0 {
		fmt.Println("No agents found")
		return nil
	}

	// Create table writer
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAME\tVERSION\tCATEGORY\tDOWNLOADS\tRATING\tDESCRIPTION")
	fmt.Fprintln(w, "----\t-------\t--------\t---------\t------\t-----------")

	for _, agent := range agents {
		fmt.Fprintf(w, "%s\t%s\t%s\t%d\t%.1f\t%s\n",
			agent.ID,
			agent.Latest,
			agent.Category,
			agent.Downloads,
			agent.Rating,
			truncateString(agent.Description.En, 50))
	}

	w.Flush()
	fmt.Printf("\nTotal: %d agents\n", len(agents))
	return nil
}

func listInstalledAgents() error {
	inst := installer.NewClaudeCodeInstaller()
	
	agents, err := inst.ListInstalled()
	if err != nil {
		return fmt.Errorf("failed to list installed agents: %w", err)
	}

	if len(agents) == 0 {
		fmt.Println("No agents installed")
		return nil
	}

	// Create table writer
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAME\tVERSION\tINSTALLED\tPATH")
	fmt.Fprintln(w, "----\t-------\t---------\t----")

	for _, agent := range agents {
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\n",
			agent.ID,
			agent.Version,
			agent.InstalledAt.Format("2006-01-02"),
			agent.Path)
	}

	w.Flush()
	fmt.Printf("\nTotal: %d installed agents\n", len(agents))
	return nil
}

func listUpdatableAgents() error {
	client := registry.NewClient()
	inst := installer.NewClaudeCodeInstaller()
	
	installed, err := inst.ListInstalled()
	if err != nil {
		return fmt.Errorf("failed to list installed agents: %w", err)
	}

	if len(installed) == 0 {
		fmt.Println("No agents installed")
		return nil
	}

	var updatable []installer.InstalledAgent
	
	for _, agent := range installed {
		metadata, err := client.GetAgentMetadata(agent.ID)
		if err != nil {
			continue // Skip if can't get metadata
		}
		
		if metadata.Latest != agent.Version {
			updatable = append(updatable, agent)
		}
	}

	if len(updatable) == 0 {
		fmt.Println("All agents are up to date")
		return nil
	}

	// Create table writer
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAME\tCURRENT\tLATEST\tSTATUS")
	fmt.Fprintln(w, "----\t-------\t------\t------")

	for _, agent := range updatable {
		metadata, _ := client.GetAgentMetadata(agent.ID)
		fmt.Fprintf(w, "%s\t%s\t%s\tUpdate Available\n",
			agent.ID,
			agent.Version,
			metadata.Latest)
	}

	w.Flush()
	fmt.Printf("\nTotal: %d agents can be updated\n", len(updatable))
	fmt.Println("Run 'agents update' to update all agents")
	return nil
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
