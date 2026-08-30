import {
  forwardRef,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlAvatar from "../avatar/avatar";
import GlAvatarLink from "./avatar-link";

const renderAvatarLink = (
  props: ComponentProps<typeof GlAvatarLink> = {},
  children: ReactNode = <GlAvatar entityName="GitLab" />,
) => renderToStaticMarkup(
  <GlAvatarLink {...props}>{children}</GlAvatarLink>,
);

type RouterLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { to: string };

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function RouterLink({
  to,
  ...props
}, ref) {
  return <a {...props} ref={ref} href={to} />;
});

describe("GlAvatarLink", () => {
  it("renders a meta link with the avatar-link class", () => {
    const markup = renderAvatarLink({ href: "/gitlab-user" });

    expect(markup).toContain("<a");
    expect(markup).toContain("class=\"gl-link gl-link-meta gl-avatar-link\"");
    expect(markup).toContain("href=\"/gitlab-user\"");
    expect(markup).toContain("gl-avatar");
  });

  it("appends custom classes and forwards link attributes", () => {
    const markup = renderAvatarLink({
      "aria-label": "Open user profile",
      className: "custom-link",
      href: "https://example.com/profile",
      target: "_blank",
    });

    expect(markup).toContain("custom-link");
    expect(markup).toContain("aria-label=\"Open user profile\"");
    expect(markup).toContain("target=\"_blank\"");
    expect(markup).toContain("rel=\"noopener noreferrer\"");
  });

  it("inherits URL sanitization from GlLink", () => {
    expect(renderAvatarLink({ href: "javascript:alert(1)" })).toContain(
      "href=\"about:blank\"",
    );
  });

  it("inherits the disabled link behavior", () => {
    const markup = renderAvatarLink({ disabled: true, href: "/gitlab-user" });

    expect(markup).toContain("aria-disabled=\"true\"");
    expect(markup).toContain("tabindex=\"-1\"");
    expect(markup).toContain("disabled");
  });

  it("supports Base UI render composition for router links", () => {
    const markup = renderAvatarLink({
      href: undefined,
      render: <RouterLink data-router-link="" to="/gitlab-user" />,
    });

    expect(markup).toContain("data-router-link=\"\"");
    expect(markup).toContain("href=\"/gitlab-user\"");
    expect(markup).toContain("gl-link-meta");
    expect(markup).toContain("gl-avatar-link");
  });
});
