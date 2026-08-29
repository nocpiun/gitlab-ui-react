---
name: port-gitlab-ui-component
description: Port or substantially synchronize a GitLab UI/Pajamas component from Vue into this gitlab-ui-react monorepo. Use for components under packages/ui that require upstream behavior analysis, React/Base UI adaptation, colocated CSS, public exports, tests, stories, and scoped validation. Do not use for token-only synchronization or unrelated React components.
metadata:
   internal: true
---

# Port a GitLab UI component

移植的目标是保持当前上游可观察行为、视觉语义和可访问性，同时提供自然、类型安全的 React API。不要逐行翻译 Vue，也不要引入 Vue 运行时。

开始前完整阅读仓库根目录的 `AGENTS.md`。它是包结构、依赖、生成产物和验证命令的最终约束来源；本 skill 补充组件移植流程和容易遗漏的判断。

## 先建立事实基线

1. 检查 `git status --short`，区分已有暂存/未暂存改动，绝不覆盖或回退无关工作。
2. 用 `rg --files`、结构 outline 或等价的只读方式定位：
   - 本地目标目录和相邻 React 组件；
   - `packages/ui/src/index.ts`、`packages/ui/package.json`、`packages/ui/vite.config.ts`；
   - `packages/styles/src/components.css` 和相关构建配置；
   - `node_modules/@gitlab/ui/src/components/...` 中的 Vue 快照。
3. 当前上游只认 `gitlab-org/gitlab-services/design.gitlab.com` 和 `design.gitlab.com`；不要使用已归档的旧 `gitlab-ui` 仓库作为事实来源。
4. 核对当前上游的组件源码、测试、stories、Pajamas 文档，以及源码引用的 mixin、constants、指令、子组件和全局样式。访问 GitLab CLI/API 前按环境要求加载 `glab` skill。
5. 不要因为本地存在 `@gitlab/ui` 就假定它最新。可用以下方式快速证明本地文件是否与当前上游完全一致：
   - 从当前上游 tree API 取得文件 blob ID；
   - 对本地快照运行 `git hash-object <file>`；
   - 哈希相同才把本地文件当作当前上游的精确副本。哈希不同则读取当前上游文件。

在编码前整理一份最小兼容性清单，至少覆盖：props/defaults、events、slots、渲染标签、DOM 结构、CSS 类、状态、键盘交互、焦点、ARIA、链接安全和依赖。它可以只存在于工作上下文，不必新增文档文件。

## 设计 React API

- 保留 `Gl*` 名称、prop 含义、视觉状态、CSS 类约定和用户可观察行为；Vue 内部实现不是兼容目标。
- 将默认 slot 转为 `children`，命名 slot 转为含义明确的 `ReactNode` prop 或组合 API，events 转为类型化回调，`v-model` 转为清晰的受控/非受控接口。
- 用函数组件、严格 TypeScript 和现代 JSX runtime。渲染多种元素时转发合适的 ref；公共 props、组件和辅助类型必须从 `packages/ui/src/index.ts` 稳定导出。
- 优先选择语义最接近的 Base UI primitive，并用其 `render` 机制支持组合。不要把真实导航链接强行做成 button；上游同时支持 action、`<a>` 和非交互 label 时，可以为不同语义保留独立渲染分支。
- 从 Base UI 导入的组件必须在导入时重命名为以 `Base` 开头的名称，避免与 `Gl*` 或本地组件混淆。例如：`import { Button as BaseButton } from "@base-ui/react/button";`。
- Vue Router/Nuxt 专属 props 不应把某个路由器耦合进组件库。通常用 Base UI `render` 组合 React Router 等外部组件，并在 API 注释中说明。
- icon 组件是 Base UI 例外；其他组件只有在 Base UI 没有合适原语或原语会破坏语义时才退回原生元素，并记录理由。
- 使用 `class-variance-authority` 管理 base class、variants、compound variants、布尔状态和用户 `className`。不要用模板字符串或手写条件数组拼接变体类。
- 审核边界值，不要把“有值”简化成 truthy。例如 count 的 `0`、`null`、负数，以及空 children 对 icon-only 判断的影响都应明确；React children 判空优先用 `Children.toArray` 等 React 语义。
- 不要凭视觉状态自动猜测 ARIA。核对上游后决定 `aria-pressed`、`aria-disabled`、role 和 accessible name 是组件自动生成还是由调用方传入。

## 保持语义、安全和交互

- 对每个渲染分支验证实际标签、role、tab order、Enter/Space 行为、焦点保持以及事件默认行为，而不只验证类名。
- 区分 native `disabled` 与 `aria-disabled`。若当前上游要求 disabled 元素仍可聚焦，应让 Base UI 保持焦点并阻止 click、提交和必要的冒泡；不要只改颜色。
- loading、disabled 等派生状态必须一致影响样式、ARIA、事件和表单行为。
- 真实链接保留 anchor 语义；若上游提供 URL 清洗和 `_blank` 防护，继续实施协议 allowlist 和 `noopener noreferrer`。
- icon-only 控件必须有 accessible name；文字旁的装饰 icon 对辅助技术隐藏。
- 保留 reduced motion、forced colors、暗色 token 和 `:focus-visible` 行为。

若用户明确延后某个状态（例如 loading），不要半实现。至少在以下后续接入点留下具体 TODO：

- 公共 prop/type；
- 派生 disabled/事件逻辑；
- 子组件或指示器渲染位置；
- story/测试覆盖位置。

TODO 应说明依赖和完成条件，而不是只写“以后处理”。

## 记录上游来源

- 直接复制或实质改编上游源码、样式时，原样保留适用的版权和许可证头，并在文件开头记录简短、稳定的上游相对路径，便于后续同步；若已有版权头，将来源说明放在其后。
- 只参考公共 API 并独立实现时无需添加来源注释。通常只在组件实现和实质改编的 CSS 中记录，不必在测试和 stories 中重复，除非这些文件本身也来自上游。
- 注释只记录来源，不写容易过时的移植进度、版本差异或兼容性说明；这些内容放在 PR 或相关文档中。

```tsx
/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/button/button.vue
 */
```

## 移植样式

- 把组件样式放在组件目录的 `<component>.css`，并只在 `packages/styles/src/components.css` 中添加 `@import`。
- 优先使用现有 CSS custom properties、GitLab tokens、`@gitlab-ui-react/styles` 和 `@gitlab/svgs`。已有 token 能表达时不要硬编码颜色、间距或排版。
- 当前本地管线处理 CSS/Tailwind，不处理 Sass。把上游 `$variable`、mixin 和 Sass nesting 转成 CSS custom properties、标准 CSS 或受支持的 Tailwind utilities；不要把 `.scss` 语法直接复制进 `.css`。
- 审核上游的传递性全局样式。组件若依赖 Bootstrap `.btn`、reset 或其他全局声明，而本仓库未引入它们，组件 CSS 必须补齐实际需要的基础行为，否则局部 SCSS 看似完整但最终视觉会缺失。
- 保留上游类名以支持组合组件和后续同步，但 CSS 可以用局部 custom properties减少重复，只要最终状态和 specificity 一致。
- 修改样式源后运行 styles 单包构建并提交 `packages/styles/dist` 差异；绝不直接手改 dist。

## 处理依赖和打包

- 只用 pnpm。运行时依赖安装到实际消费它的包，例如：

  ```powershell
  pnpm --filter gitlab-ui-react add <package>
  ```

- 提交相应 `pnpm-lock.yaml` 变化，不生成 npm/Yarn lockfile。
- 新的运行时依赖若不应打进组件库 bundle，要同步检查 `packages/ui/vite.config.ts` 的 external 配置；通过 UI build 验证 ESM、CJS 和声明文件。
- 内部包依赖使用 `workspace:^`，React/React DOM 继续遵守现有 peer dependency 约定。

## 测试与 stories

单元测试覆盖结构和确定性行为，Storybook 覆盖组合、交互和视觉。至少考虑：

- 默认 DOM、默认 props 和原生属性透传；
- variant/category/size 的矩阵和 compound classes；
- disabled、selected、block、错误态等支持的状态；
- icon-only、icon+text、emoji、count=0、空内容等组合；
- 链接、非交互分支、Base UI `render` 组合；
- 键盘、焦点、click/submit 抑制和 accessible name。

沿用仓库现有测试风格。Node 环境可以用 `renderToStaticMarkup` 验证结构；真实事件和焦点行为放在浏览器或 Storybook play 测试中。

Storybook 有两个常见陷阱：

- Meta 的默认 `children` 会被 `{...args}` 带入本应 icon-only 的 story；必须显式覆盖为 `children={undefined}` 或使用不会继承该值的 render。
- `storybook:build` 只证明 stories 能编译，不会执行所有 play 断言。交互需运行 Storybook 测试或在浏览器中实际检查。

视觉检查优先覆盖 variants 矩阵、disabled、icon-only/ellipsis、block、暗色主题和 focus-visible。检查截图的同时读取可访问树或 DOM，避免“看起来正确但语义错误”。

## 验证与交付

从仓库根目录运行与改动匹配的最小集合：

```powershell
pnpm lint
pnpm --filter gitlab-ui-react build
pnpm --filter @gitlab-ui-react/styles build
pnpm --filter @gitlab-ui-react/styles test
```

再运行目标组件测试；新增或修改 stories 时构建/测试 Storybook。不要运行会触发 tokens 构建的根 `pnpm build` 或 tokens build。

如果仓库标准测试配置在测试发现前因环境或工具链失败：

1. 记录原命令和完整启动错误；
2. 不要为通过当前任务擅自修改无关测试基础设施；
3. 可使用不加载故障插件的最小等价 Vitest/Vite 配置执行目标测试；
4. 交付时同时报告标准命令失败和替代验证结果。

完成前检查：

- `git diff --check`；
- `git status --short`，确认没有覆盖用户改动；
- `git diff --name-only -- packages/tokens/dist` 必须为空；
- styles 源变化对应的已跟踪 dist 差异合理；
- 公共导出、运行时依赖、lockfile 和 bundler external 同步；
- 有意偏离上游或明确延后的行为已在代码/文档中说明。

交付摘要应列出实现的行为、刻意排除的范围、验证命令及结果，以及任何与本次改动无关的现有失败。
