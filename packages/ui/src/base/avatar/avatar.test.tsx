import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlAvatar from "./avatar";

const renderAvatar = (
  props: ComponentProps<typeof GlAvatar> = {},
) => renderToStaticMarkup(<GlAvatar {...props} />);

describe("GlAvatar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("renders a 32px circular identicon by default", () => {
    const markup = renderAvatar();

    expect(markup).toMatch(/^<div/);
    expect(markup).toContain("gl-avatar gl-avatar-identicon gl-avatar-circle gl-avatar-s32");
    expect(markup).toContain("gl-avatar-identicon-bg1");
    expect(markup).toContain("aria-hidden=\"true\"");
  });

  it("renders an image with the default alternative text", () => {
    const markup = renderAvatar({ src: "/avatar.jpg" });

    expect(markup).toContain("<img");
    expect(markup).toContain("src=\"/avatar.jpg\"");
    expect(markup).toContain("alt=\"avatar\"");
    expect(markup).not.toContain("aria-hidden");
    expect(markup).not.toContain("gl-avatar-identicon");
  });

  it.each([96, 64, 48, 32, 24, 16] as const)(
    "applies the fixed %spx size class",
    (size) => {
      expect(renderAvatar({ size })).toContain(`gl-avatar-s${size}`);
    },
  );

  it("applies responsive size classes and defaults an omitted base size to 32", () => {
    expect(renderAvatar({ size: { default: 16, md: 32, lg: 64 } })).toContain(
      "gl-avatar-s16 gl-md-avatar-s32 gl-lg-avatar-s64",
    );
    expect(renderAvatar({ size: { sm: 48 } })).toContain(
      "gl-avatar-s32 gl-sm-avatar-s48",
    );
  });

  it("renders rectangular avatars without the circle class", () => {
    const markup = renderAvatar({ shape: "rect", src: "/avatar.jpg" });

    expect(markup).toContain("class=\"gl-avatar gl-avatar-s32\"");
    expect(markup).not.toContain("gl-avatar-circle");
  });

  it.each([
    [0, "gl-avatar-identicon-bg1"],
    [6, "gl-avatar-identicon-bg7"],
    [7, "gl-avatar-identicon-bg1"],
  ] as const)("maps entity ID %s to %s", (entityId, expectedClass) => {
    expect(renderAvatar({ entityId })).toContain(expectedClass);
  });

  it("uses an uppercase initial or a complete leading emoji for the identicon", () => {
    expect(renderAvatar({ entityName: "gitlab" })).toContain(">G</div>");
    expect(renderAvatar({ entityName: "🦊Tanuki" })).toContain(">🦊</div>");
    expect(renderAvatar({ entityName: "👩‍💻Developer" })).toContain(">👩‍💻</div>");
  });

  it("forwards native attributes and appends a custom class", () => {
    const markup = renderAvatar({
      alt: "GitLab user",
      className: "custom-avatar",
      id: "user-avatar",
      src: "/avatar.jpg",
      title: "User profile",
    });

    expect(markup).toContain("alt=\"GitLab user\"");
    expect(markup).toContain("id=\"user-avatar\"");
    expect(markup).toContain("title=\"User profile\"");
    expect(markup).toContain("custom-avatar");
  });

  it("reports an invalid runtime size during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderAvatar({ size: 28 as 32 });

    expect(error).toHaveBeenCalledWith(
      "Avatar size should be one of [96,64,48,32,24,16], received: 28",
    );
  });
});
