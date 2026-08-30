import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlAvatarLabeled from "./avatar-labeled";

const renderAvatarLabeled = (
  props: ComponentProps<typeof GlAvatarLabeled>,
  children?: ReactNode,
) => renderToStaticMarkup(
  <GlAvatarLabeled {...props}>{children}</GlAvatarLabeled>,
);

describe("GlAvatarLabeled", () => {
  it("renders its label, sub-label, and a decorative avatar image", () => {
    const markup = renderAvatarLabeled({
      label: "GitLab User",
      src: "/avatar.jpg",
      subLabel: "@gitlab-user",
    });

    expect(markup).toContain("class=\"gl-avatar-labeled\"");
    expect(markup).toContain("class=\"gl-avatar gl-avatar-circle gl-avatar-s64\"");
    expect(markup).toContain("src=\"/avatar.jpg\"");
    expect(markup).toContain("alt=\"\"");
    expect(markup).toContain("class=\"gl-avatar-labeled-label\">GitLab User");
    expect(markup).toContain("class=\"gl-avatar-labeled-sublabel\">@gitlab-user");
  });

  it("passes native attributes and avatar props to the avatar, not the root", () => {
    const markup = renderAvatarLabeled({
      entityId: 1,
      entityName: "GitLab",
      fallbackOnError: true,
      itemProp: "logo",
      label: "GitLab",
      shape: "rect",
      size: { default: 24, md: 48 },
      src: "/avatar.jpg",
    });
    const rootTag = markup.match(/<div[^>]*>/)?.[0];

    expect(rootTag).not.toContain("itemProp");
    expect(markup).toContain("itemProp=\"logo\"");
    expect(markup).toContain("gl-avatar-s24 gl-md-avatar-s48");
    expect(markup).not.toContain("gl-avatar-circle");
  });

  it("renders an identicon when no image source is provided", () => {
    const markup = renderAvatarLabeled({
      entityId: 2,
      entityName: "project",
      label: "Project",
    });

    expect(markup).toContain("gl-avatar-identicon");
    expect(markup).toContain("gl-avatar-identicon-bg3");
    expect(markup).toContain("aria-hidden=\"true\"");
    expect(markup).toContain(">P</div>");
  });

  it("supports inline labels", () => {
    expect(renderAvatarLabeled({
      inlineLabels: true,
      label: "GitLab User",
      subLabel: "@gitlab-user",
    })).toContain("gl-avatar-labeled-labels !gl-text-left inline-labels");
  });

  it("renders metadata and additional content", () => {
    const markup = renderAvatarLabeled({
      label: "GitLab User",
      meta: <span data-testid="user-meta">2FA</span>,
    }, <button type="button">Follow</button>);

    expect(markup).toContain("data-testid=\"user-meta\">2FA");
    expect(markup).toContain("<button type=\"button\">Follow</button>");
  });

  it("renders label and sub-label links with label link attributes", () => {
    const markup = renderAvatarLabeled({
      label: "GitLab User",
      labelLink: "https://gitlab.com/gitlab-user",
      labelLinkAttrs: {
        "aria-label": "Open GitLab user",
        target: "_blank",
      },
      subLabel: "@gitlab-user",
      subLabelLink: "/gitlab-user/activity",
    });

    expect(markup).toContain("href=\"https://gitlab.com/gitlab-user\"");
    expect(markup).toContain("aria-label=\"Open GitLab user\"");
    expect(markup).toContain("target=\"_blank\"");
    expect(markup).toContain("rel=\"noopener noreferrer\"");
    expect(markup).toContain("href=\"/gitlab-user/activity\"");
    expect(markup.match(/class=\"gl-link gl-link-meta gl-avatar-link/g)).toHaveLength(2);
    expect(markup).toContain("gl-cursor-pointer");
  });

  it("renders plain text when link destinations are empty", () => {
    const markup = renderAvatarLabeled({
      label: "GitLab User",
      labelLink: "",
      subLabel: "@gitlab-user",
      subLabelLink: "",
    });

    expect(markup).not.toContain("<a");
    expect(markup).not.toContain("gl-cursor-pointer");
  });

  it("applies root and avatar classes to their respective elements", () => {
    const markup = renderAvatarLabeled({
      avatarClassName: "custom-avatar",
      className: "custom-root",
      label: "GitLab User",
    });

    expect(markup).toContain("class=\"gl-avatar-labeled custom-root\"");
    expect(markup).toContain("custom-avatar");
  });
});
