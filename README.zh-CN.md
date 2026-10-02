# Digital Garden Engine

一个开源、静态优先的数字花园引擎，用于承载文章、笔记、项目与个人知识。

**Status:** 🔵 Research

它采用本地优先的工作方式，支持 Markdown 和 MDX，生成静态网站，并通过明确的发布边界把公开代码与私人内容分开。

- **在线演示：** 暂不声称已有公开演示。仓库自带一套完整的虚构示例，可本地运行。
- **截图：** 运行 `npm run dev`，然后在浏览器打开 `http://localhost:3000`。
- **快速开始：** 跳到[五分钟运行 Demo](#五分钟运行-demo)。
- **文档：** 查看[文档索引](#文档)。
- **许可证：** Mozilla Public License 2.0，见 [LICENSE](LICENSE)。

## 它是什么

- 面向 Markdown 和 MDX 的本地优先写作系统。
- 公开站点不需要数据库的静态发布流程。
- 可 fork 和修改的 Next.js、React、TypeScript 引擎。
- 把草稿和私人笔记挡在公开产物之外的 Publication Gate 设计。
- 可用于个人网站、数字花园、写作存档和项目笔记的起点。

## 它不是什么

- 不是托管型博客服务。
- 不是 CMS SaaS。
- 不是 AI 写作平台。
- 不会自行把笔记上传到任何地方。
- 不承诺“仓库设成 Private”就足以防止内容进入公开构建。

## 核心架构

```text
Markdown / MDX
      │
      ▼
content:validate
      │
      ▼
Publication Gate
      │
      ▼
.build/public-content
      │
      ▼
Next.js 静态导出
      │
      ▼
artifact:audit
      │
      ▼
Cloudflare Pages
```

推荐的进阶架构把公开软件与私人内容分开：

```text
PUBLIC ENGINE
styayur/digital-garden-engine
        │ 固定 ref
        ▼
PRIVATE CONTENT
content/ + site.config.ts
        │
        ▼
GitHub Actions
        │ validate + stage + build + audit
        ▼
PUBLIC ARTIFACT
out/
        │
        ▼
Cloudflare Pages
```

任何人都可以 clone 引擎。私人内容仓库继续保持 Private。Cloudflare 只接收生成后的静态产物。

## 五分钟运行 Demo

你需要 Git 和 Node.js 22 或更新版本。Git 用来下载代码，Node.js 用来在你的电脑上运行网站。

### Windows PowerShell

```powershell
git clone https://github.com/styayur/digital-garden-engine.git
cd digital-garden-engine
npm install
npm run dev
```

### macOS 或 Linux

```bash
git clone https://github.com/styayur/digital-garden-engine.git
cd digital-garden-engine
npm install
npm run dev
```

在浏览器打开 `http://localhost:3000`。`localhost` 表示运行在你自己的电脑上的网站。网站使用期间请保持终端窗口不要关闭。

Demo 使用 `examples/content/` 中的虚构内容。

## 前置条件

### Git

Git 是版本控制工具，本项目用它下载引擎并跟踪修改。

检查是否已经安装：

```bash
git --version
```

如果没有这个命令，请从 https://git-scm.com/downloads 安装 Git。

### Node.js

Node.js 负责运行构建工具。本项目要求 Node.js 22 或更新版本，推荐 Node.js 22 或 24 LTS。

检查版本：

```bash
node --version
npm --version
```

从 https://nodejs.org/ 下载 Node.js。安装完成后重新打开终端。

## 写第一篇文章

创建 `examples/content/published/posts/hello-world.mdx`：

```md
---
title: "Hello World"
slug: "hello-world"
date: "2026-10-01"
status: "published"
description: "My first garden note."
tags:
  - hello
maturity: "seedling"
---

# Hello

This is my first note.
```

运行：

```bash
npm run dev
```

然后打开 `http://localhost:3000/writing/hello-world`。

`maturity` 是可选项，用来表示笔记的成熟度。它和发布状态 `status` 是两件事。

## Published、Draft 和 Private

```text
published = 可以进入公开网站
draft     = 只用于本地或私人环境
private   = 永远不能进入公开构建
```

内容契约如下：

```text
content/
├── published/
│   ├── posts/
│   ├── projects/
│   ├── library/
│   └── assets/
├── drafts/
└── private/
```

Private Git 仓库很有价值，但它本身不是 Publication Gate。真正的 gate 是软件检查：哪些文件可以被放进公开构建。

公开构建会：

1. 校验所有内容状态；
2. 只读取 `published/`；
3. 把公开内容暂存到 `.build/public-content/`；
4. 只从这个暂存目录构建 Next.js；
5. 排除 `app/admin` 和 `app/api`；
6. 在部署前审计生成产物。

`publish`、`public`、`hidden`、拼写错误或未定义状态都会让构建失败。它们不会默认变成公开。

## Public Engine + Private Content

如果你可以公开引擎、内容和部署配置，可以使用单仓库。如果草稿、私人笔记或个人配置必须保密，就使用双仓库。

个人知识花园推荐：

```text
public engine repository
private content repository
GitHub Actions
Cloudflare Pages Direct Upload
```

私人仓库保存 `content/`、`site.config.ts` 和 `engine.lock.json`。工作流会 checkout 固定版本的公开引擎，把私人配置复制进该 checkout，然后执行和本地相同的 `npm run build:public`。

详见 [docs/private-content.md](docs/private-content.md)。

## 目录结构

```text
app/          Next.js 路由、布局、metadata 和可选的 admin
components/   可复用界面组件
lib/          内容读取、站点配置和 MDX 渲染
scripts/      校验、暂存、构建、链接检查和 artifact 审计
public/       引擎自身提交的静态文件
examples/     完整虚构 Demo
fixtures/     Publication Gate canary fixtures
tests/        自动化回归测试
docs/         架构、部署、schema、安全和故障排查文档
```

普通用户通常只需要修改：

- `site.config.ts`
- 自己的内容目录
- 公开资源目录

通常不需要修改：

- `scripts/`
- `lib/content-root.ts`
- Publication Gate
- artifact audit

## 命令参考

| 命令 | 作用 | 何时运行 | 常见失败 |
| --- | --- | --- | --- |
| `npm run dev` | 使用暂存的示例内容启动开发服务器。 | 写作期间。 | Node 版本过低；端口被占用。 |
| `npm run typecheck` | 检查 TypeScript。 | 提交前。 | 类型接口或组件发生变化。 |
| `npm test` | 运行单元测试和发布边界测试。 | 提交前和 CI。 | canary 越界或 fixture 无效。 |
| `npm run content:validate` | 校验 frontmatter、slug、日期、状态、重复项、链接和资源。 | 修改内容后。 | frontmatter 无效或不受支持。 |
| `npm run content:stage` | 只把 published 内容暂存到 `.build/public-content/`。 | 调试 Publication Gate。 | published 条目无效。 |
| `npm run build:public` | 校验、暂存、静态导出、检查链接并审计产物。 | 部署前。 | 构建、链接或审计失败。 |
| `npm run check:links` | 检查 `out/` 内部链接。 | 公开构建后。 | 链接指向缺失页面或资源。 |
| `npm run artifact:audit` | 扫描 `out/` 是否有泄露或禁用文件。 | 公开构建后。 | 发现 canary、secret、source map 或 admin 路由。 |
| `npm run build` | 构建完整私有/开发应用，包括 admin 和 API。 | 仅限私人开发。 | 这不是公开部署目标。 |

## 自定义

打开 `site.config.ts` 修改：

- 名称
- initials
- role
- intro
- description
- author
- locale
- 规范 URL
- terminal prompt 身份
- 导航
- 社交链接
- About 页面资料
- Now 页面数据

视觉相关位置：

- 全局颜色 token：`app/globals.css`
- Tailwind 主题和字体：`tailwind.config.ts`
- 首页组成：`app/page.tsx`
- 卡片与区块：`components/`
- command palette 索引：`app/layout.tsx`
- 知识图谱：`lib/garden.ts`
- favicon：`app/icon.svg`
- SEO 和社交 metadata：`app/layout.tsx`、`app/sitemap.ts`、`app/robots.ts`

详见 [docs/customisation.md](docs/customisation.md)。

## 部署

### 推荐：Cloudflare Pages Direct Upload

构建公开产物：

```bash
npm run build:public
```

结果位于 `out/`。

Wrangler 已认证时：

```bash
npx wrangler pages project create styayur-digital-garden --production-branch main
npx wrangler pages deploy out --project-name=styayur-digital-garden --branch=main
```

Cloudflare 只接收 `out/`，不需要访问私人内容仓库。

完整的新手教程、token 权限、GitHub Secrets 和回滚方式见 [docs/deployment-cloudflare.md](docs/deployment-cloudflare.md)。

### 替代方案：GitHub Pages

如果配置正确，GitHub Pages 也可以托管 `out/`。需要 `.nojekyll` 并保留路由目录。推荐架构仍然把私人内容留在私人仓库，只发布 `out/`。

### 本地静态服务器

执行 `npm run build:public` 后：

```bash
cd out
python -m http.server 8080
```

打开 `http://localhost:8080`。

## Cloudflare 检查清单

1. 创建 Cloudflare 账号。
2. 在 Workers & Pages 中找到 Account ID。
3. 创建自定义 API Token，权限为 **Account → Cloudflare Pages → Edit**。
4. 把 token 限制到正确账号。
5. 在私人内容仓库的 GitHub Actions 中添加 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` secrets。
6. 创建 Pages project。
7. push 到 `main`，或手动运行部署 workflow。
8. 打开 Actions 运行结果，确认 validate、build 和 audit 都通过。
9. 打开 `.pages.dev` URL。
10. 确认默认生产 URL 通过 smoke test 后，再添加 custom domain。
11. 如有问题，从 Pages deployment history 回滚。

永远不要把 token 提交到仓库。

## 升级固定版本的 Engine

私人内容仓库不应该自动跟随 `main`。要有意识地切换：

1. 查看引擎 changelog。
2. 把 `engine.lock.json` 改成 release tag 或精确 commit。
3. 运行 content validation。
4. 本地运行 public build。
5. 检查 artifact audit。
6. 提交 lock 变更。
7. 部署。
8. 如果内容 schema 不兼容，回滚 pin。

## 故障排查

常见症状和解决方法见 [docs/troubleshooting.md](docs/troubleshooting.md)，包括 npm 不存在、Node 版本过旧、安装失败、端口冲突、文章不出现、slug 重复、frontmatter 无效、链接损坏、图片缺失、Cloudflare 部署失败、secret 缺失、admin 泄露、草稿误发布、静态导出 404、CSS 丢失和 custom domain 问题。

## 安全与隐私

不要把 `.env.local`、API token、密码、私钥或私人内容提交到仓库。

不要把 secret 放进 `NEXT_PUBLIC_*` 环境变量。它们会进入客户端可见产物。

从当前 commit 删除文件，不等于从 Git history 删除。曾经包含私人材料的仓库不能直接改成 Public。

内容一旦公开部署，就应假设它已经被复制。

Preview URL 也可能是公开的。本引擎默认不会自动发布 draft 分支。

完整安全模型见 [docs/security-model.md](docs/security-model.md)。

## FAQ

**可以不用 Cloudflare 吗？**
可以。`npm run build:public` 生成静态目录，可托管在其他地方。

**可以部署到 GitHub Pages 吗？**
可以，但私人内容要继续放在公开引擎仓库之外。

**需要数据库吗？**
不需要。公开站点是静态的。

**可以保持笔记私密吗？**
可以。放在 `drafts/` 或 `private/`，并始终经过 Publication Gate。

**贡献者能看到我的私人内容吗？**
他们能看到公开引擎。除非你授权，否则看不到单独的私人仓库。

**可以用普通 Markdown，而不是 MDX 吗？**
可以。内容条目支持 `.md` 和 `.mdx`。

**可以删除知识图谱吗？**
可以。从 `app/page.tsx` 移除组件，并删除 `/garden` 路由。

**可以修改字体和主题吗？**
可以。修改 `tailwind.config.ts`、`app/globals.css` 和 `app/layout.tsx`。

**可以使用 custom domain 吗？**
可以。先让默认 Cloudflare Pages URL 正常工作，再配置域名。

**可以不要 `/admin` 吗？**
可以。公开静态构建已经排除 `/admin` 和 `/api`。

**可以把内容放在另一个仓库吗？**
可以。这就是推荐的私人内容架构。

**为什么要分离 engine 和 content？**
它可以让私人材料远离公开仓库，并让公开产物只有一条可审计路径。

## 文档

- [Architecture](docs/architecture.md)
- [Private content](docs/private-content.md)
- [Cloudflare deployment](docs/deployment-cloudflare.md)
- [Content schema](docs/content-schema.md)
- [Customisation](docs/customisation.md)
- [Security model](docs/security-model.md)
- [Troubleshooting](docs/troubleshooting.md)

## 术语表

**Repository:** 包含文件和版本历史的 Git 项目。
**Clone:** repository 的本地副本。
**Fork:** GitHub 上某个 repository 的个人副本。
**Branch:** Git 历史中的一条命名分支。
**Commit:** 一次被记录下来的修改快照。
**Pull request:** 请求把修改合并到某个分支。
**Engine:** 此仓库中的可复用软件。
**Content:** 文章、项目、图书馆条目和资源。
**Source of truth:** 修改网站时必须编辑的源文件。
**Dependency:** 项目运行所需的 package。
**Version pinning:** 使用精确版本或 commit，而不是永远使用最新代码。
**Static site:** 由静态文件组成的网站，每次请求不需要应用服务器。
**Build:** 把源文件转换成可部署网站的过程。
**Artifact:** 构建产物，通常是 `out/`。
**Publication gate:** 决定哪些内容可以进入公开构建的校验和暂存软件。
**CI:** Continuous Integration，通常在每次 push 或 pull request 时自动检查。
**CD:** Continuous Delivery 或 Continuous Deployment。
**GitHub Actions:** GitHub 提供的自动化服务。
**Runner:** 执行 GitHub Actions job 的机器。
**Secret:** 自动化使用的加密值，永远不能打印出来。
**Deployment:** 把产物发布到托管服务。
**Production:** 正式公开的网站。
**Preview:** 非生产部署。Preview URL 也可能是公开的。
**Cloudflare Pages:** Cloudflare 提供的静态托管服务。
**Wrangler:** Cloudflare 的部署命令行工具。
**Custom domain:** 例如 `garden.example.com` 的自定义域名。
**Rollback:** 恢复之前的部署或代码版本。

## 路线图

### 当前

- 静态优先的 MDX 引擎，公开代码与私人内容分离。
- Cloudflare Pages Direct Upload 部署路径。

### 下一步

- 发布公开在线演示并完善文档索引。
- 完善固定版本引擎的升级路径文档。

### 未来

- 插件/主题系统与更丰富的发布流水线。

### 暂不计划

- SaaS 托管、用户账号或分析统计。

## 社区

问题、设计讨论和早期反馈欢迎加入 Discord：

https://discord.gg/wA2xy6VPK

这不是 SLA 支持渠道。安全问题不要发到 Discord，请使用 [SECURITY.md](SECURITY.md) 中的私密漏洞报告入口。

## 贡献

提交 pull request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

项目使用 Dependabot 更新 npm 和 GitHub Actions 依赖。

## 许可证

Mozilla Public License 2.0。见 [LICENSE](LICENSE)。

Originally created by Stya Yur.

