// @vitest-environment jsdom

import { useState } from "react";
import { flushSync } from "react-dom";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlDisclosureDropdown, {
  GlDisclosureDropdownContent,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
} from "./disclosure-dropdown";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GlDisclosureDropdown interactions", () => {
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
