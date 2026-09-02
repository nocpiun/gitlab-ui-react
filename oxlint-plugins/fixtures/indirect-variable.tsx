export function Indirect({ flag }: { flag: boolean }) {
  const a = ["a", flag ? "b" : null].filter(Boolean).join("");
  return <div className={a} />;
}

export function Alias({ flag }: { flag: boolean }) {
  const b = ["a", flag ? "b" : null].filter(Boolean).join(" ");
  const c = b;
  return <div className={c} />;
}

export function NonClass() {
  const describedBy = ["a", undefined].filter(Boolean).join(" ");
  return <div aria-describedby={describedBy} />;
}
