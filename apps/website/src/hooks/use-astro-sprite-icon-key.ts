import { useEffect, useState } from "react";

export function useAstroSpriteIconKey() {
  const [spriteIconKey, setSpriteIconKey] = useState(0);

  useEffect(() => {
    const remountSpriteIcons = () => setSpriteIconKey((key) => key + 1);

    document.addEventListener("astro:after-swap", remountSpriteIcons);
    return () => document.removeEventListener("astro:after-swap", remountSpriteIcons);
  }, []);

  return spriteIconKey;
}
