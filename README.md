# Agents CLI

A command-line interface for managing AI agents from the Chameleon Agents Registry.

## Installation

```bash
# Install via npm (coming soon)
npm install -g @chameleon-nexus/agents-cli

# Or install from source
git clone https://github.com/chameleon-nexus/agents-cli.git
cd agents-cli
go build -o agents ./cmd/agents
```

## Usage

### Search Agents
```bash
# Search all agents
agents search

# Search by keyword
agents search "code review"

# Search by category
agents search --category development

# Search by tag
agents search --tag typescript
```

### Install Agents
```bash
# Install specific agent
agents install chameleon-team/code-reviewer

# Install to specific CLI
agents install chameleon-team/code-reviewer --cli claude-code

# Install latest version
agents install chameleon-team/code-reviewer@latest

# Install specific version
agents install chameleon-team/code-reviewer@1.0.0
```

### List Agents
```bash
# List all available agents
agents list

# List installed agents
agents list --installed

# List by category
agents list --category development
```

### Agent Information
```bash
# Show agent details
agents info chameleon-team/code-reviewer

# Show agent versions
agents versions chameleon-team/code-reviewer
```

### Publish Agents
```bash
# Publish new agent (coming soon)
agents publish ./my-agent.md

# Update existing agent
agents update chameleon-team/my-agent ./my-agent.md
```

## Configuration

The CLI uses a configuration file at `~/.agents-cli/config.json`:

```json
{
  "registry": "https://raw.githubusercontent.com/chameleon-nexus/agents-registry/main",
  "defaultCli": "claude-code",
  "installPath": "~/.agents",
  "cacheExpiry": 3600
}
```

## Supported CLI Tools

- **Claude Code**: Official Claude CLI tool
- **Codex**: OpenAI Codex CLI (coming soon)
- **Copilot**: GitHub Copilot CLI (coming soon)

## Development

```bash
# Clone the repository
git clone https://github.com/chameleon-nexus/agents-cli.git
cd agents-cli

# Install dependencies
go mod tidy

# Build
go build -o agents ./cmd/agents

# Run tests
go test ./...

# Run with development registry
export AGENTS_REGISTRY_URL="http://localhost:8080"
./agents search
```

## API

The CLI communicates with the Agents Registry via GitHub Raw API:

- **Registry Index**: `GET /registry.json`
- **Agent Metadata**: `GET /agents/{author}/{name}/metadata.json`
- **Agent File**: `GET /agents/{author}/{name}/agent.md`

## License

MIT License
