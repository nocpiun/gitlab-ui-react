# GitLab UI for React

[![ci](https://img.shields.io/github/actions/workflow/status/nocpiun/gitlab-ui-react/ci.yml)](https://github.com/nocpiun/gitlab-ui-react/actions/workflows/ci.yml)
[![LICENSE](https://img.shields.io/badge/license-MIT-blue.svg "LICENSE")](./LICENSE)
[![Stars](https://img.shields.io/github/stars/nocpiun/gitlab-ui-react.svg?label=Stars)](https://github.com/nocpiun/gitlab-ui-react/stargazers)

> [!warning]
> 🚧 **This project is under heavy development.** 🚧 The vast majority of the code and tests were written by AI (Codex and Kimi Code). Humans direct architecture, priorities, and design decisions, but have not reviewed most of the code line-by-line. Use at your own risk.

## Description

GitLab open-sources the UI component library behind its [Pajamas Design System](https://design.gitlab.com), but the upstream GitLab UI implementation is built for Vue and does not officially support React.

GitLab UI for React ports that component library to React. The project aims to match the appearance, behavior, interaction patterns, and accessibility of the upstream GitLab UI components as closely as possible while providing an idiomatic, type-safe React API.

### Related resources

- **Pajamas Design System**: <https://design.gitlab.com>
- **Upstream Repo**: <https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com>

## Project status

### Available today

- A distributable package of GitLab design tokens (`packages/tokens`). For the complete token reference, see the [official Design Token Directory](https://design.gitlab.com/product-foundations/design-tokens-directory).
- Foundational styles (`packages/styles/src`) and a prebuilt stylesheet bundle (`packages/styles/dist/gitlab-ui.css`).
- Basic components, including `GlButton`, `GlLink`, `GlBadge`, `GlCard`, etc.

### In progress

- Form components
- Advanced composite components
- Chart components
- Package publishing workflows
- Documents
- Compatibility and API consistency checks

## Contributing

Contributions to this project are welcomed. You can fork this project and start your contributing. If you don't know how to do, please follow the instruction [Creating a Pull Request from a Fork](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork).

## License

[MIT](./LICENSE)
