export const popupClassName = ["a", undefined].filter(Boolean).join(" ");
export const dynamicClassName = (flag: boolean) => [
  "a",
  flag ? "b" : null,
].filter(Boolean).join(" ");
