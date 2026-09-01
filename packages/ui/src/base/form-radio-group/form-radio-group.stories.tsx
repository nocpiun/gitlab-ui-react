import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import SafeHtml from "@/internal/safe-html/safe-html";
import GlFormRadio from "../form-radio/form-radio";
import GlFormRadioGroup, { type GlFormRadioGroupProps } from "./form-radio-group";

const defaultOptions = [
  { value: "pizza", text: "Pizza" },
  { value: "tacos", text: "Tacos" },
  { value: "burger", text: "Burger", disabled: true },
];

const meta = {
  title: "UI/Base/Form Radio Group",
  component: GlFormRadioGroup,
  args: {
    name: "radio-group-name",
    options: defaultOptions,
    onChange: fn(),
    onInput: fn(),
  },
  argTypes: {
    state: {
      control: "select",
      options: [null, true, false],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas radio button documentation](https://design.gitlab.com/components/radio-button) for usage and implementation details.",
      },
    },
  },
} satisfies Meta<typeof GlFormRadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <GlFormRadioGroup
      {...args}
      checked="slot-option"
      first={(
        <GlFormRadio value="slot-option" help="Help text.">
          Slot option with help text
        </GlFormRadio>
      )}>
      <GlFormRadio value="Last option">Last option</GlFormRadio>
    </GlFormRadioGroup>
  ),
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole("radiogroup");
    await expect(group).toHaveClass("gl-form-radio-group");

    // The shared model checks the matching radios from slots and options
    const slotOption = canvas.getByRole("radio", { name: /Slot option with help text/ });
    const pizza = canvas.getByRole("radio", { name: "Pizza" });
    const tacos = canvas.getByRole("radio", { name: "Tacos" });
    const burger = canvas.getByRole("radio", { name: "Burger" });
    const last = canvas.getByRole("radio", { name: "Last option" });

    await expect(slotOption).toBeChecked();
    await expect(pizza).not.toBeChecked();
    await expect(burger).toBeDisabled();

    // Every radio shares the group name
    for(const radio of [slotOption, pizza, tacos, burger, last]) {
      await expect(radio).toHaveAttribute("name", "radio-group-name");
    }

    // A user selection moves the shared model and emits input then change
    await userEvent.click(tacos);
    await expect(args.onInput).toHaveBeenLastCalledWith("tacos");
    await expect(args.onChange).toHaveBeenLastCalledWith("tacos");
    await expect(tacos).toBeChecked();
    await expect(slotOption).not.toBeChecked();

    await userEvent.click(last);
    await expect(args.onInput).toHaveBeenLastCalledWith("Last option");
    await expect(last).toBeChecked();
    await expect(tacos).not.toBeChecked();
  },
};

function ControlledGroupExample(args: GlFormRadioGroupProps) {
  const [checked, setChecked] = useState<unknown>("tacos");
  return (
    <div>
      <GlFormRadioGroup {...args} checked={checked} onInput={setChecked} />
      <p>
        Selected:
        {" "}
        {String(checked)}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledGroupExample {...args} />,
  play: async ({ canvas }) => {
    const tacos = canvas.getByRole("radio", { name: "Tacos" });
    const pizza = canvas.getByRole("radio", { name: "Pizza" });

    await expect(tacos).toBeChecked();

    await userEvent.click(pizza);
    await expect(pizza).toBeChecked();
    await expect(tacos).not.toBeChecked();
    await expect(canvas.getByText("Selected: pizza")).toBeInTheDocument();
  },
};

export const ValidationStates: Story = {
  args: {
    options: ["one", "two"],
  },
  render: (args) => (
    <div>
      <GlFormRadioGroup {...args} name="valid-group" state />
      <GlFormRadioGroup {...args} name="invalid-group" state={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [validGroup, invalidGroup] = canvas.getAllByRole("radiogroup");

    await expect(validGroup).not.toHaveAttribute("aria-invalid");
    await expect(invalidGroup).toHaveAttribute("aria-invalid", "true");

    for(const radio of canvas.getAllByRole("radio", { name: "one" })) {
      // The state class comes from the group, not the radio
      const isValid = radio.getAttribute("name") === "valid-group";
      await expect(radio).toHaveClass(isValid ? "is-valid" : "is-invalid");
    }
  },
};

export const Required: Story = {
  args: {
    options: ["one", "two"],
    required: true,
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("radiogroup");
    await expect(group).toHaveAttribute("aria-required", "true");

    for(const radio of canvas.getAllByRole("radio")) {
      await expect(radio).toBeRequired();
      await expect(radio).toHaveAttribute("aria-required", "true");
    }
  },
};

export const HtmlOption: Story = {
  args: {
    options: [
      {
        text: "fallback",
        html: [
          "<strong>HTML</strong> option<script>window.__xss = true;</script>",
          "<a href=\"javascript:alert(1)\" onclick=\"alert(2)\" data-remote=\"true\" data-safe=\"1\">link</a>",
          "<a href=\"slack://open\">app link</a>",
          "<style>p { width: 50%; }</style>",
          "<form method=\"post\" action=\"/x\"></form>",
          "<math><mstyle displaystyle=\"true\"></mstyle></math>",
        ].join(""),
      },
      { text: "Plain option" },
    ],
  },
  play: async ({ canvas }) => {
    // The html option is sanitized (upstream's safe_html directive)
    const group = canvas.getByRole("radiogroup");
    const radio = canvas.getByRole("radio", { name: /HTML option/ });
    await expect(radio).toBeInTheDocument();

    // Benign formatting markup is preserved
    await expect(group.querySelector("strong")?.textContent).toBe("HTML");

    // Scripts are stripped and never execute
    await expect(group.querySelector("script")).toBeNull();
    await expect((window as unknown as Record<string, unknown>).__xss).toBeUndefined();

    // Dangerous URLs, event handlers and forbidden data attributes are
    // stripped; the anchor itself and safe data attributes stay
    const link = group.querySelector("a[data-safe]");
    await expect(link).not.toBeNull();
    await expect(link?.getAttribute("href")).toBeNull();
    await expect(link?.getAttribute("onclick")).toBeNull();
    await expect(link?.getAttribute("data-remote")).toBeNull();
    await expect(link?.getAttribute("data-safe")).toBe("1");

    // Unknown application protocols stay allowed (ALLOW_UNKNOWN_PROTOCOLS)
    await expect(group.querySelector("a[href=\"slack://open\"]")).not.toBeNull();

    // Upstream-forbidden tags are removed
    await expect(group.querySelector("style")).toBeNull();
    await expect(group.querySelector("form")).toBeNull();
    await expect(group.querySelector("mstyle")).toBeNull();

    // The plain-text fallback is only rendered when sanitization is
    // unavailable (server rendering)
    await expect(canvas.queryByText("fallback")).not.toBeInTheDocument();
  },
};

function UpdatingHtmlOptionExample(args: GlFormRadioGroupProps) {
  const [html, setHtml] = useState(
    "<strong>first</strong><script>window.__xss = true;</script>",
  );
  return (
    <div>
      <button onClick={() => setHtml("<em>second</em>")} type="button">
        Update HTML
      </button>
      <GlFormRadioGroup {...args} options={[{ html, text: "fallback", value: "opt" }]} />
    </div>
  );
}

export const HtmlOptionUpdate: Story = {
  render: (args) => <UpdatingHtmlOptionExample {...args} />,
  play: async ({ canvas }) => {
    const group = canvas.getByRole("radiogroup");
    await expect(group.querySelector("strong")?.textContent).toBe("first");

    await userEvent.click(canvas.getByRole("button", { name: "Update HTML" }));

    // The previous fragment is fully replaced: no stale nodes remain
    await expect(group.querySelector("strong")).toBeNull();
    await expect(group.querySelector("em")?.textContent).toBe("second");
    await expect(group.querySelector("script")).toBeNull();
  },
};

export const HtmlOptionHydration: Story = {
  render: () => <div data-testid="hydration-host" />,
  play: async ({ canvas }) => {
    const host = canvas.getByTestId("hydration-host");
    const element = (
      <SafeHtml fallback="fallback" html={"<strong>HTML</strong> option<script>alert(1)</script>"} />
    );

    // The server-rendered markup (covered by the unit tests) contains the
    // escaped fallback, never the raw HTML
    host.innerHTML = "<span>fallback</span>";

    const errors: unknown[][] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };
    try {
      // Hydration over the fail-closed server markup must not error; the
      // client effect then swaps in the sanitized fragment
      const root = hydrateRoot(host, element);
      await waitFor(() => expect(host.querySelector("strong")).not.toBeNull());
      await expect(host.querySelector("script")).toBeNull();
      await expect(errors).toEqual([]);

      // Unmounting leaves no nodes behind
      root.unmount();
      await expect(host.innerHTML).toBe("");
    } finally {
      console.error = originalError;
    }
  },
};
