// @vitest-environment jsdom

import type { GitLabComponentName, GitLabProps } from "./catalog";
import { useState, type ComponentType } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  JSONUIProvider,
  type BaseComponentProps,
  type EventHandle,
} from "@json-render/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { gitlabComponents } from "./components";

afterEach(() => cleanup());

const noEvent = (): EventHandle => ({
  bound: false,
  emit: () => undefined,
  shouldPreventDefault: false,
});

type RenderOptions = {
  binding?: { prop: string; path: string };
  emit?: (event: string) => void;
  initialState?: Record<string, unknown>;
  on?: (event: string) => EventHandle;
  onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void;
  slots?: Record<string, React.ReactNode>;
  children?: React.ReactNode;
};

function renderComponent<K extends GitLabComponentName>(
  name: K,
  props: GitLabProps<K>,
  options: RenderOptions = {},
) {
  const Component = gitlabComponents[name] as ComponentType<BaseComponentProps<GitLabProps<K>>>;
  const bindings = options.binding
    ? { [options.binding.prop]: options.binding.path }
    : undefined;

  return render(
    <JSONUIProvider
      initialState={options.initialState}
      onStateChange={options.onStateChange}
      registry={{}}>
      <Component
        bindings={bindings}
        emit={options.emit ?? (() => undefined)}
        on={options.on ?? noEvent}
        props={props}
        slots={options.slots}>
        {options.children}
      </Component>
    </JSONUIProvider>,
  );
}

function getInputInNamedGroup(label: string): HTMLInputElement {
  const input = screen.getByRole("group", { name: label }).querySelector("input");
  if(!(input instanceof HTMLInputElement)) throw new Error(`No input in ${label} group`);
  return input;
}

describe("gitlabComponents display renderers", () => {
  it("renders card compound slots in their GitLab regions", () => {
    const { container } = renderComponent("GlCard", {}, {
      children: <span>Body</span>,
      slots: {
        footer: <span>Footer</span>,
        header: <span>Header</span>,
      },
    });

    expect(container.querySelector(".gl-card-header")?.textContent).toBe("Header");
    expect(container.querySelector(".gl-card-body")?.textContent).toBe("Body");
    expect(container.querySelector(".gl-card-footer")?.textContent).toBe("Footer");
  });

  it("names a button group without replacing its button names", () => {
    renderComponent("GlButtonGroup", { label: "Project actions" }, {
      children: <button type="button">Archive</button>,
    });

    expect(screen.getByRole("group", { name: "Project actions" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archive" })).toBeTruthy();
  });

  it("renders semantic lists and tables with GitLab visual variants", () => {
    const list = renderComponent("GlAttributeList", {
      items: [{ label: "Status", value: "Active" }],
      layout: "vertical",
    });
    expect(list.container.querySelector("dl")).not.toBeNull();
    expect(list.container.querySelector("dt")?.textContent).toBe("Status");
    expect(list.container.querySelector("dd")?.textContent).toBe("Active");
    cleanup();

    const table = renderComponent("GlTable", {
      bordered: true,
      caption: "Members",
      columns: ["Name", "Role"],
      rows: [["Alice", "Maintainer"]],
      striped: true,
    });
    expect(screen.getByText("Members").tagName).toBe("CAPTION");
    expect(screen.getByText("Name").tagName).toBe("TH");
    expect(screen.getByText("Alice").closest("td")).not.toBeNull();
    expect(table.container.querySelector("table")?.className)
      .toContain("table-bordered");
    expect(table.container.querySelector("table")?.className)
      .toContain("table-striped");
  });

  it("renders model-provided markdown as literal text", () => {
    const { container } = renderComponent("GlMarkdown", {
      text: "<img src=x onerror=alert(1)>",
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("keeps progress ARIA values and indicator within range for direct registry calls", () => {
    renderComponent("GlProgressBar", { label: "Upload", max: 40, value: 60 });
    const overMax = screen.getByRole("progressbar", { name: "Upload" });
    expect(overMax.getAttribute("aria-valuemax")).toBe("40");
    expect(overMax.getAttribute("aria-valuenow")).toBe("40");
    expect(overMax.style.transform).toBe("scaleX(1)");
    cleanup();

    renderComponent("GlProgressBar", { value: -10 });
    const belowMin = screen.getByRole("progressbar");
    expect(belowMin.getAttribute("aria-valuemax")).toBe("100");
    expect(belowMin.getAttribute("aria-valuenow")).toBe("0");
    expect(belowMin.style.transform).toBe("scaleX(0)");
  });

  it("uses GitLab's safe URL handling and honors preventDefault", () => {
    const emit = vi.fn();
    renderComponent("GlLink", {
      href: "javascript:alert(1)",
      label: "Unsafe destination",
    }, {
      on: () => ({ bound: true, emit, shouldPreventDefault: true }),
    });
    const link = screen.getByRole("link", { name: "Unsafe destination" });

    expect(link.getAttribute("href")).toBe("about:blank");
    expect(fireEvent.click(link)).toBe(false);
    expect(emit).toHaveBeenCalledOnce();
  });

  it("renders the form composition components with semantic structure", () => {
    const field = renderComponent("GlFormField", {
      description: "Used in clone URLs.",
      error: "Path is already taken.",
      label: "Repository path",
      optional: true,
    }, {
      children: <input />,
    });
    const fieldGroup = screen.getByRole("group", { name: /Repository path/ });
    expect(fieldGroup.className).toContain("gl-form-field");
    expect(fieldGroup.getAttribute("aria-describedby")).toContain(
      screen.getByText("Used in clone URLs.").id,
    );
    expect(screen.getByText("Path is already taken.").className)
      .toContain("invalid-feedback");
    expect(screen.getByText("(optional)")).toBeTruthy();
    field.unmount();

    const fieldSet = renderComponent("GlFormFieldSet", {
      disabled: true,
      label: "Notifications",
    }, {
      children: <input type="checkbox" />,
    });
    const semanticFieldSet = fieldSet.container.querySelector("fieldset");
    expect(semanticFieldSet?.disabled).toBe(true);
    expect(semanticFieldSet?.querySelector("legend")?.textContent).toBe("Notifications");
    fieldSet.unmount();

    renderComponent("GlFormInputGroup", { label: "Amount field" }, {
      children: <input aria-label="Amount" />,
      slots: { append: <span>USD</span>, prepend: <span>$</span> },
    });
    const group = screen.getByRole("group", { name: "Amount field" });
    expect(group?.textContent).toBe("$USD");
    expect(group?.firstElementChild?.className).toContain("input-group-prepend");
    expect(group?.lastElementChild?.className).toContain("input-group-append");
    expect(screen.getByRole("textbox", { name: "Amount" })).toBeTruthy();
  });

  it.each([
    ["GlFormPasswordInput", { label: "Password", name: "password" }],
    ["GlFormInput", { label: "Email", name: "email" }],
    ["GlFormTextarea", { label: "Description", name: "description" }],
    ["GlFormDate", { label: "Due date", name: "dueDate" }],
    ["GlFormSelect", { label: "Role", name: "role", options: [] }],
  ] as const)("names the %s field group from its visible label", (name, props) => {
    renderComponent(name, props);

    const group = screen.getByRole("group", { name: props.label });
    expect(screen.getAllByLabelText(props.label).some(
      (element) => element !== group && /^(INPUT|TEXTAREA|SELECT)$/u.test(element.tagName),
    )).toBe(true);
  });

  it("names checkbox and toggle field groups without replacing control names", () => {
    renderComponent("GlFormCheckbox", { label: "Accepted", name: "accepted" });
    expect(screen.getByRole("group", { name: "Accepted" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Accepted" })).toBeTruthy();
    cleanup();

    renderComponent("GlToggle", { label: "Notifications", name: "notifications" });
    expect(screen.getByRole("group", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Notifications" })).toBeTruthy();
  });

  it("names a checkbox group without replacing its option names", () => {
    renderComponent("GlFormCheckboxGroup", {
      label: "Channels",
      name: "channels",
      options: [
        { label: "Email", value: "email" },
        { label: "SMS", value: "sms" },
      ],
    });

    expect(screen.getAllByRole("group", { name: "Channels" }).some(
      (group) => group.classList.contains("gl-form-checkbox-group"),
    )).toBe(true);
    expect(screen.getByRole("checkbox", { name: "Email" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "SMS" })).toBeTruthy();
  });

  it("names a radio group without replacing its option names", () => {
    renderComponent("GlFormRadioGroup", {
      label: "Visibility",
      name: "visibility",
      options: [
        { label: "Private", value: "private" },
        { label: "Public", value: "public" },
      ],
    });

    expect(screen.getByRole("radiogroup", { name: "Visibility" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Private" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Public" })).toBeTruthy();
  });
});

describe("gitlabComponents state and events", () => {
  it("keeps tabs and pagination interactive with bound or local state", async () => {
    const user = userEvent.setup();
    const tabChanges = vi.fn();
    const tabEvents: string[] = [];
    renderComponent("GlTabs", {
      items: [
        { content: "First panel", title: "First" },
        { content: "Second panel", title: "Second" },
      ],
      value: 0,
    }, {
      binding: { path: "/tab", prop: "value" },
      emit: (event) => tabEvents.push(event),
      initialState: { tab: 0 },
      onStateChange: tabChanges,
    });

    await user.click(screen.getByRole("tab", { name: "Second" }));
    expect(tabChanges).toHaveBeenLastCalledWith([{ path: "/tab", value: 1 }]);
    expect(tabEvents).toEqual(["change"]);
    cleanup();

    renderComponent("GlPagination", { perPage: 10, totalItems: 30, value: 1 });
    await user.click(screen.getByLabelText("Go to next page"));
    expect(screen.getByRole("link", { name: "Go to page 2" }).className)
      .toContain("active");
  });

  it.each([
    ["GlFormInput", { label: "Input", name: "input", value: "" }, "textbox", "alpha"],
    ["GlFormTextarea", { label: "Textarea", name: "textarea", value: "" }, "textbox", "bravo"],
    ["GlFormDate", { label: "Date", name: "date", value: "" }, "textbox", "2026-09-19"],
  ] as const)("writes %s value bindings before emitting change", async (
    name,
    props,
    role,
    nextValue,
  ) => {
    const user = userEvent.setup();
    const order: string[] = [];
    renderComponent(name, props, {
      binding: { path: "/field", prop: "value" },
      emit: (event) => order.push(event),
      initialState: { field: "" },
      onStateChange: () => order.push("write"),
    });
    const control = name === "GlFormDate"
      ? getInputInNamedGroup(props.label)
      : screen.getByRole(role, { name: props.label });

    if(name === "GlFormDate") fireEvent.change(control, { target: { value: nextValue } });
    else await user.type(control, nextValue);

    expect(order.at(-2)).toBe("write");
    expect(order.at(-1)).toBe("change");
  });

  it("writes select, radio, checkbox, checkbox-group, and toggle bindings", async () => {
    const user = userEvent.setup();
    const changes: Array<{ path: string; value: unknown }> = [];
    const onStateChange = (next: Array<{ path: string; value: unknown }>) => changes.push(...next);

    renderComponent("GlFormSelect", {
      label: "Role",
      name: "role",
      options: [{ label: "Maintainer", value: "maintainer" }],
      value: "",
    }, {
      binding: { path: "/role", prop: "value" },
      initialState: { role: "" },
      onStateChange,
    });
    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "maintainer");
    expect(changes).toContainEqual({ path: "/role", value: "maintainer" });
    cleanup();

    renderComponent("GlFormRadioGroup", {
      label: "Visibility",
      name: "visibility",
      options: [{ label: "Private", value: "private" }],
      value: "",
    }, {
      binding: { path: "/visibility", prop: "value" },
      initialState: { visibility: "" },
      onStateChange,
    });
    await user.click(screen.getByRole("radio", { name: "Private" }));
    expect(changes).toContainEqual({ path: "/visibility", value: "private" });
    cleanup();

    renderComponent("GlFormCheckbox", {
      checked: false,
      label: "Accepted",
      name: "accepted",
    }, {
      binding: { path: "/accepted", prop: "checked" },
      initialState: { accepted: false },
      onStateChange,
    });
    await user.click(screen.getByRole("checkbox", { name: "Accepted" }));
    expect(changes).toContainEqual({ path: "/accepted", value: true });
    cleanup();

    renderComponent("GlFormCheckboxGroup", {
      label: "Channels",
      name: "channels",
      options: [{ label: "Email", value: "email" }],
      value: [],
    }, {
      binding: { path: "/channels", prop: "value" },
      initialState: { channels: [] },
      onStateChange,
    });
    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(changes).toContainEqual({ path: "/channels", value: ["email"] });
    cleanup();

    renderComponent("GlToggle", {
      label: "Notifications",
      name: "notifications",
      value: false,
    }, {
      binding: { path: "/notifications", prop: "value" },
      initialState: { notifications: false },
      onStateChange,
    });
    await user.click(screen.getByRole("switch", { name: "Notifications" }));
    expect(changes).toContainEqual({ path: "/notifications", value: true });
  });

  it("keeps password input interactive and emits visibility changes", async () => {
    const user = userEvent.setup();
    const emit = vi.fn();
    const changes: Array<{ path: string; value: unknown }> = [];
    renderComponent("GlFormPasswordInput", {
      label: "Password",
      name: "password",
      value: "",
    }, {
      binding: { path: "/password", prop: "value" },
      emit,
      initialState: { password: "" },
      onStateChange: (next) => changes.push(...next),
    });
    const input = getInputInNamedGroup("Password");

    fireEvent.change(input, { target: { value: "secret" } });
    expect(changes.at(-1)).toEqual({ path: "/password", value: "secret" });
    await user.click(screen.getByRole("button", { name: "Reveal password" }));
    expect(input.type).toBe("text");
    expect(emit).toHaveBeenCalledWith("visibilityChange");
  });

  it("syncs unbound local state when the external prop changes", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState("initial");
      const Component = gitlabComponents.GlFormInput;
      return (
        <JSONUIProvider registry={{}}>
          <button onClick={() => setValue("external")} type="button">Update externally</button>
          <Component
            emit={() => undefined}
            on={noEvent}
            props={{ label: "Name", name: "name", value }} />
        </JSONUIProvider>
      );
    }

    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "local");
    expect(input.value).toBe("local");
    await user.click(screen.getByRole("button", { name: "Update externally" }));
    expect(input.value).toBe("external");
  });

  it("restores unbound field values when the containing form is reset", async () => {
    const user = userEvent.setup();
    const formEmit = vi.fn();
    const Form = gitlabComponents.GlForm;
    const Input = gitlabComponents.GlFormInput;
    const Select = gitlabComponents.GlFormSelect;
    const Toggle = gitlabComponents.GlToggle;
    const Button = gitlabComponents.GlButton;

    render(
      <JSONUIProvider registry={{}}>
        <Form emit={formEmit} on={noEvent} props={{}}>
          <Input
            emit={() => undefined}
            on={noEvent}
            props={{ label: "Project", name: "project", value: "Initial" }} />
          <Select
            emit={() => undefined}
            on={noEvent}
            props={{
              label: "Role",
              name: "role",
              options: [
                { label: "Developer", value: "developer" },
                { label: "Maintainer", value: "maintainer" },
              ],
              value: "developer",
            }} />
          <Toggle
            emit={() => undefined}
            on={noEvent}
            props={{ label: "Notifications", name: "notifications", value: false }} />
          <Button
            emit={() => undefined}
            on={noEvent}
            props={{ label: "Reset", type: "reset" }} />
        </Form>
      </JSONUIProvider>,
    );
    const input = screen.getByRole("textbox", { name: "Project" }) as HTMLInputElement;
    const select = screen.getByRole("combobox", { name: "Role" }) as HTMLSelectElement;
    const toggle = screen.getByRole("switch", { name: "Notifications" });

    await user.clear(input);
    await user.type(input, "Edited");
    await user.selectOptions(select, "maintainer");
    await user.click(toggle);
    expect(input.value).toBe("Edited");
    expect(select.value).toBe("maintainer");
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(input.value).toBe("Initial");
    expect(select.value).toBe("developer");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(formEmit).toHaveBeenCalledWith("reset");
  });
});

describe("gitlabComponents validation", () => {
  const requiredCheck = [{ message: "This field is required", type: "required" }];

  it.each(["change", "blur", "submit"] as const)(
    "validates a bound input on %s and links the first error with ARIA",
    async (validateOn) => {
      const user = userEvent.setup();
      const emit = vi.fn();
      renderComponent("GlFormInput", {
        checks: requiredCheck,
        label: "Project name",
        name: "project",
        validateOn,
        value: "seed",
      }, {
        binding: { path: "/project", prop: "value" },
        emit,
        initialState: { project: "seed" },
      });
      const input = screen.getByRole("textbox", { name: "Project name" });

      await user.clear(input);
      if(validateOn === "blur") await user.tab();
      if(validateOn === "submit") await user.type(input, "{Enter}");

      await waitFor(() => expect(screen.getByText("This field is required")).toBeTruthy());
      const error = screen.getByText("This field is required");
      expect(input.getAttribute("aria-describedby")).toContain(error.id);
      expect(input.className).toContain("is-invalid");
      expect(emit).toHaveBeenCalledWith(validateOn === "submit" ? "submit" : "change");
    },
  );

  it("does not validate unbound fields and stays visually neutral", async () => {
    const user = userEvent.setup();
    renderComponent("GlFormInput", {
      checks: requiredCheck,
      label: "Unbound",
      name: "unbound",
      validateOn: "change",
      value: "seed",
    });
    const input = screen.getByRole("textbox", { name: "Unbound" });

    await user.clear(input);
    expect(screen.queryByText("This field is required")).toBeNull();
    expect(input.className).not.toContain("is-invalid");
    expect(input.className).not.toContain("is-valid");
  });

  it("marks a failed toggle validation on the switch and links its error", async () => {
    const user = userEvent.setup();
    renderComponent("GlToggle", {
      checks: [{
        args: { other: true },
        message: "Notifications must be enabled",
        type: "matches",
      }],
      label: "Notifications",
      name: "notifications",
      validateOn: "change",
      value: true,
    }, {
      binding: { path: "/notifications", prop: "value" },
      initialState: { notifications: true },
    });
    const toggle = screen.getByRole("switch", { name: "Notifications" });

    await user.click(toggle);

    const error = await screen.findByText("Notifications must be enabled");
    expect(toggle.getAttribute("aria-invalid")).toBe("true");
    expect(toggle.getAttribute("aria-describedby")).toContain(error.id);
  });

  it.each([
    ["min", "2026-09-10", "2026-09-11", "2026-09-12"],
    ["max", "2026-09-12", "2026-09-11", "2026-09-10"],
  ] as const)("blocks form submission when a date exceeds %s", async (
    limitProp,
    invalidValue,
    limit,
    validValue,
  ) => {
    const user = userEvent.setup();
    const formEmit = vi.fn();
    const Form = gitlabComponents.GlForm;
    const DateField = gitlabComponents.GlFormDate;
    const Button = gitlabComponents.GlButton;

    render(
      <JSONUIProvider registry={{}}>
        <Form emit={formEmit} on={noEvent} props={{}}>
          <DateField
            emit={() => undefined}
            on={noEvent}
            props={{ label: "Due date", name: "dueDate", [limitProp]: limit, value: invalidValue }} />
          <Button
            emit={() => undefined}
            on={noEvent}
            props={{ label: "Save", type: "submit" }} />
        </Form>
      </JSONUIProvider>,
    );
    const dateInput = getInputInNamedGroup("Due date");
    expect(dateInput.className).toContain("is-invalid");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(formEmit.mock.calls).toEqual([["invalid"]]);
    expect(document.activeElement).toBe(dateInput);

    fireEvent.change(dateInput, { target: { value: validValue } });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(formEmit).toHaveBeenLastCalledWith("submit");
  });

  it("includes date range failures alongside bound JSON checks", async () => {
    const user = userEvent.setup();
    const formEmit = vi.fn();
    const Form = gitlabComponents.GlForm;
    const DateField = gitlabComponents.GlFormDate;
    const Button = gitlabComponents.GlButton;

    render(
      <JSONUIProvider initialState={{ dueDate: "2026-09-10" }} registry={{}}>
        <Form emit={formEmit} on={noEvent} props={{}}>
          <DateField
            bindings={{ value: "/dueDate" }}
            emit={() => undefined}
            on={noEvent}
            props={{
              checks: [{ message: "Required", type: "required" }],
              label: "Due date",
              min: "2026-09-11",
              name: "dueDate",
              value: "2026-09-10",
            }} />
          <Button
            emit={() => undefined}
            on={noEvent}
            props={{ label: "Save", type: "submit" }} />
        </Form>
      </JSONUIProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(formEmit.mock.calls).toEqual([["invalid"]]);
    expect(screen.queryByText("Required")).toBeNull();
  });

  it.each([
    ["GlFormInput", "value", { label: "Input", name: "input", required: true, value: "" }],
    ["GlFormPasswordInput", "value", {
      label: "Password",
      name: "password",
      required: true,
      value: "",
    }],
    ["GlFormTextarea", "value", {
      label: "Textarea",
      name: "textarea",
      required: true,
      value: "",
    }],
    ["GlFormDate", "value", { label: "Date", name: "date", required: true, value: "" }],
    ["GlFormSelect", "value", {
      label: "Select",
      name: "select",
      options: [{ label: "Option", value: "option" }],
      required: true,
      value: "",
    }],
    ["GlFormRadioGroup", "value", {
      label: "Radio",
      name: "radio",
      options: [{ label: "Option", value: "option" }],
      required: true,
      value: "",
    }],
    ["GlFormCheckbox", "checked", {
      checked: false,
      label: "Checkbox",
      name: "checkbox",
      required: true,
    }],
    ["GlFormCheckboxGroup", "value", {
      label: "Checkbox group",
      name: "checkbox-group",
      options: [{ label: "Option", value: "option" }],
      required: true,
      value: [],
    }],
    ["GlToggle", "value", {
      label: "Toggle",
      name: "toggle",
      required: true,
      value: false,
    }],
  ] as const)("validates %s through its containing form", async (
    name,
    bindingProp,
    props,
  ) => {
    const user = userEvent.setup();
    const formEmit = vi.fn();
    const Form = gitlabComponents.GlForm;
    const Field = gitlabComponents[name] as ComponentType<
      BaseComponentProps<GitLabProps<typeof name>>
    >;
    const Button = gitlabComponents.GlButton;

    render(
      <JSONUIProvider registry={{}}>
        <Form emit={formEmit} on={noEvent} props={{}} slots={{
          actions: (
            <Button
              emit={() => undefined}
              on={noEvent}
              props={{ label: "Save", type: "submit" }} />
          ),
        }}>
          <Field
            bindings={{ [bindingProp]: "/field" }}
            emit={() => undefined}
            on={noEvent}
            props={props} />
        </Form>
      </JSONUIProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("This field is required")).toBeTruthy());
    expect(formEmit.mock.calls).toEqual([["invalid"]]);
  });

  it("submits with the latest bound value and does not emit a button press", async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    const Form = gitlabComponents.GlForm;
    const Input = gitlabComponents.GlFormInput;
    const Button = gitlabComponents.GlButton;

    render(
      <JSONUIProvider
        initialState={{ project: "" }}
        onStateChange={() => order.push("write")}
        registry={{}}>
        <Form emit={(event) => order.push(`form:${event}`)} on={noEvent} props={{}}>
          <Input
            bindings={{ value: "/project" }}
            emit={(event) => order.push(`field:${event}`)}
            on={noEvent}
            props={{ label: "Project", name: "project", required: true, value: "" }} />
          <Button
            emit={(event) => order.push(`button:${event}`)}
            on={noEvent}
            props={{ label: "Save", type: "submit" }} />
        </Form>
      </JSONUIProvider>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Project" }), {
      target: { value: "GitLab" },
    });
    expect(order.slice(-2)).toEqual(["write", "field:change"]);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(order.at(-1)).toBe("form:submit");
    expect(order).not.toContain("button:press");
  });

  it("isolates field validation between forms and clears it on reset", async () => {
    const user = userEvent.setup();
    const firstEmit = vi.fn();
    const secondEmit = vi.fn();
    const Form = gitlabComponents.GlForm;
    const Input = gitlabComponents.GlFormInput;
    const Button = gitlabComponents.GlButton;
    const boundInput = (path: string, label: string) => (
      <Input
        bindings={{ value: path }}
        emit={() => undefined}
        on={noEvent}
        props={{ label, name: label.toLowerCase(), required: true, value: "" }} />
    );

    render(
      <JSONUIProvider registry={{}}>
        <Form emit={firstEmit} on={noEvent} props={{}}>
          {boundInput("/first", "First")}
          <Button emit={() => undefined} on={noEvent} props={{ label: "Save first", type: "submit" }} />
        </Form>
        <Form emit={secondEmit} on={noEvent} props={{}}>
          {boundInput("/second", "Second")}
          <Button emit={() => undefined} on={noEvent} props={{ label: "Save second", type: "submit" }} />
          <Button emit={() => undefined} on={noEvent} props={{ label: "Reset second", type: "reset" }} />
        </Form>
      </JSONUIProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Save second" }));
    expect(firstEmit).not.toHaveBeenCalled();
    expect(secondEmit).toHaveBeenCalledWith("invalid");
    expect(screen.getAllByText("This field is required")).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Second" }));

    await user.click(screen.getByRole("button", { name: "Reset second" }));
    await waitFor(() => expect(screen.queryByText("This field is required")).toBeNull());
    expect(secondEmit).toHaveBeenLastCalledWith("reset");
  });
});
