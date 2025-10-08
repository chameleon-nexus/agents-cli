# AGT CLI Configuration Guide

## 配置文件位置

配置文件存储在：
- **Windows**: `%USERPROFILE%\.agents-cli\config.yaml`
- **Linux/Mac**: `~/.agents-cli/config.yaml`

## 快速切换环境

### 1. 查看当前配置

```bash
agt config
# or
agt config show
```

输出示例：
```
📋 Current Configuration:
Config file: C:\Users\your-name\.agents-cli\config.yaml

🌐 AGTHub API:
  URL: https://www.agthub.org
  Environment: production

👤 Authentication:
  Email: user@example.com
  Name: User Name
  Logged in: ✓ Yes

📦 Registry:
  URL: https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master
  Cache TTL: 300s
```

### 2. 切换到本地开发环境

```bash
agt config use-env local
```

这会将API URL设置为 `http://localhost:3000`

### 3. 切换到生产环境

```bash
agt config use-env production
```

这会将API URL设置为 `https://www.agthub.org`

### 4. 设置自定义URL

```bash
agt config set-url https://your-custom-domain.com
```

### 5. 交互式编辑配置

```bash
agt config edit
```

这会引导你逐项配置所有选项。

### 6. 重置为默认配置

```bash
agt config reset
```

## 预定义环境

| 环境 | URL | 用途 |
|------|-----|------|
| `local` | `http://localhost:3000` | 本地开发测试 |
| `production` | `https://www.agthub.org` | 生产环境 |
| `staging` | `https://agthub-staging.vercel.app` | 测试环境（如果有） |

## 使用场景

### 场景1：本地开发测试

```bash
# 1. 启动本地AGTHub服务器
cd agthub
npm run dev

# 2. 切换CLI到本地环境
agt config use-env local

# 3. 登录本地环境
agt login

# 4. 发布测试Agent
agt publish .cursor/agent.md

# 5. 测试完成后切回生产环境
agt config use-env production
```

### 场景2：使用自定义域名

```bash
# 设置你自己的AGTHub部署
agt config set-url https://agthub.your-company.com

# 登录
agt login

# 发布Agent
agt publish
```

### 场景3：多环境切换

```bash
# 开发环境测试
agt config use-env local
agt login
agt publish

# 切换到生产环境发布
agt config use-env production
agt login
agt publish
```

## 配置文件格式

`~/.agents-cli/config.yaml` 示例：

```yaml
registry:
  url: https://raw.githubusercontent.com/chameleon-nexus/agents-registry/master
  cacheTtl: 300
install:
  target: claude-code
  directory: /Users/your-name/.agents
logging:
  level: info
apiUrl: https://www.agthub.org
email: your-email@example.com
userName: Your Name
token: agt_1234567890abcdef...
```

## 注意事项

⚠️ **重要提示**：
1. 切换环境后需要重新登录（`agt login`）
2. 每个环境的Token是独立的
3. 配置文件包含敏感信息（Token），请妥善保管
4. 本地环境需要先启动AGTHub开发服务器

## 故障排除

### 问题：切换环境后无法登录

**解决方案**：
```bash
# 1. 确认当前环境配置
agt config

# 2. 如果是本地环境，确保本地服务器正在运行
# 3. 重新登录
agt login
```

### 问题：忘记当前使用的环境

**解决方案**：
```bash
agt config
# 查看 "Environment" 字段
```

### 问题：配置文件损坏

**解决方案**：
```bash
# 重置为默认配置
agt config reset

# 或者手动删除配置文件
# Windows: del %USERPROFILE%\.agents-cli\config.yaml
# Linux/Mac: rm ~/.agents-cli/config.yaml
```

## 快捷命令总结

```bash
agt config                          # 查看配置
agt config use-env local            # 切换到本地
agt config use-env production       # 切换到生产
agt config set-url <url>           # 设置自定义URL
agt config edit                     # 交互式编辑
agt config reset                    # 重置配置
```


