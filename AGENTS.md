# GitLab UI React 项目指南

## 项目定位

- 本仓库将 GitLab 的 Pajamas Design System / GitLab UI 从 Vue 移植到 React，并使用 pnpm workspace 组织为 monorepo。
- 当前上游源码与设计规范位于 https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com 和 https://design.gitlab.com/ 。旧的 https://gitlab.com/gitlab-org/gitlab-ui 已归档；不要把旧仓库当作当前来源。
- 根依赖 `@gitlab/ui` 是可供对照的 Vue 实现快照，其包内 `repository.directory` 指向上游 `packages/gitlab-ui`。需要确认最新行为时，以当前上游源码、组件文档、stories 和测试为准。
- 移植目标是保持可观察行为、视觉语义和可访问性，同时提供符合 React 习惯的实现；不要引入 Vue 运行时或在 React 中模拟 Vue 内部机制。

## Workspace 结构

- `packages/ui`：React 组件库，包名为 `gitlab-ui-react`。组件源码位于 `src/base/<component>/`，公共 API 从 `src/index.ts` 导出，Vite 负责 JS 构建，TypeScript 单独生成声明文件。
- `packages/tokens`：设计 token 的源 JSON、Style Dictionary 构建脚本及生成产物，包名为 `@gitlab-ui-react/tokens`。
- `packages/styles`：基础样式、组件样式、Tailwind 集成和最终 CSS，包名为 `@gitlab-ui-react/styles`，通过 `workspace:^` 依赖 tokens。
- `apps`：workspace 已预留的应用目录；不存在具体应用时不要假设其运行方式。
- 各包的 `package.json`、根 `pnpm-workspace.yaml` 和 `pnpm-lock.yaml` 是依赖、版本与脚本的事实来源。

## 工作约定

- 只使用 pnpm；不要生成 npm 或 Yarn lockfile。新增或调整依赖后运行 `pnpm install` 并提交对应的 `pnpm-lock.yaml` 变化。
- 内部包依赖使用 `workspace:^`。运行时依赖、peer dependency 与开发依赖要放入实际消费它们的包，不要仅为了方便全部提升到根目录。
- 保持改动聚焦。仓库可能已有未提交工作，不要覆盖、回退或顺手重排无关文件。
- 遵循所在包的现有格式和命名，不要进行与任务无关的全仓格式化。代码采用 ESM；React 源码使用严格 TypeScript 与现代 JSX runtime。
- `packages/tokens/dist` 和 `packages/styles/dist` 是由脚本生成且被版本控制的产物。修改其源文件或构建脚本后要重新生成并检查 diff；不要直接手改生成文件。
- 从上游复制或实质性改编代码时，保留适用的版权与许可证头，并在有助于后续同步时记录上游文件路径。

## Vue 到 React 的移植规则

- 实现组件前先核对上游组件源码、单元测试、stories 和 Pajamas 文档，整理 props、事件、slots、状态、DOM 语义、键盘交互和可访问性要求。
- 默认保留 `Gl*` 组件名、prop 含义、视觉状态、CSS 类约定和对用户可观察的行为。将 Vue slots、events、`v-model` 等转换为清晰的 React children、组合 API、受控/非受控 props 与回调，不照搬 Vue 内部 API。
- 组件使用函数组件和 React 类型。公共 props、组件和辅助类型应具有稳定的导出；新增公共组件后同步更新 `packages/ui/src/index.ts`。
- 组件样式必须与组件源码放在同一组件目录内，并以组件名命名（例如 `src/base/icon/icon.css`）。在 `packages/styles/src/components.css` 中通过 `@import` 引用各组件样式；不得直接在 `components.css` 中编写组件样式规则。
- 优先复用 `@gitlab-ui-react/tokens`、`@gitlab-ui-react/styles` 和 `@gitlab/svgs`，避免硬编码已有 token 能表达的颜色、间距、排版或图标。
- 保持语义化 HTML、键盘可操作性、焦点行为和 ARIA 信息。不要只移植视觉外观；disabled、loading、错误态、暗色主题等上游支持的状态也应纳入实现和验证。
- 不要为了逐行对应上游而牺牲 React 的类型安全或组合方式。若有意偏离上游公共行为，在代码或文档中说明兼容性取舍。

## 验证

从仓库根目录运行与改动范围相符的最小验证集：

- `pnpm lint`：全仓静态检查。
- `pnpm test`：运行根 Vitest 配置发现的全部测试。
- `pnpm build`：构建 tokens 及 styles；该命令不会构建 React UI 包。
- `pnpm --filter gitlab-ui-react build`：构建 React UI 的 ESM/CJS 输出和类型声明。
- `pnpm --filter @gitlab-ui-react/styles test`：仅运行 styles 包测试。
- `pnpm --filter @gitlab-ui-react/tokens build` 或 `pnpm --filter @gitlab-ui-react/styles build`：需要时单独重建对应包。

组件改动至少运行 lint、相关测试和 UI 包构建；token/style 改动至少运行相关构建、测试并检查已跟踪的 `dist` 差异。若现有失败与本次改动无关，在交付说明中明确列出命令和失败原因。

## 上游同步工作流

- `.github/workflows/upstream-sync.yml` 每天北京时间 07:00 运行，包含两个独立 job，跟踪清单由 `.github/upstream-sync.json` 声明。
- `sync` job：遍历 manifest 的 `sync` 列表（目录 + `include` 通配符，当前为上游 `packages/gitlab-ui/src/tokens` 的 `*.tokens.json` ↔ 本地 `packages/tokens/src`），镜像语义直接覆盖本地文件、重建 tokens/styles 产物并创建带 `upstream-sync` label 的同步 PR。
- `track` job：遍历 manifest 的 `track` 列表（单文件或目录），仅当该路径在观察窗口内有新上游 commit 时，把上游 diff、变更文件内容、本地对应内容和 open 的 `upstream-tracking` issue 列表交给 DeepSeek（`deepseek-v4-flash`）单轮分析，由模型判断本仓库是否需要更改并去重，返回结构化 JSON 后创建 issue；`workflow_dispatch` 可通过 `since_hours` 调整观察窗口（默认 24 小时）。
- 该工作流使用 `upstream-sync` 环境，依赖其中的 `SYNC_PAT`（创建可触发 CI 的 PR）和 `DEEPSEEK_API_KEY` 两个 secret。
