# Agents CLI

A command-line interface for managing AI agents from the Chameleon Agents Registry.

## 🚀 Installation

```bash
# Install globally via npm
npm install -g @chameleon-nexus/agents-cli

# Verify installation
agents --version
agents --help
```

## ⚡ Quick Start

```bash
# Search for Python-related agents
agents search python

# Install a popular agent
agents install python-pro

# List all your installed agents
agents list --installed

# Check for updates
agents update --check
```

## 📖 Usage

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

# Filter by CLI compatibility
agents search --compatibility claude-code

# Sort results
agents search --sort downloads
agents search --sort rating
```

### Install Agents
```bash
# Install specific agent
agents install python-pro

# Install specific version
agents install python-pro --version 1.0.0

# Install to specific CLI target
agents install python-pro --target claude-code
agents install python-pro --target codex
agents install python-pro --target copilot

# Install multiple agents
agents install python-pro code-reviewer debugger

# Force reinstall (overwrite existing)
agents install python-pro --force

# Dry run (preview only, no actual installation)
agents install python-pro --dry-run

# Skip confirmation prompts
agents install python-pro --yes
```

### List Agents
```bash
# List all available agents
agents list

# List installed agents
agents list --installed

# List by category
agents list --category development

# Check for updates
agents list --updates

# JSON output
agents list --json
```

### Update Agents
```bash
# Update all agents
agents update

# Update specific agents
agents update python-pro code-reviewer

# Check for updates only
agents update --check

# Dry run
agents update --dry-run
```

### Configuration
```bash
# Show current config
agents config --show

# Edit config interactively
agents config --edit

# Reset to defaults
agents config --reset
```

## ⚙️ Configuration

The CLI creates a configuration file at `~/.agents-cli/config.yaml`:

```yaml
registry:
  url: https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master
  cacheTtl: 300

install:
  target: claude-code
  directory: ~/.agents

logging:
  level: info
```

## 🎯 Supported CLI Tools

- **Claude Code**: Official Claude CLI tool
- **Codex**: OpenAI Codex CLI
- **Copilot**: GitHub Copilot CLI

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/chameleon-nexus/agents-cli.git
cd agents-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev search

# Run tests
npm test

# Lint code
npm run lint
```

## 📦 Publishing

The package is published to npm as `@chameleon-nexus/agents-cli`.

For maintainers:
```bash
# Build and publish to npm
npm run build
npm publish --access public

# Create git tag for release
git tag v1.0.0
git push origin v1.0.0
```

## 🌐 API

The CLI communicates with the Agents Registry via GitHub Raw API:

- **Registry Index**: `https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master/registry.json`
- **Agent Metadata**: `https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master/agents/{author}/{id}/metadata.json`
- **Agent File**: `https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master/agents/{author}/{id}/agent.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Chameleon Agents Registry](https://github.com/chameleon-nexus/agents-registry)
- [VS Code Extension](https://github.com/chameleon-nexus/Chameleon)
- [Documentation](https://github.com/chameleon-nexus/agents-cli/docs)