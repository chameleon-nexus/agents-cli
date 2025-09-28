package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
	"github.com/chameleon-nexus/agents-cli/pkg/registry"
)

var searchCmd = &cobra.Command{
	Use:   "search [query]",
	Short: "Search for agents in the registry",
	Long: `Search for agents by name, description, tags, or other criteria.

Examples:
  agents search "code review"           # Search by text
  agents search --category=development  # Filter by category  
  agents search --tag=security         # Filter by tag
  agents search --author="Chameleon Team"  # Filter by author
  agents search --sort=downloads       # Sort by downloads`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		query := ""
		if len(args) > 0 {
			query = args[0]
		}

		// Get flags
		category, _ := cmd.Flags().GetString("category")
		tag, _ := cmd.Flags().GetString("tag")
		author, _ := cmd.Flags().GetString("author")
		sortBy, _ := cmd.Flags().GetString("sort")
		limit, _ := cmd.Flags().GetInt("limit")

		// Create registry client
		client := registry.NewClient()

		// Build search filters
		filters := registry.SearchFilters{
			Category: category,
			Tag:      tag,
			Author:   author,
			SortBy:   sortBy,
			Limit:    limit,
		}

		// Execute search
		agents, err := client.SearchAgents(query, filters)
		if err != nil {
			return fmt.Errorf("search failed: %w", err)
		}

		// Display results
		if len(agents) == 0 {
			fmt.Println("No agents found matching your criteria")
			return nil
		}

		fmt.Printf("Found %d agent(s):\n\n", len(agents))
		for _, agent := range agents {
			printAgentSummary(agent)
			fmt.Println()
		}

		return nil
	},
}

func init() {
	// Add flags
	searchCmd.Flags().String("category", "", "Filter by category")
	searchCmd.Flags().String("tag", "", "Filter by tag")
	searchCmd.Flags().String("author", "", "Filter by author")
	searchCmd.Flags().String("sort", "downloads", "Sort by (downloads, rating, name)")
	searchCmd.Flags().Int("limit", 20, "Limit number of results")
}

func printAgentSummary(agent registry.Agent) {
	fmt.Printf("📦 %s (%s)\n", agent.Name.En, agent.ID)
	fmt.Printf("   %s\n", agent.Description.En)
	fmt.Printf("   📊 Downloads: %d  ⭐ Rating: %.1f  📂 Category: %s\n", 
		agent.Downloads, agent.Rating, agent.Category)
	
	if len(agent.Tags) > 0 {
		fmt.Printf("   🏷️  Tags: %s\n", strings.Join(agent.Tags, ", "))
	}
	
	fmt.Printf("   💾 Install: agents install %s\n", agent.ID)
}
