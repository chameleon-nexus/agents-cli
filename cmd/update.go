package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/chameleon-nexus/agents-cli/pkg/registry"
	"github.com/chameleon-nexus/agents-cli/pkg/installer"
)

var updateCmd = &cobra.Command{
	Use:   "update [agent-id...]",
	Short: "Update installed agents",
	Long: `Update one or more installed agents to their latest versions.

Examples:
  agents update                  # Update all agents
  agents update code-reviewer    # Update specific agent
  agents update --check          # Check for updates without installing`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Get flags
		check, _ := cmd.Flags().GetBool("check")

		if check {
			return checkUpdates()
		}

		return updateAgents(args)
	},
}

func init() {
	// Add flags
	updateCmd.Flags().Bool("check", false, "Check for updates without installing")
}

func updateAgents(agentIDs []string) error {
	client := registry.NewClient()
	inst := installer.NewClaudeCodeInstaller()

	var toUpdate []installer.InstalledAgent

	if len(agentIDs) == 0 {
		// Update all installed agents
		installed, err := inst.ListInstalled()
		if err != nil {
			return fmt.Errorf("failed to list installed agents: %w", err)
		}
		toUpdate = installed
	} else {
		// Update specific agents
		for _, agentID := range agentIDs {
			agent, err := inst.GetInstalled(agentID)
			if err != nil {
				fmt.Printf("❌ Agent %s is not installed\n", agentID)
				continue
			}
			toUpdate = append(toUpdate, agent)
		}
	}

	if len(toUpdate) == 0 {
		fmt.Println("No agents to update")
		return nil
	}

	var updated, failed []string

	for _, agent := range toUpdate {
		fmt.Printf("🔄 Checking %s...\n", agent.ID)

		// Get latest metadata
		metadata, err := client.GetAgentMetadata(agent.ID)
		if err != nil {
			fmt.Printf("   ❌ Failed to get metadata: %v\n", err)
			failed = append(failed, agent.ID)
			continue
		}

		// Check if update is needed
		if metadata.Latest == agent.Version {
			fmt.Printf("   ✅ Already up to date (%s)\n", agent.Version)
			continue
		}

		fmt.Printf("   📦 Updating %s -> %s\n", agent.Version, metadata.Latest)

		// Download new version
		content, err := client.DownloadAgent(agent.ID, metadata.Latest)
		if err != nil {
			fmt.Printf("   ❌ Download failed: %v\n", err)
			failed = append(failed, agent.ID)
			continue
		}

		// Install new version
		if err := inst.Install(agent.ID, content); err != nil {
			fmt.Printf("   ❌ Installation failed: %v\n", err)
			failed = append(failed, agent.ID)
			continue
		}

		fmt.Printf("   ✅ Updated successfully\n")
		updated = append(updated, agent.ID)
	}

	// Show results
	fmt.Printf("\n📊 Update complete: %d updated, %d failed\n", len(updated), len(failed))
	
	if len(failed) > 0 {
		fmt.Printf("❌ Failed updates: %v\n", failed)
	}

	return nil
}

func checkUpdates() error {
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

	var hasUpdates bool

	fmt.Println("Checking for updates...")
	
	for _, agent := range installed {
		metadata, err := client.GetAgentMetadata(agent.ID)
		if err != nil {
			fmt.Printf("❌ %s: Failed to check updates\n", agent.ID)
			continue
		}

		if metadata.Latest != agent.Version {
			fmt.Printf("📦 %s: %s -> %s (update available)\n", 
				agent.ID, agent.Version, metadata.Latest)
			hasUpdates = true
		} else {
			fmt.Printf("✅ %s: %s (up to date)\n", agent.ID, agent.Version)
		}
	}

	if hasUpdates {
		fmt.Println("\nRun 'agents update' to update all agents")
	} else {
		fmt.Println("\nAll agents are up to date!")
	}

	return nil
}
