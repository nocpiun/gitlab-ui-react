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
      ? screen.getByLabelText(props.label)
      : screen.getByRole(role, { name: props.label });

    if(name === "GlFormDate") fireEvent.change(control, { target: { value: nextValue } });
    else await user.type(control, nextValue);

    expect(order.at(-2)).toBe("write");
    expect(order.at(-1)).toBe("change");
  });

  it("writes select, radio, checkbox, and toggle bindings", async () => {
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
});
