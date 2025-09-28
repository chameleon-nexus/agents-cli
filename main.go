package main

import (
	"os"

	"github.com/chameleon-nexus/agents-cli/cmd"
)

func main() {
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
