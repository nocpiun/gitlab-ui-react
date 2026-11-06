// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlTokenSelector, { type GlTokenSelectorItem, type GlTokenSelectorProps } from "./token-selector";

const items: GlTokenSelectorItem[] = [
  { id: "alpha", name: "Alpha" },
  { id: "beta", name: "Beta" },
];

afterEach(() => cleanup());

function Selector({
  controlled,
  onValueChange,
  ...props
}: GlTokenSelectorProps & { controlled: boolean }) {
  const [value, setValue] = useState<GlTokenSelectorItem[]>([]);

  return (
    <GlTokenSelector
      aria-label="Projects"
      items={items}
      {...props}
      onValueChange={(nextValue) => {
        if(controlled) setValue(nextValue);
        onValueChange?.(nextValue);
      }}
      value={controlled ? value : undefined} />
  );
}

describe.each([false, true])("GlTokenSelector selection (controlled: %s)", (controlled) => {
  it.each([
    { selection: "keyboard", keepOpenOnSelect: false, expectedOpen: false },
    { selection: "keyboard", keepOpenOnSelect: true, expectedOpen: true },
    { selection: "pointer", keepOpenOnSelect: false, expectedOpen: true },
    { selection: "pointer", keepOpenOnSelect: true, expectedOpen: true },
  ])("handles $selection with keepOpenOnSelect=$keepOpenOnSelect", async ({
    selection,
    keepOpenOnSelect,
    expectedOpen,
  }) => {
    const user = userEvent.setup();
    const onTokenAdd = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Selector
        controlled={controlled}
        keepOpenOnSelect={keepOpenOnSelect}
        onTokenAdd={onTokenAdd}
        onValueChange={onValueChange} />,
    );
    const input = screen.getByRole("combobox", { name: "Projects" });
    await user.type(input, "Al");
    if(selection === "keyboard") await user.keyboard("{Enter}");
    else await user.click(await screen.findByRole("option", { name: "Alpha" }));

    expect(onTokenAdd).toHaveBeenCalledExactlyOnceWith(items[0]);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith([items[0]]);
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe("");
    expect(input.getAttribute("aria-expanded")).toBe(String(expectedOpen));
    if(expectedOpen) {
      const nextOption = screen.getByRole("option", { name: "Beta" });
      expect(input.getAttribute("aria-activedescendant")).toBe(nextOption.id);

      await user.keyboard("{Enter}");

      expect(onValueChange).toHaveBeenLastCalledWith(items);
      expect(onTokenAdd).toHaveBeenLastCalledWith(items[1]);
      expect(input.getAttribute("aria-expanded")).toBe(String(keepOpenOnSelect));
    }
  });
});

it.each(["keyboard", "pointer"])("hides an empty dropdown after %s selection", async (selection) => {
  const user = userEvent.setup();
  render(
    <Selector controlled hideDropdownWithNoItems items={[items[0]]} keepOpenOnSelect />,
  );
  const input = screen.getByRole("combobox", { name: "Projects" });
  await user.click(input);
  if(selection === "keyboard") await user.keyboard("{Enter}");
  else await user.click(await screen.findByRole("option", { name: "Alpha" }));

  expect(document.activeElement).toBe(input);
  expect(input.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("listbox")).toBeNull();
});

it.each(["Escape", "blur"])("still dismisses a kept-open dropdown on %s", async (dismissal) => {
  const user = userEvent.setup();
  render(
    <>
      <Selector controlled keepOpenOnSelect />
      <button type="button">Outside</button>
    </>,
  );
  const input = screen.getByRole("combobox", { name: "Projects" });
  await user.click(input);
  await user.keyboard("{Enter}");
  expect(input.getAttribute("aria-expanded")).toBe("true");

  if(dismissal === "Escape") await user.keyboard("{Escape}");
  else await user.click(screen.getByRole("button", { name: "Outside" }));

  expect(input.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("listbox")).toBeNull();
});

it("does not reopen from stale input when results arrive after Escape", async () => {
  const user = userEvent.setup();
  const view = render(<Selector controlled items={[]} keepOpenOnSelect />);
  const input = screen.getByRole("combobox", { name: "Projects" });
  await user.type(input, "Al");
  await user.keyboard("{Escape}");

  view.rerender(<Selector controlled items={items} keepOpenOnSelect />);

  expect((input as HTMLInputElement).value).toBe("");
  expect(input.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("listbox")).toBeNull();
});
