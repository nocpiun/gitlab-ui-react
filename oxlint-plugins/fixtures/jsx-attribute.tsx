export const direct = <div className={["a", undefined].filter(Boolean).join(" ")} />;
export const separator = <div className={["a", undefined].filter(Boolean).join(", ")} />;
export const fallback = <div className={["a", undefined].filter(Boolean).join(" ") || undefined} />;
export const aria = <div aria-describedby={["a", undefined].filter(Boolean).join(" ")} />;
