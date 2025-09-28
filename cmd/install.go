package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/chameleon-nexus/agents-cli/pkg/registry"
	"github.com/chameleon-nexus/agents-cli/pkg/installer"
)

var installCmd = &cobra.Command{
	Use:   "install [agent-id...]",
	Short: "Install agents to your local environment",
	Long: `Install one or more agents to your local Claude Code directory.

Examples:
  agents install code-reviewer         # Install latest version
  agents install code-reviewer@1.2.0   # Install specific version
  agents install agent1 agent2 agent3  # Install multiple agents
  agents install --all-free            # Install all free agents
  agents install --from-file list.txt  # Install from file`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := registry.NewClient()
		inst := installer.NewClaudeCodeInstaller()

		// Get flags
		version, _ := cmd.Flags().GetString("version")
		target, _ := cmd.Flags().GetString("target")
		allFree, _ := cmd.Flags().GetBool("all-free")
		fromFile, _ := cmd.Flags().GetString("from-file")
		dryRun, _ := cmd.Flags().GetBool("dry-run")

		var agentSpecs []string

		// Handle different installation modes
		if allFree {
			// Get all free agents
			agents, err := client.GetAllAgents()
			if err != nil {
				return fmt.Errorf("failed to get agent list: %w", err)
			}
			
			for _, agent := range agents {
				agentSpecs = append(agentSpecs, agent.ID)
			}
		} else if fromFile != "" {
			// Read agent list from file
			content, err := os.ReadFile(fromFile)
			if err != nil {
				return fmt.Errorf("failed to read file: %w", err)
			}
			
			lines := strings.Split(string(content), "\n")
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line != "" && !strings.HasPrefix(line, "#") {
					agentSpecs = append(agentSpecs, line)
				}
			}
		} else {
			// Use command line arguments
			agentSpecs = args
		}

		if len(agentSpecs) == 0 {
			return fmt.Errorf("please specify agents to install")
		}

		// Install each agent
		var failed []string
		for _, spec := range agentSpecs {
			agentID, agentVersion := parseAgentSpec(spec)
			
			fmt.Printf("🔄 Installing %s", agentID)
			if agentVersion != "" {
				fmt.Printf("@%s", agentVersion)
			}
			fmt.Println("...")

			if dryRun {
				fmt.Printf("   [DRY RUN] Would install to: %s\n", inst.GetInstallPath(agentID))
				continue
			}

			err := installAgent(client, inst, agentID, agentVersion, target)
			if err != nil {
				fmt.Printf("   ❌ Installation failed: %v\n", err)
				failed = append(failed, agentID)
			} else {
				fmt.Printf("   ✅ Installation successful\n")
			}
		}

		// Show installation results
		fmt.Printf("\n📊 Installation complete: %d successful, %d failed\n", 
			len(agentSpecs)-len(failed), len(failed))
		
		if len(failed) > 0 {
			fmt.Printf("❌ Failed agents: %s\n", strings.Join(failed, ", "))
			return fmt.Errorf("some agents failed to install")
		}

		return nil
	},
}

func init() {
	// Add flags
	installCmd.Flags().String("version", "", "Specify version")
	installCmd.Flags().String("target", "claude-code", "Installation target (claude-code, codex)")
	installCmd.Flags().Bool("all-free", false, "Install all free agents")
	installCmd.Flags().String("from-file", "", "Read agent list from file")
	installCmd.Flags().Bool("dry-run", false, "Preview installation operations")
}

func parseAgentSpec(spec string) (string, string) {
	if strings.Contains(spec, "@") {
		parts := strings.SplitN(spec, "@", 2)
		return parts[0], parts[1]
	}
	return spec, ""
}

func installAgent(client *registry.Client, inst *installer.ClaudeCodeInstaller, agentID, version, target string) error {
	// 1. Get agent metadata
	metadata, err := client.GetAgentMetadata(agentID)
	if err != nil {
		return fmt.Errorf("failed to get metadata: %w", err)
	}

	// 2. Determine version
	if version == "" {
		version = metadata.Latest
	}

	// 3. Check compatibility
	if !inst.IsCompatible(metadata.Compatibility) {
		return fmt.Errorf("agent is not compatible with current Claude Code version")
	}

	// 4. Download agent content
	content, err := client.DownloadAgent(agentID, version)
	if err != nil {
		return fmt.Errorf("download failed: %w", err)
	}

	// 5. Install locally
	if err := inst.Install(agentID, content); err != nil {
		return fmt.Errorf("installation failed: %w", err)
	}

	return nil
}
