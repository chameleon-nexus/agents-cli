# AGT - AI Agent Management Tool

A command-line interface for managing AI agents from the Chameleon Agents Registry.

> **Note**: This is a simplified version focused on browsing, searching, and installing agents. Publishing and authentication features will be added in future releases.

## 🚀 Installation

```bash
# Install globally via npm
npm install -g @chameleon-nexus/agents-cli

# Verify installation
agt --version
agt --help
```

## ⚡ Quick Start

```bash
# Search for Python-related agents
agt search python

# Install a popular agent
agt install python-pro

# List all your installed agents
agt list --installed

# Check for updates
agt update --check
```

## 📖 Usage

### Search Agents
```bash
# Search all agents
agt search

# Search by keyword
agt search "code review"

# Search by category
agt search --category development

# Search by tag
agt search --tag typescript

# Filter by CLI compatibility
agt search --compatibility claude-code

# Filter by language (only show agents with content in specified language)
agt search --language zh        # Only Chinese agents
agt search --language en        # Only English agents
agt search --language ja        # Only Japanese agents

# Combined filters
agt search "Python" --language zh --category development

# Sort results
agt search --sort downloads
agt search --sort rating
```

### Install Agents
```bash
# Install specific agent
agt install python-pro

# Install specific version
agt install python-pro --version 1.0.0

# Install to specific CLI target
agt install python-pro --target claude-code
agt install python-pro --target codex
agt install python-pro --target copilot

# Install multiple agents
agt install python-pro code-reviewer debugger

# Force reinstall (overwrite existing)
agt install python-pro --force

# Dry run (preview only, no actual installation)
agt install python-pro --dry-run

# Skip confirmation prompts
agt install python-pro --yes
```

### List Agents
```bash
# List all available agents
agt list

# List installed agents
agt list --installed

# List by category
agt list --category development

# Check for updates
agt list --updates

# JSON output
agt list --json
```

### Update Agents
```bash
# Update all agents
agt update

# Update specific agents
agt update python-pro code-reviewer

# Check for updates only
agt update --check

# Dry run
agt update --dry-run
```

### Publish Agents
```bash
# Publish a single agent
agt publish my-agent.md

# Validate agent format only
agt publish my-agent.md --validate

# Publish all agents in a directory
agt publish --batch ./my-agents

# Update existing agent
agt publish my-agent.md --update

# Dry run (preview what would be published)
agt publish my-agent.md --dry-run

# Skip confirmation prompts
agt publish my-agent.md --yes

# Override author and category
agt publish my-agent.md --author myname --category development
```

### Configuration
```bash
# Show current config
agt config --show

# Edit config interactively
agt config --edit

# Reset to defaults
agt config --reset
```

## ⚙️ Configuration

The CLI creates a configuration file at `~/.agt/config.yaml`:

```yaml
registry:
  url: https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master
  cacheTtl: 300

install:
  target: claude-code
  directory: ~/.agt/agents

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

# Test the CLI locally
node dist/cli.js --help

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