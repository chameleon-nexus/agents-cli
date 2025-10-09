# AGT - AI Agent Management Tool

A command-line interface for managing AI agents from AGTHub.

> **Version 2.0**: Now powered by AGTHub API with real-time search, publishing, and authentication features!

## 🌐 AGTHub - AI Agent Marketplace

**[AGTHub](https://www.agthub.org)** is a comprehensive AI Agent marketplace platform where you can:

- 🔍 **Discover Agents**: Browse thousands of free and premium AI agents
- 📤 **Publish Your Agents**: Share your agents with the community
- 💰 **Monetize**: Offer premium agents for sale
- ⭐ **Rate & Review**: Help others find the best agents
- 🌍 **Multi-language**: Support for English, Chinese, Japanese, and Vietnamese

> 💡 **Tip**: You can manage everything through the [AGTHub website](https://www.agthub.org) with a beautiful UI, or use this CLI for quick operations!

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
# 1. Login to AGTHub
agt login

# 2. Search for agents
agt search python

# 3. Install an agent
agt install author/agent-name

# 4. Create and publish your own agent
agt init
# ... fill in the metadata ...
agt publish my-agent.md
```

## 📖 Commands

### Authentication

```bash
# Login to AGTHub (required for publishing)
agt login

# You'll receive a verification code via email
# Enter the code to complete authentication
```

> 🌐 **Alternative**: You can also login through the [AGTHub website](https://www.agthub.org/login)

### Create Agent

```bash
# Initialize a new agent with guided prompts
agt init

# This creates a template file with metadata:
# - Agent ID, version, category
# - Multi-language names and descriptions
# - Tags and compatibility info
```

The `agt init` command will guide you through:
1. **Basic Info**: Agent ID, version, category
2. **Descriptions**: English (required), Chinese, Japanese, Vietnamese (optional)
3. **Tags**: Relevant keywords for discoverability
4. **Content**: Write your agent's instructions

### Publish Agent

```bash
# Publish your agent to AGTHub
agt publish my-agent.md

# Publishing a new version automatically replaces old versions
# No need to manually delete or manage versions!
```

> 🌐 **Web Alternative**: You can also publish agents through the [AGTHub Dashboard](https://www.agthub.org/dashboard)

### Search Agents

```bash
# Search all free agents
agt search

# Search by keyword
agt search "code review"

# Search by category
agt search --category development

# Filter by language
agt search --language zh        # Chinese agents only
agt search --language en        # English agents only
agt search --language ja        # Japanese agents only
agt search --language vi        # Vietnamese agents only

# Combined filters
agt search "Python" --language zh --category development

# Sort results
agt search --sort downloads
agt search --sort rating
```

> 📝 **Note**: The CLI only shows **free agents**. To browse premium agents, visit [AGTHub Paid Section](https://www.agthub.org/paid)

### Install Agents

```bash
# Install an agent
agt install author/agent-name

# Install specific version
agt install author/agent-name@1.0.0

# Install to specific target directory
agt install author/agent-name --target claude-code

# Install multiple agents
agt install author/agent1 author/agent2

# Force reinstall (overwrite existing)
agt install author/agent-name --force
```

### Uninstall Agents

```bash
# Uninstall an agent
agt uninstall author/agent-name

# Uninstall from specific target
agt uninstall author/agent-name --target claude-code

# Uninstall multiple agents
agt uninstall author/agent1 author/agent2
```

### Configuration

```bash
# Show current configuration
agt config

# This shows your API URL and other settings
```

### Help

```bash
# Show all commands
agt --help

# Show command-specific help
agt search --help
agt install --help
agt publish --help
```

## ⚙️ Configuration

The CLI stores configuration at `~/.agents-cli/config.yaml`:

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

## 🎯 Supported CLI Tools

- **Claude Code**: Official Claude CLI tool
- **Codex**: OpenAI Codex CLI
- **Copilot**: GitHub Copilot CLI

## 📝 Agent File Format

When you run `agt init`, it creates a file with the following structure:

```markdown
---
id: my-agent
version: 1.0.0
category: development
name_en: My Agent
description_en: A helpful AI agent
name_zh: 我的代理
description_zh: 一个有用的AI代理
tags: [python, coding, helper]
---

# Agent Instructions

Your agent's instructions go here...
```

## 🌐 AGTHub Features

### For Users
- **Free Agents**: Thousands of community-contributed agents
- **Premium Agents**: Professional agents with advanced features
- **Web Dashboard**: Manage your agents with a beautiful UI
- **Multi-language**: Full support for zh, en, ja, vi
- **Ratings & Reviews**: Community feedback system

### For Developers
- **Easy Publishing**: CLI or web-based publishing
- **Version Management**: Automatic version replacement
- **Analytics**: Download counts and ratings
- **Monetization**: Sell premium agents (coming soon)

### For Enterprises
- **Enterprise Login**: Special access for teams
- **Free Premium Access**: Access paid agents at no cost
- **Bulk Management**: Manage multiple agents efficiently

## 🔧 Troubleshooting

### Authentication Issues
```bash
# If login fails, try accessing the web interface:
# Visit: https://www.agthub.org/login
```

### Publishing Issues
```bash
# Make sure you're logged in
agt login

# Check your agent file format
# Use 'agt init' to generate a valid template
```

### Installation Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install -g @chameleon-nexus/agents-cli
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/chameleon-nexus/agents-cli.git
cd agents-cli

# Install dependencies
npm install

# Build the project
npm run build

# Test locally
node dist/cli.js --help

# Run tests
npm test

# Lint code
npm run lint
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **AGTHub Website**: [https://www.agthub.org](https://www.agthub.org)
- **AGTHub Dashboard**: [https://www.agthub.org/dashboard](https://www.agthub.org/dashboard)
- **Premium Agents**: [https://www.agthub.org/paid](https://www.agthub.org/paid)
- **VS Code Extension**: [Chameleon](https://github.com/chameleon-nexus/Chameleon)
- **GitHub Repository**: [agents-cli](https://github.com/chameleon-nexus/agents-cli)

## 💡 Tips

- 🌐 **Use the Web UI**: For a better experience, visit [AGTHub](https://www.agthub.org)
- 🔐 **Stay Logged In**: Your CLI session persists across commands
- 📦 **Version Control**: Publishing a new version replaces the old one automatically
- 🆓 **Free First**: CLI only shows free agents; browse premium agents on the website
- 🌍 **Multi-language**: Write descriptions in multiple languages for better reach

## ❓ FAQ

**Q: Can I sell agents through the CLI?**  
A: Publishing is free for all users. Premium agent features are managed through the [AGTHub website](https://www.agthub.org).

**Q: How do I update my published agent?**  
A: Simply publish again with a new version number using `agt publish`. Old versions are automatically replaced.

**Q: Can I download premium agents via CLI?**  
A: No, premium agents are only available through the [AGTHub website](https://www.agthub.org/paid) to ensure proper licensing and payment.

**Q: What languages are supported?**  
A: Agent descriptions can be in English, Chinese (简体), Japanese, and Vietnamese. The CLI interface is in English.

---

Made with ❤️ by the AGTHub Team
