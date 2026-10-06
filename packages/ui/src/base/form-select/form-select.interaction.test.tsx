// @vitest-environment jsdom

import { createRef, type ChangeEvent, type SyntheticEvent } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlFormSelect, {
  GlFormSelectGroup,
  GlFormSelectItem,
  type GlFormSelectProps,
} from "./form-select";

const items = (
  <>
    <GlFormSelectItem value="Pizza">Pizza</GlFormSelectItem>
    <GlFormSelectItem value="Tacos">Tacos</GlFormSelectItem>
    <GlFormSelectItem value="Burger">Burger</GlFormSelectItem>
  </>
);

const selectElement = (props: GlFormSelectProps = {}) => (
  <GlFormSelect aria-label="Food" {...props}>{items}</GlFormSelect>
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GlFormSelect interactions", () => {
  it("exposes the native select through its ref for focus and blur", () => {
    const ref = createRef<HTMLSelectElement>();
    render(<GlFormSelect aria-label="Food" ref={ref}>{items}</GlFormSelect>);
    const select = screen.getByRole("combobox", { name: "Food" });

    expect(ref.current).toBe(select);
    ref.current!.focus();
    expect(document.activeElement).toBe(select);
    ref.current!.blur();
    expect(document.activeElement).not.toBe(select);
  });

  it.each([true, false, undefined])("handles autoFocus=%s on mount", (autoFocus) => {
    render(<button type="button">Before select</button>);
    const button = screen.getByRole("button", { name: "Before select" });
    button.focus();

    render(selectElement({ autoFocus }));
    const select = screen.getByRole("combobox", { name: "Food" });

    expect(document.activeElement).toBe(autoFocus ? select : button);
  });

  it("supports Tab navigation and skips a disabled select", async () => {
    const user = userEvent.setup();
    render(
      <>
        {selectElement({ "aria-label": "Disabled food", disabled: true })}
        {selectElement()}
        <button type="button">Next</button>
      </>,
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "Food" }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Next" }));
  });

  it("forwards focus, blur, keyboard and pointer handlers to the native select", async () => {
    const user = userEvent.setup();
    const currentTarget = (event: SyntheticEvent<HTMLSelectElement>) => event.currentTarget;
    const onFocus = vi.fn(currentTarget);
    const onBlur = vi.fn(currentTarget);
    const onKeyDown = vi.fn(currentTarget);
    const onMouseEnter = vi.fn(currentTarget);
    render(selectElement({ onFocus, onBlur, onKeyDown, onMouseEnter }));
    const select = screen.getByRole("combobox", { name: "Food" });

    await user.hover(select);
    await user.tab();
    await user.keyboard("{Escape}");
    await user.tab();

    expect(onFocus).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
    expect(onMouseEnter).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: "Escape" }));
    for(const handler of [onFocus, onBlur, onKeyDown, onMouseEnter]) {
      expect(handler).toHaveReturnedWith(select);
    }
  });

  it("passes a React change event and emits the selected string once", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn((event: ChangeEvent<HTMLSelectElement>) => ({
      target: event.currentTarget,
      value: event.currentTarget.value,
    }));
    const onValueChange = vi.fn();
    render(selectElement({ defaultValue: "Pizza", onChange, onValueChange }));
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Food" });

    expect(onChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    await user.selectOptions(select, "Tacos");

    expect(select.value).toBe("Tacos");
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveReturnedWith({ target: select, value: "Tacos" });
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("Tacos");
  });

  it("allows onChange to prevent the value-change callback", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn((event: ChangeEvent<HTMLSelectElement>) => event.preventDefault());
    const onValueChange = vi.fn();
    render(selectElement({ value: "Pizza", onChange, onValueChange }));
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Food" });

    await user.selectOptions(select, "Tacos");

    expect(onChange).toHaveBeenCalledOnce();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(select.value).toBe("Pizza");
  });

  it.each([
    { mode: "single", multiple: false, value: "Pizza", nextValue: "Burger", selected: ["Burger"] },
    { mode: "multiple", multiple: true, value: ["Pizza"], nextValue: ["Pizza", "Burger"], selected: ["Pizza", "Burger"] },
  ])("waits for controlled $mode props without emitting changes on rerender", async ({
    multiple, value, nextValue, selected,
  }) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    const props = { multiple, value, onChange, onValueChange };
    const { rerender } = render(selectElement(props));
    const select = screen.getByRole<HTMLSelectElement>(multiple ? "listbox" : "combobox", { name: "Food" });
    const id = select.id;

    expect(onChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    await user.selectOptions(select, "Burger");

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(nextValue);
    expect(Array.from(select.selectedOptions, (option) => option.value)).toEqual(["Pizza"]);

    rerender(selectElement({ ...props, value: nextValue }));

    expect(Array.from(select.selectedOptions, (option) => option.value)).toEqual(selected);
    expect(select.id).toBe(id);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("emits an empty array when the last uncontrolled multiple selection is cleared", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(selectElement({ multiple: true, defaultValue: ["Pizza"], onValueChange }));
    const select = screen.getByRole<HTMLSelectElement>("listbox", { name: "Food" });

    await user.deselectOptions(select, "Pizza");

    expect(select.selectedOptions).toHaveLength(0);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith([]);
  });

  it("preserves child order across fragments, mapped items and groups", () => {
    render(
      <GlFormSelect aria-label="Food">
        <GlFormSelectItem value="" disabled>Choose food</GlFormSelectItem>
        <>
          {["Pizza", "Tacos"].map((value) => (
            <GlFormSelectItem key={value} value={value}>{value}</GlFormSelectItem>
          ))}
        </>
        <GlFormSelectGroup label="Other">
          <GlFormSelectItem value="Burger">Burger</GlFormSelectItem>
        </GlFormSelectGroup>
        <GlFormSelectItem value="Salad">Salad</GlFormSelectItem>
      </GlFormSelect>,
    );
    const select = screen.getByRole<HTMLSelectElement>("combobox", { name: "Food" });

    expect(Array.from(select.options, (option) => option.value))
      .toEqual(["", "Pizza", "Tacos", "Burger", "Salad"]);
  });

  it("hydrates distinct generated IDs and an explicit ID without replacing server elements", async () => {
    const user = userEvent.setup();
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onValueChange = vi.fn();
    const element = (
      <>
        {selectElement({ defaultValue: "Pizza", onValueChange })}
        {selectElement({ "aria-label": "Second food" })}
        {selectElement({ "aria-label": "Third food", id: "explicit-food" })}
      </>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const serverSelects = Array.from(container.querySelectorAll("select"));
    const serverIds = serverSelects.map((select) => select.id);

    expect(serverIds).toHaveLength(3);
    expect(serverIds.every(Boolean)).toBe(true);
    expect(new Set(serverIds).size).toBe(3);
    expect(serverIds[2]).toBe("explicit-food");

    render(element, { container, hydrate: true, onRecoverableError });

    const hydratedSelects = screen.getAllByRole<HTMLSelectElement>("combobox");
    hydratedSelects.forEach((select, index) => expect(select).toBe(serverSelects[index]));
    expect(hydratedSelects.map((select) => select.id)).toEqual(serverIds);
    expect(onValueChange).not.toHaveBeenCalled();

    await user.selectOptions(hydratedSelects[0], "Burger");

    expect(hydratedSelects[0].value).toBe("Burger");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("Burger");
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
