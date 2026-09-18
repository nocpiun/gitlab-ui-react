// @vitest-environment jsdom

import { StrictMode, createRef, type PropsWithChildren } from "react";
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  GlSorting,
  useSorting,
  type GlSortingOption,
  type GlSortingProps,
  type UseSortingOptions,
} from "./index";

const sortOptions: readonly GlSortingOption[] = [
  { value: "created", text: "Created date" },
  { value: "updated", text: "Updated date" },
  { value: "relevant", text: "Most relevant", directionToggleDisabled: true },
];

const originalScrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
beforeAll(() => {
  // JSDOM has no scrolling layout; listbox focus behavior is exercised below.
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});
afterAll(() => {
  if(originalScrollIntoView) {
    Object.defineProperty(Element.prototype, "scrollIntoView", originalScrollIntoView);
  } else {
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  }
});
afterEach(cleanup);

describe("GlSorting", () => {
  it("renders a single grouped control with descending and block defaults", () => {
    render(<GlSorting />);
    const group = screen.getByRole("group");
    const trigger = screen.getByRole("button", { name: "Sort by:" });
    const direction = screen.getByRole("button", { name: "Sort direction: descending" });

    expect(group.className).toContain("gl-sorting gl-flex");
    expect(trigger.className).toContain("btn-block");
    expect(trigger.querySelector(".gl-button-text")?.className).toContain("gl-w-full");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(direction.querySelector("[data-testid=\"sort-highest-icon\"]")).not.toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expectTypeOf<"children" extends keyof GlSortingProps ? true : false>().toEqualTypeOf<false>();
  });

  it.each([undefined, null, ""])("uses selected text when text is %s", (text) => {
    render(<GlSorting sortOptions={sortOptions} defaultSortBy="created" text={text} />);
    expect(screen.getByRole("button", { name: "Sort by: Created date" })).toBeTruthy();
  });

  it("updates custom text and the accessible prefix independently of the field", () => {
    const { rerender } = render(
      <GlSorting sortOptions={sortOptions} sortBy="created" text="Sorting options" />,
    );
    expect(screen.getByRole("button", { name: "Sort by: Sorting options" })).toBeTruthy();
    rerender(<GlSorting sortOptions={sortOptions} sortBy="updated" sortByLabel="Order by:" />);
    expect(screen.getByRole("button", { name: "Order by: Updated date" })).toBeTruthy();
  });

  it.each([
    [0, "Zero"],
    ["", "Empty key"],
  ] as const)("preserves the %s field value", async (value, text) => {
    const user = userEvent.setup();
    render(<GlSorting sortOptions={[{ value, text }]} defaultSortBy={value} />);
    await user.click(screen.getByRole("button", { name: `Sort by: ${text}` }));
    expect((await screen.findByRole("option", { name: text })).getAttribute("aria-selected"))
      .toBe("true");
  });

  it("supports option selection and suppresses repeated selections", async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();
    render(<GlSorting sortOptions={sortOptions} defaultSortBy="created" onSortByChange={onSortByChange} />);

    await user.click(screen.getByRole("button", { name: "Sort by: Created date" }));
    const selected = await screen.findByRole("option", { name: "Created date" });
    expect(selected.getAttribute("aria-selected")).toBe("true");
    await user.click(selected);
    expect(onSortByChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Sort by: Created date" }));
    await user.click(await screen.findByRole("option", { name: "Updated date" }));
    expect(onSortByChange).toHaveBeenCalledExactlyOnceWith("updated");
    expect(screen.getByRole("button", { name: "Sort by: Updated date" })).toBeTruthy();
  });

  it("requests controlled changes and waits for new props", async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();
    const onSortDirectionChange = vi.fn();
    const { rerender } = render(
      <GlSorting sortOptions={sortOptions} sortBy="created" isAscending={false}
        onSortByChange={onSortByChange} onSortDirectionChange={onSortDirectionChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Sort by: Created date" }));
    await user.click(await screen.findByRole("option", { name: "Updated date" }));
    await user.click(screen.getByRole("button", { name: "Sort direction: descending" }));
    expect(onSortByChange).toHaveBeenCalledExactlyOnceWith("updated");
    expect(onSortDirectionChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.getByRole("button", { name: "Sort by: Created date" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sort direction: descending" })).toBeTruthy();

    rerender(<GlSorting sortOptions={sortOptions} sortBy="updated" isAscending />);
    expect(screen.getByRole("button", { name: "Sort by: Updated date" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sort direction: ascending" })
      .querySelector("[data-testid=\"sort-lowest-icon\"]")).not.toBeNull();
  });

  it("toggles uncontrolled direction with pointer and keyboard", async () => {
    const user = userEvent.setup();
    const onSortDirectionChange = vi.fn();
    render(<GlSorting onSortDirectionChange={onSortDirectionChange} />);
    await user.click(screen.getByRole("button", { name: "Sort direction: descending" }));
    expect(onSortDirectionChange).toHaveBeenLastCalledWith(true);
    await user.keyboard(" ");
    expect(onSortDirectionChange).toHaveBeenLastCalledWith(false);
    expect(onSortDirectionChange).toHaveBeenCalledTimes(2);
  });

  it("inherits keyboard navigation, selection, Escape and focus restoration", async () => {
    const user = userEvent.setup();
    render(<GlSorting sortOptions={sortOptions} defaultSortBy="created" />);
    const trigger = screen.getByRole("button", { name: "Sort by: Created date" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const created = await screen.findByRole("option", { name: "Created date" });
    await waitFor(() => expect(document.activeElement).toBe(created));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "Updated date" }));
    await user.keyboard("{Enter}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(trigger.textContent).toBe("Updated date");
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(trigger.getAttribute("aria-expanded")).not.toBe("true");
  });

  it("keeps a disabled direction button focusable without activating it", async () => {
    const user = userEvent.setup();
    const onSortDirectionChange = vi.fn();
    render(<GlSorting sortOptions={sortOptions} defaultSortBy="relevant"
      onSortDirectionChange={onSortDirectionChange} />);
    const direction = screen.getByRole("button", { name: "Sort direction unavailable for Most relevant" });
    expect(direction.getAttribute("aria-disabled")).toBe("true");
    expect(direction.hasAttribute("disabled")).toBe(false);
    screen.getByRole("button", { name: "Sort by: Most relevant" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(direction);
    await user.keyboard("{Enter} ");
    await user.click(direction);
    expect(onSortDirectionChange).not.toHaveBeenCalled();
  });

  it("uses generic and overridden disabled names and restores directional behavior", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<GlSorting sortOptions={[{ value: "x", text: "", directionToggleDisabled: true }]}
      sortBy="x" />);
    expect(screen.getByRole("button", { name: "Sort direction unavailable" })).toBeTruthy();
    rerender(<GlSorting sortOptions={sortOptions} sortBy="relevant" sortDirectionTooltip="Custom reason" />);
    expect(screen.getByRole("button", { name: "Custom reason" }).getAttribute("aria-disabled")).toBe("true");
    rerender(<GlSorting sortOptions={sortOptions} sortBy="created" sortDirectionTooltip="" />);
    const direction = screen.getByRole("button", { name: "Sort direction: descending" });
    expect(direction.getAttribute("aria-disabled")).not.toBe("true");
    await user.click(direction);
    expect(screen.getByRole("button", { name: "Sort direction: ascending" })).toBeTruthy();
  });

  it("forwards classes, attributes, block and the root ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<GlSorting ref={ref} title="Sorting controls" className="root-class" block={false}
      dropdownClassName="dropdown-class" dropdownToggleClassName="trigger-class"
      sortDirectionToggleClassName="direction-class" />);
    expect(ref.current).toBe(screen.getByRole("group"));
    expect(ref.current?.title).toBe("Sorting controls");
    expect(ref.current?.className).toContain("root-class");
    expect(ref.current?.querySelector(".gl-listbox")?.className).toContain("dropdown-class");
    const trigger = screen.getByRole("button", { name: "Sort by:" });
    expect(trigger.className).toContain("trigger-class");
    expect(trigger.className).not.toContain("btn-block");
    expect(trigger.querySelector(".gl-button-text")?.className).not.toContain("gl-w-full");
    expect(screen.getByRole("button", { name: "Sort direction: descending" }).className)
      .toContain("sorting-direction-button direction-class");
  });

  it("associates unique prefix and text IDs across instances", () => {
    render(<><GlSorting text="First" /><GlSorting text="Second" /></>);
    const ids = ["First", "Second"].flatMap((text) => {
      const trigger = screen.getByRole("button", { name: `Sort by: ${text}` });
      const references = trigger.getAttribute("aria-labelledby")!.split(" ");
      expect(references).toHaveLength(2);
      expect(document.getElementById(references[0])?.textContent).toBe("Sort by:");
      expect(document.getElementById(references[1])?.textContent).toBe(text);
      return references;
    });
    expect(new Set(ids).size).toBe(4);
  });
});

describe("useSorting", () => {
  it("defaults to no field and descending without options", () => {
    const { result } = renderHook(() => useSorting());
    expect(result.current.sortBy).toBeNull();
    expect(result.current.isAscending).toBe(false);
    expect(result.current.selectedSortOption).toBeUndefined();
    expect(result.current.directionToggleDisabled).toBe(false);
    expect(result.current.sortingProps.sortOptions).toEqual([]);
  });

  it("updates uncontrolled state and exposes directly bindable props", () => {
    const { result } = renderHook(() => useSorting({ sortOptions, defaultSortBy: "created" }));
    act(() => result.current.sortingProps.onSortByChange("updated"));
    act(() => result.current.sortingProps.onSortDirectionChange(true));
    expect(result.current.sortBy).toBe("updated");
    expect(result.current.selectedSortOption).toBe(sortOptions[1]);
    expect(result.current.isAscending).toBe(true);
    expect(result.current.sortingProps.sortOptions).toBe(sortOptions);
    expect(result.current.sortingProps.sortBy).toBe("updated");
    expect(result.current.sortingProps.isAscending).toBe(true);
    act(() => result.current.toggleSortDirection());
    expect(result.current.isAscending).toBe(false);
  });

  it("does not emit redundant changes or emit while synchronizing props", () => {
    const onSortByChange = vi.fn();
    const onSortDirectionChange = vi.fn();
    const { result, rerender } = renderHook((options: UseSortingOptions) => useSorting(options), {
      initialProps: { sortOptions, sortBy: "created", isAscending: false, onSortByChange, onSortDirectionChange },
    });
    act(() => result.current.setSortBy("created"));
    act(() => result.current.setIsAscending(false));
    rerender({ sortOptions, sortBy: "updated", isAscending: true, onSortByChange, onSortDirectionChange });
    expect(onSortByChange).not.toHaveBeenCalled();
    expect(onSortDirectionChange).not.toHaveBeenCalled();
    expect(result.current.sortBy).toBe("updated");
    expect(result.current.isAscending).toBe(true);
  });

  it("only requests changes in controlled mode, including an explicitly null field", () => {
    const onSortByChange = vi.fn();
    const onSortDirectionChange = vi.fn();
    const { result } = renderHook(() => useSorting({
      sortOptions, sortBy: null, defaultSortBy: "created", isAscending: false,
      onSortByChange, onSortDirectionChange,
    }));
    act(() => result.current.setSortBy("updated"));
    act(() => result.current.toggleSortDirection());
    expect(onSortByChange).toHaveBeenCalledExactlyOnceWith("updated");
    expect(onSortDirectionChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(result.current.sortBy).toBeNull();
    expect(result.current.isAscending).toBe(false);
  });

  it.each(["field", "direction"])("supports independent controlled %s state", (controlled) => {
    const { result } = renderHook(() => useSorting({
      sortOptions, defaultSortBy: "created",
      sortBy: controlled === "field" ? "created" : undefined,
      isAscending: controlled === "direction" ? false : undefined,
    }));
    act(() => result.current.setSortBy("updated"));
    act(() => result.current.setIsAscending(true));
    expect(result.current.sortBy).toBe(controlled === "field" ? "created" : "updated");
    expect(result.current.isAscending).toBe(controlled !== "direction");
  });

  it("uses defaults only at initialization and retains unknown or removed fields", () => {
    const initialProps: UseSortingOptions = {
      sortOptions, defaultSortBy: "created", defaultIsAscending: true,
    };
    const { result, rerender } = renderHook((options: UseSortingOptions) => useSorting(options), { initialProps });
    rerender({ sortOptions: [], defaultSortBy: "updated", defaultIsAscending: false });
    expect(result.current.sortBy).toBe("created");
    expect(result.current.isAscending).toBe(true);
    expect(result.current.selectedSortOption).toBeUndefined();
    act(() => result.current.setSortBy("unknown"));
    rerender({ sortOptions });
    expect(result.current.sortBy).toBe("unknown");
    act(() => result.current.setSortBy(null));
    expect(result.current.sortBy).toBeNull();
  });

  it("retains direction through non-directional fields and guards every direction operation", () => {
    const onSortDirectionChange = vi.fn();
    const { result } = renderHook(() => useSorting({
      sortOptions, defaultSortBy: "created", defaultIsAscending: true, onSortDirectionChange,
    }));
    act(() => result.current.setSortBy("relevant"));
    expect(result.current.directionToggleDisabled).toBe(true);
    act(() => result.current.setIsAscending(false));
    act(() => result.current.toggleSortDirection());
    expect(result.current.isAscending).toBe(true);
    expect(onSortDirectionChange).not.toHaveBeenCalled();
    act(() => result.current.setSortBy("updated"));
    expect(result.current.directionToggleDisabled).toBe(false);
    act(() => result.current.toggleSortDirection());
    expect(result.current.isAscending).toBe(false);
    expect(onSortDirectionChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("derives disabled state from the latest options without resetting controlled direction", () => {
    const { result, rerender } = renderHook((options: UseSortingOptions) => useSorting(options), {
      initialProps: { sortOptions, sortBy: "created", isAscending: true },
    });
    rerender({ sortOptions: [{ value: "created", text: "Created date", directionToggleDisabled: true }],
      sortBy: "created", isAscending: false });
    expect(result.current.directionToggleDisabled).toBe(true);
    expect(result.current.isAscending).toBe(false);
    rerender({ sortOptions: [], sortBy: "created", isAscending: true });
    expect(result.current.directionToggleDisabled).toBe(false);
    expect(result.current.sortBy).toBe("created");
  });

  it("distinguishes numbers from strings with the same characters", () => {
    const { result } = renderHook(() => useSorting({
      sortOptions: [{ value: 0, text: "Number" }, { value: "0", text: "String" }], defaultSortBy: 0,
    }));
    expect(result.current.selectedSortOption?.text).toBe("Number");
    act(() => result.current.setSortBy("0"));
    expect(result.current.selectedSortOption?.text).toBe("String");
  });

  it("emits each change exactly once in StrictMode", () => {
    const onSortByChange = vi.fn();
    const onSortDirectionChange = vi.fn();
    const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(() => useSorting({
      sortOptions, defaultSortBy: "created", onSortByChange, onSortDirectionChange,
    }), { wrapper });
    expect(onSortByChange).not.toHaveBeenCalled();
    expect(onSortDirectionChange).not.toHaveBeenCalled();
    act(() => result.current.setSortBy("updated"));
    act(() => result.current.toggleSortDirection());
    act(() => result.current.setSortBy("updated"));
    act(() => result.current.setIsAscending(true));
    expect(onSortByChange).toHaveBeenCalledExactlyOnceWith("updated");
    expect(onSortDirectionChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
