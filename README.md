# AGT - AI Agent Management Tool

A command-line interface for managing AI agents from AGTHub.

> **Version 2.0**: Now powered by AGTHub API with real-time search, publishing, and authentication features!

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

# Install a popular agent (use author/agent-name format)
agt install wshobson/code-reviewer

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
# Install specific agent (use author/agent-name format)
agt install wshobson/code-reviewer

# Install specific version
agt install wshobson/code-reviewer@1.0.0

# Install to specific CLI target
agt install wshobson/code-reviewer --target claude-code
agt install wshobson/code-reviewer --target codex
agt install wshobson/code-reviewer --target copilot

# Install multiple agents
agt install wshobson/code-reviewer another-author/python-pro

# Force reinstall (overwrite existing)
agt install wshobson/code-reviewer --force

# Dry run (preview only, no actual installation)
agt install wshobson/code-reviewer --dry-run

# Skip confirmation prompts
agt install wshobson/code-reviewer --yes
```

### Uninstall Agents
```bash
# Uninstall specific agent
agt uninstall wshobson/code-reviewer

# Uninstall from specific CLI target
agt uninstall wshobson/code-reviewer --target claude-code

# Uninstall multiple agents
agt uninstall wshobson/code-reviewer another-author/python-pro
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
agt update wshobson/code-reviewer another-author/python-pro

# Check for updates only
agt update --check

# Dry run
agt update --dry-run
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

The CLI creates a configuration file at `~/.agents-cli/config.yaml`:

```yaml
registry:
  url: https://www.agthub.org
  cacheTtl: 300

install:
  target: claude-code
  directory: ~/.agents

logging:
  level: info

apiUrl: https://www.agthub.org
```

See [CONFIG.md](CONFIG.md) for detailed configuration options.

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

The CLI communicates with AGTHub via REST API:

- **Search Agents**: `https://www.agthub.org/api/agents/search`
- **Download Agent**: `https://www.agthub.org/api/agents/[id]/download`
- **Publish Agent**: `https://www.agthub.org/api/cli/agents/publish`
- **Authentication**: `https://www.agthub.org/api/cli/login`

All searches are real-time from the AGTHub database!

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