// @vitest-environment jsdom

import { createRef, useState } from "react";
import { flushSync } from "react-dom";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlDisclosureDropdown, {
  GlDisclosureDropdownContent,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
  type GlDisclosureDropdownHandle,
} from "./disclosure-dropdown";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GlDisclosureDropdown interactions", () => {
  it.each([
    { asChild: false, defaultOpen: false },
    { asChild: false, defaultOpen: true },
    { asChild: true, defaultOpen: false },
    { asChild: true, defaultOpen: true },
  ])("focuses the toggle without changing state ($asChild, $defaultOpen)", async ({
    asChild,
    defaultOpen,
  }) => {
    const dropdownRef = createRef<GlDisclosureDropdownHandle>();
    const onOpenChange = vi.fn();
    render(
      <GlDisclosureDropdown
        ref={dropdownRef}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}>
        {asChild ? (
          <GlDisclosureDropdownTrigger asChild>
            <button type="button">Custom actions</button>
          </GlDisclosureDropdownTrigger>
        ) : (
          <GlDisclosureDropdownTrigger>Actions</GlDisclosureDropdownTrigger>
        )}
        <GlDisclosureDropdownContent>
          <GlDisclosureDropdownItem value="edit">Edit</GlDisclosureDropdownItem>
        </GlDisclosureDropdownContent>
      </GlDisclosureDropdown>,
    );
    const trigger = screen.getByRole("button", { name: asChild ? "Custom actions" : "Actions" });
    if(defaultOpen) {
      const item = await screen.findByRole("menuitem", { name: "Edit" });
      act(() => item.focus());
    }
    onOpenChange.mockClear();

    act(() => dropdownRef.current?.focusToggle());

    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded") === "true").toBe(defaultOpen);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  function renderDisabledItem() {
    const onClick = vi.fn();
    const onItemAction = vi.fn();
    const onRootAction = vi.fn();

    render(
      <GlDisclosureDropdown defaultOpen onAction={onRootAction}>
        <GlDisclosureDropdownTrigger>Actions</GlDisclosureDropdownTrigger>
        <GlDisclosureDropdownContent>
          <GlDisclosureDropdownItem
            disabled
            onAction={onItemAction}
            onClick={onClick}
            value="archive">
            Archive project
          </GlDisclosureDropdownItem>
        </GlDisclosureDropdownContent>
      </GlDisclosureDropdown>,
    );

    return { onClick, onItemAction, onRootAction };
  }

  it("exposes disabled item semantics and suppresses pointer activation", async () => {
    const user = userEvent.setup();
    const handlers = renderDisabledItem();
    const item = await screen.findByRole("menuitem", { name: "Archive project" });

    expect(item.getAttribute("aria-disabled")).toBe("true");
    expect(item.hasAttribute("data-disabled")).toBe(true);
    expect(item.classList.contains("disabled")).toBe(true);

    await user.click(item);

    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onItemAction).not.toHaveBeenCalled();
    expect(handlers.onRootAction).not.toHaveBeenCalled();
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("suppresses %s activation for disabled items", async (_key, input) => {
    const user = userEvent.setup();
    const handlers = renderDisabledItem();
    const item = await screen.findByRole("menuitem", { name: "Archive project" });

    item.focus();
    expect(document.activeElement).toBe(item);
    await user.keyboard(input);

    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onItemAction).not.toHaveBeenCalled();
    expect(handlers.onRootAction).not.toHaveBeenCalled();
  });

  it("runs an item action that unmounts the dropdown before the click finishes", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function UnmountOnAction() {
      const [mounted, setMounted] = useState(true);
      if(!mounted) return null;

      return (
        <GlDisclosureDropdown defaultOpen>
          <GlDisclosureDropdownTrigger>Actions</GlDisclosureDropdownTrigger>
          <GlDisclosureDropdownContent>
            <GlDisclosureDropdownItem value="remove" onAction={() => {
              onAction();
              flushSync(() => setMounted(false));
            }}>
              Remove dropdown
            </GlDisclosureDropdownItem>
          </GlDisclosureDropdownContent>
        </GlDisclosureDropdown>
      );
    }

    render(<UnmountOnAction />);
    await user.click(await screen.findByRole("menuitem", { name: "Remove dropdown" }));

    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Actions" })).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
