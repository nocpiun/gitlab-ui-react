# Deprecated component decisions

Read this reference when the target is deprecated upstream or when a component being ported imports a deprecated upstream component. The goal is to avoid creating a new compatibility surface solely because Vue code still reuses an old component internally.

## Porting gate

Before scaffolding, establish all of the following:

- Verify the deprecation in current upstream source, documentation, stories, or tests, and identify any documented replacement.
- Separate runtime consumers from exports, tests, stories, documentation, and style-only references.
- Check whether the React repository already exposes the API, has migrated consumers that depend on it, or has an explicit compatibility commitment.
- Determine whether each unported consumer needs the deprecated component's semantics or merely reuses its markup, styles, or child components.

Treat an existing local consumer or public API, an explicit user requirement for compatibility, or required behavior with no supported replacement as a reason to design a compatibility migration deliberately. Otherwise, when only unported upstream consumers remain and supported primitives cover their behavior, do not port or scaffold the deprecated component. Record how those consumers will be migrated instead.

Do not add placeholder exports, aliases, legacy class contracts, or partial compatibility components “for later.” If a future compatibility requirement appears, reassess it as a separate scoped task.

## Semantic replacement guide

Choose the primitive from the interaction semantics rather than from the old component name:

| Interaction | Replacement |
| --- | --- |
| Action menu | `GlDisclosureDropdown` |
| Single-select, multi-select, or searchable selection | `GlListbox` |
| Input suggestions, token suggestions, or combobox behavior | Base UI `Combobox` |
| Popup containing forms or multiple non-menu controls | Base UI `Popover` |
| Split action and menu | `GlButtonGroup`, a primary `GlButton`, and `GlDisclosureDropdown` |
| Highlighted selections or clear-all actions | Listbox header, groups, and caller-composed buttons |

Do not place form controls in a menu merely to reproduce legacy markup. Preserve the observable behavior with the primitive whose accessibility model matches the interaction.

## Repository decision: legacy dropdown

The upstream legacy dropdown family is deprecated and has no migrated React consumers or public compatibility obligation. Do not create or export any of the following:

- `GlLegacyDropdown`
- `GlLegacyDropdownItem`
- `GlLegacyDropdownForm`
- `GlLegacyDropdownDivider`
- `GlLegacyDropdownSectionHeader`
- `GlLegacyDropdownText`

Do not introduce compatibility props such as `headerText`, `showClearAll`, `splitHref`, `right`, or `popperOpts`. Do not add legacy dropdown CSS or make `.gl-dropdown*` class names part of a new component contract.

Migrate the known upstream consumers according to their semantics:

- `GlFormInputGroup` uses a single-select `GlListbox` for predefined options.
- `GlFormCombobox` and `GlTokenSelectorDropdown` use Base UI `Combobox` behavior rather than legacy dropdown items.
- Filtered Search uses the appropriate combobox/listbox option component and the supported shared dropdown styles.

Existing `.gl-dropdown` compatibility selectors do not authorize a legacy component port and are not to be removed as part of an unrelated component migration. Handle their eventual cleanup in a separate task.

If external consumers later require the old public API, evaluate a separately scoped compatibility adapter instead of adding it to the core package by default.
