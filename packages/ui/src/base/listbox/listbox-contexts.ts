import {
  createContext,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export type RegisteredListboxItem = {
  disabled: boolean;
  element: HTMLElement | null;
  id: string;
  key: string;
  label: string;
  value: string | number | null;
};

export type ListboxContentContextValue = {
  activeItemId: string | null;
  getItemPosition(key: string): number | undefined;
  hasHeader: boolean;
  handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>): void;
  listboxId: string;
  open: boolean;
  registryVersion: number;
  registerItem(item: RegisteredListboxItem): void;
  searchInputId: string;
  searchable: boolean;
  setActiveItemId(id: string | null): void;
  setSearchInputId(id: string | null): void;
  setSearchInputElement(element: HTMLInputElement | null): void;
  setSearchValue(value: string): void;
  totalItems?: number;
  unregisterItem(key: string): void;
};

export const ListboxContentContext = createContext<ListboxContentContextValue | null>(null);
export const ListboxGroupContext = createContext(false);
