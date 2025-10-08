# Changelog

All notable changes to the AGT CLI will be documented in this file.

## [2.0.0] - 2025-10-08

### 🚀 Major Changes (Breaking)
- **完全迁移到 AGTHub API**: 不再使用 GitHub Registry 静态文件
- **实时搜索**: 所有搜索直接从 AGTHub 数据库查询，支持实时更新
- **统一数据源**: 搜索、下载、列表等所有功能统一使用 AGTHub API

### ✨ New Features
- ✅ 实时搜索刚发布的代理（如 test123）
- ✅ 支持搜索所有已发布的代理，无需等待同步
- ✅ 更准确的下载统计和评分数据
- ✅ 支持付费代理的识别和展示

### 🔧 Technical Changes
- 重构 `RegistryService` 使用 `/api/agents/search` API
- 下载功能使用 `/api/agents/[id]/download` API
- 移除所有 GitHub Registry 相关代码
- 简化缓存逻辑，提高响应速度

### ⚠️ Breaking Changes
- 配置中的 `registry.url` 现在指向 AGTHub API 而非 GitHub
- 旧版本的缓存数据将不再使用

### 📦 Migration Guide
```bash
# 更新到最新版本
npm update -g @chameleon-nexus/agents-cli

# 清除旧配置（可选）
agt config reset

# 重新登录
agt login
```

## [1.7.0] - 2025-10-08

### Changed
- 🌐 Updated default API URL from `https://agthub-qexf.vercel.app` to `https://www.agthub.org`
- 📝 Updated all documentation to reflect the new official domain
- 🔧 Updated production environment configuration

### Details
- All API endpoints now point to the official AGTHub domain
- Registry URL updated to use the new domain
- Configuration defaults updated for new users
- Existing users: Run `agt config use-env production` to update

## [1.6.2] - 2025-10-07

### Features
- ✅ Full CLI implementation with search, install, publish
- 🔐 Email verification login system
- 📤 Agent publishing with multi-language support
- 🔍 Advanced search with filters (category, tag, language, compatibility)
- 📦 Agent installation and management
- ⚙️ Configuration management
- 🌐 Multi-environment support (local, production, staging)

### Supported Commands
- `agt search` - Search for agents
- `agt install` - Install agents
- `agt uninstall` - Uninstall agents
- `agt list` - List agents
- `agt update` - Update agents
- `agt login` - Login to AGTHub
- `agt publish` - Publish agents
- `agt config` - Manage configuration

## Migration Guide

If you're upgrading from an older version:

```bash
# Update to the latest version
npm update -g @chameleon-nexus/agents-cli

# Switch to the new production URL
agt config use-env production

# Re-authenticate
agt login
```

