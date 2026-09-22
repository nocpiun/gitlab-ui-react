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
