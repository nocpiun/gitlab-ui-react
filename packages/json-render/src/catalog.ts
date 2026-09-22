import { z } from "zod";

const headerLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
const scalarSchema = z.union([z.string(), z.number()]);
const validationCheckSchema = z.object({
  type: z.string(),
  message: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
});
const validateOnSchema = z.enum(["change", "blur", "submit"]);

const commonFieldProps = {
  label: z.string(),
  name: z.string(),
  description: z.string().optional(),
  error: z.string().optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  checks: z.array(validationCheckSchema).optional(),
  validateOn: validateOnSchema.optional(),
};

export type GitLabComponentDefinition = {
  props: z.ZodType;
  slots: string[];
  events?: string[];
  description: string;
  example: Record<string, unknown>;
};

/**
 * GitLab UI React component definitions for json-render catalogs.
 *
 * The schemas intentionally expose only JSON-serializable, model-friendly
 * props. React nodes, callbacks, render props, CSS escape hatches, and unsafe
 * URL options remain implementation details of gitlab-ui-react.
 */
export const gitlabComponentDefinitions = {
  GlCard: {
    props: z.object({}),
    slots: ["default", "header", "footer"],
    description:
      "GitLab card container. Put primary content in children and use the header/footer named slots for optional regions.",
    example: {},
  },
  GlButtonGroup: {
    props: z.object({
      label: z.string().trim().min(1),
      vertical: z.boolean().optional(),
    }),
    slots: ["default"],
    description:
      "Visually groups GitLab buttons. The required label names the group for assistive technology and is not displayed. Children should normally be GlButton elements.",
    example: { label: "Project actions", vertical: false },
  },
  GlAccordion: {
    props: z.object({
      items: z.array(z.object({
        title: z.string(),
        content: z.string(),
        defaultVisible: z.boolean().optional(),
      })),
      autoCollapse: z.boolean().optional(),
      headerLevel: headerLevelSchema.optional(),
    }),
    slots: [],
    description: "GitLab accordion containing titled text sections.",
    example: {
      items: [{ title: "Details", content: "Additional information" }],
      autoCollapse: true,
      headerLevel: 3,
    },
  },
  GlTabs: {
    props: z.object({
      items: z.array(z.object({
        title: z.string(),
        content: z.string(),
        disabled: z.boolean().optional(),
        count: z.number().int().optional(),
        countSrText: z.string().optional(),
      })),
      value: z.number().int().nonnegative().optional(),
      justified: z.boolean().optional(),
      lazy: z.boolean().optional(),
    }),
    slots: [],
    events: ["change"],
    description:
      "GitLab tabs with text panels. Bind value with $bindState or $bindItem to persist the selected zero-based tab index.",
    example: {
      items: [
        { title: "Overview", content: "Project overview" },
        { title: "Activity", content: "Recent activity" },
      ],
      value: 0,
    },
  },
  GlPagination: {
    props: z.object({
      totalItems: z.number().int().nonnegative(),
      perPage: z.number().int().positive().optional(),
      value: z.number().int().positive().optional(),
      align: z.enum(["left", "center", "right", "fill"]).optional(),
    }),
    slots: [],
    events: ["change", "previous", "next"],
    description:
      "GitLab pagination. Bind value to the one-based current page; change fires for every page request.",
    example: { totalItems: 120, perPage: 20, value: 1 },
  },
  GlAlert: {
    props: z.object({
      title: z.string().optional(),
      message: z.string().optional(),
      variant: z.enum(["danger", "info", "success", "tip", "warning"]).optional(),
      dismissible: z.boolean().optional(),
      sticky: z.boolean().optional(),
      headerLevel: headerLevelSchema.optional(),
    }),
    slots: ["default", "actions"],
    events: ["dismiss"],
    description:
      "GitLab alert with optional body children and action slot. A dismissible alert emits dismiss but does not hide itself automatically.",
    example: { title: "Changes saved", message: "Your changes are now live.", variant: "success" },
  },
  GlAttributeList: {
    props: z.object({
      items: z.array(z.object({
        label: z.string(),
        value: z.string(),
        icon: z.string().optional(),
      })),
      layout: z.enum(["horizontal", "vertical"]).optional(),
    }),
    slots: [],
    description: "GitLab definition list for compact label/value metadata.",
    example: { items: [{ label: "Status", value: "Active" }] },
  },
  GlAvatar: {
    props: z.object({
      entityName: z.string(),
      entityId: z.number().int().optional(),
      src: z.string().optional(),
      alt: z.string().optional(),
      size: z.union([
        z.literal(16),
        z.literal(24),
        z.literal(32),
        z.literal(48),
        z.literal(64),
        z.literal(96),
      ]).optional(),
      shape: z.enum(["circle", "rect"]).optional(),
      fallbackOnError: z.boolean().optional(),
    }),
    slots: [],
    description: "GitLab avatar image with a deterministic identicon fallback.",
    example: { entityName: "Jane Doe", entityId: 42, size: 32 },
  },
  GlBadge: {
    props: z.object({
      text: z.string(),
      variant: z.enum(["neutral", "info", "success", "warning", "danger", "tier"]).optional(),
      icon: z.string().optional(),
      iconSize: z.enum(["sm", "md"]).optional(),
    }),
    slots: [],
    description: "GitLab status or metadata badge.",
    example: { text: "Active", variant: "success" },
  },
  GlLoadingIcon: {
    props: z.object({
      label: z.string().optional(),
      size: z.enum(["sm", "md", "lg", "xl"]).optional(),
      color: z.enum(["dark", "light"]).optional(),
      variant: z.enum(["dots", "spinner"]).optional(),
      inline: z.boolean().optional(),
    }),
    slots: [],
    description: "Accessible GitLab indeterminate loading indicator.",
    example: { label: "Loading results", size: "md", variant: "spinner" },
  },
  GlMarkdown: {
    props: z.object({
      text: z.string(),
      compact: z.boolean().optional(),
    }),
    slots: [],
    description:
      "GitLab markdown-styled text container. Text is rendered literally and is never interpreted as HTML.",
    example: { text: "Project description", compact: false },
  },
  GlProgressBar: {
    props: z.object({
      value: z.number(),
      max: z.number().positive().optional(),
      variant: z.enum(["primary", "success", "warning", "danger"]).optional(),
      label: z.string().optional(),
    }),
    slots: [],
    description: "Accessible GitLab progress bar.",
    example: { value: 65, max: 100, label: "Upload progress" },
  },
  GlSkeletonLoader: {
    props: z.object({
      lines: z.number().int().positive().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      equalWidthLines: z.boolean().optional(),
    }),
    slots: [],
    description: "GitLab loading skeleton using the standard line layout.",
    example: { lines: 3, equalWidthLines: false },
  },
  GlTable: {
    props: z.object({
      columns: z.array(z.string()),
      rows: z.array(z.array(scalarSchema)),
      caption: z.string().optional(),
      bordered: z.boolean().optional(),
      borderless: z.boolean().optional(),
      striped: z.boolean().optional(),
      hover: z.boolean().optional(),
      small: z.boolean().optional(),
      stacked: z.union([z.boolean(), z.enum(["sm", "md", "lg", "xl"])]).optional(),
    }),
    slots: [],
    description:
      "Semantic GitLab data table. Each row is aligned to columns by array index; scalar cells are rendered as text.",
    example: {
      columns: ["Name", "Role"],
      rows: [["Alice", "Maintainer"], ["Bob", "Developer"]],
      striped: true,
    },
  },
  GlButton: {
    props: z.object({
      label: z.string(),
      category: z.enum(["primary", "secondary", "tertiary"]).optional(),
      variant: z.enum(["default", "confirm", "danger", "link", "reset"]).optional(),
      size: z.enum(["small", "medium"]).optional(),
      icon: z.string().optional(),
      block: z.boolean().optional(),
      disabled: z.boolean().optional(),
      loading: z.boolean().optional(),
      type: z.enum(["button", "submit", "reset"]).optional(),
    }),
    slots: [],
    events: ["press"],
    description:
      "GitLab action button. A button emits press; submit and reset types delegate to the containing GlForm.",
    example: { label: "Save changes", variant: "confirm", category: "primary" },
  },
  GlLink: {
    props: z.object({
      label: z.string(),
      href: z.string(),
      variant: z.enum(["inline", "meta", "mention", "mentionCurrent", "unstyled"]).optional(),
      disabled: z.boolean().optional(),
      target: z.enum(["_self", "_blank", "_parent", "_top"]).optional(),
      showExternalIcon: z.boolean().optional(),
    }),
    slots: [],
    events: ["press"],
    description:
      "Safe GitLab link. Bind on.press for an action; action bindings that request preventDefault suppress navigation.",
    example: { label: "View project", href: "/projects/1", variant: "inline" },
  },
  GlForm: {
    props: z.object({
      name: z.string().optional(),
      autoComplete: z.enum(["on", "off"]).optional(),
    }),
    slots: ["default", "actions"],
    events: ["submit", "invalid", "reset"],
    description:
      "Semantic GitLab form. Submission validates only fields inside this form; submit fires only when valid and invalid fires otherwise.",
    example: { name: "project", autoComplete: "off" },
  },
  GlFormField: {
    props: z.object({
      label: z.string(),
      description: z.string().optional(),
      error: z.string().optional(),
      optional: z.boolean().optional(),
      optionalText: z.string().optional(),
    }),
    slots: ["default"],
    description:
      "GitLab form field region for composing a custom control with a visible group label, description, and external error.",
    example: { label: "Repository path", description: "Used in clone URLs." },
  },
  GlFormFieldGroup: {
    props: z.object({}),
    slots: ["default"],
    description: "Vertically spaced group of GitLab form fields.",
    example: {},
  },
  GlFormFieldSet: {
    props: z.object({
      label: z.string(),
      description: z.string().optional(),
      error: z.string().optional(),
      disabled: z.boolean().optional(),
      optional: z.boolean().optional(),
      optionalText: z.string().optional(),
    }),
    slots: ["default"],
    description:
      "Semantic GitLab fieldset for a related group of controls, with a legend, description, and external error.",
    example: { label: "Notifications" },
  },
  GlFormInputGroup: {
    props: z.object({
      label: z.string().trim().min(1),
    }),
    slots: ["default", "prepend", "append"],
    description:
      "GitLab input group. The required label names the group for assistive technology and is not displayed. Put the form control in children and short text adornments in prepend or append slots.",
    example: { label: "Amount" },
  },
  GlFormPasswordInput: {
    props: z.object({
      ...commonFieldProps,
      value: z.string().optional(),
      placeholder: z.string().optional(),
      readOnly: z.boolean().optional(),
      width: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
      initialVisibility: z.boolean().optional(),
      revealLabel: z.string().optional(),
      hideLabel: z.string().optional(),
    }),
    slots: [],
    events: ["change", "focus", "blur", "visibilityChange"],
    description:
      "Labeled GitLab password input with an accessible reveal button. Bind value for two-way state.",
    example: { label: "Password", name: "password", revealLabel: "Reveal password" },
  },
  GlFormCheckboxGroup: {
    props: z.object({
      ...commonFieldProps,
      value: z.array(z.string()).optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string(),
        disabled: z.boolean().optional(),
      })),
    }),
    slots: [],
    events: ["change", "focus", "blur"],
    description:
      "Labeled GitLab checkbox group. Bind value to the selected option values.",
    example: {
      label: "Notifications",
      name: "notifications",
      options: [{ label: "Email", value: "email" }],
    },
  },
  GlFormInput: {
    props: z.object({
      ...commonFieldProps,
      value: scalarSchema.optional(),
      type: z.enum([
        "text",
        "password",
        "email",
        "number",
        "url",
        "tel",
        "search",
        "range",
        "color",
        "date",
        "time",
        "datetime",
        "datetime-local",
        "month",
        "week",
      ]).optional(),
      placeholder: z.string().optional(),
      readOnly: z.boolean().optional(),
      number: z.boolean().optional(),
      width: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
      min: scalarSchema.optional(),
      max: scalarSchema.optional(),
    }),
    slots: [],
    events: ["change", "focus", "blur", "submit"],
    description:
      "Labeled GitLab input. Bind value for two-way state and provide checks for json-render validation.",
    example: { label: "Email", name: "email", type: "email", placeholder: "you@example.com" },
  },
  GlFormTextarea: {
    props: z.object({
      ...commonFieldProps,
      value: z.string().optional(),
      placeholder: z.string().optional(),
      readOnly: z.boolean().optional(),
      rows: z.number().int().positive().optional(),
      characterCountLimit: z.number().int().positive().optional(),
      submitOnEnter: z.boolean().optional(),
    }),
    slots: [],
    events: ["change", "focus", "blur", "submit"],
    description:
      "Labeled GitLab multiline input. submit fires on Ctrl/Cmd+Enter when submitOnEnter is true.",
    example: { label: "Description", name: "description", rows: 4 },
  },
  GlFormDate: {
    props: z.object({
      ...commonFieldProps,
      value: z.string().optional(),
      min: z.string().optional(),
      max: z.string().optional(),
      minInvalidFeedback: z.string().optional(),
      maxInvalidFeedback: z.string().optional(),
    }),
    slots: [],
    events: ["change", "focus", "blur"],
    description: "Labeled GitLab date input using yyyy-mm-dd values.",
    example: { label: "Due date", name: "dueDate", min: "2026-01-01" },
  },
  GlFormSelect: {
    props: z.object({
      ...commonFieldProps,
      value: z.string().optional(),
      placeholder: z.string().optional(),
      width: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string(),
        disabled: z.boolean().optional(),
      })),
    }),
    slots: [],
    events: ["change", "focus", "blur"],
    description: "Labeled native GitLab select. Bind value for the selected option.",
    example: {
      label: "Role",
      name: "role",
      options: [{ label: "Developer", value: "developer" }],
    },
  },
  GlFormRadioGroup: {
    props: z.object({
      ...commonFieldProps,
      value: z.string().optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string(),
        disabled: z.boolean().optional(),
      })),
    }),
    slots: [],
    events: ["change", "focus", "blur"],
    description: "Labeled GitLab radio group. Bind value for the selected option.",
    example: {
      label: "Visibility",
      name: "visibility",
      options: [{ label: "Private", value: "private" }],
    },
  },
  GlFormCheckbox: {
    props: z.object({
      ...commonFieldProps,
      checked: z.boolean().optional(),
      indeterminate: z.boolean().optional(),
    }),
    slots: [],
    events: ["change", "focus", "blur"],
    description: "GitLab checkbox. Bind checked for two-way boolean state.",
    example: { label: "I agree to the terms", name: "accepted", checked: false },
  },
  GlToggle: {
    props: z.object({
      ...commonFieldProps,
      value: z.boolean().optional(),
      help: z.string().optional(),
      labelPosition: z.enum(["top", "left", "hidden"]).optional(),
      loading: z.boolean().optional(),
    }),
    slots: [],
    events: ["change", "focus", "blur"],
    description: "GitLab switch-style toggle. Bind value for two-way boolean state.",
    example: { label: "Enable notifications", name: "notifications", value: true },
  },
} satisfies Record<string, GitLabComponentDefinition>;

export type GitLabComponentName = keyof typeof gitlabComponentDefinitions;

export type GitLabProps<K extends GitLabComponentName> = z.output<
  (typeof gitlabComponentDefinitions)[K]["props"]
>;
