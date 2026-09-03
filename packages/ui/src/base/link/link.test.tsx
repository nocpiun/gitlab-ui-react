import {
  forwardRef,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlLink from "./link";

const renderLink = (
  props: ComponentProps<typeof GlLink> = {},
  children: ReactNode = "Link text",
) => renderToStaticMarkup(<GlLink {...props}>{children}</GlLink>);

type RouterLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { to: string };

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function RouterLink({
  to,
  ...props
}, ref) {
  return <a {...props} ref={ref} href={to} />;
});

describe("GlLink", () => {
  it("renders a standard anchor with the default hash destination", () => {
    const markup = renderLink({ id: "help-link" });

    expect(markup).toContain("<a");
    expect(markup).toContain("class=\"gl-link\"");
    expect(markup).toContain("data-alt=\"(external link)\"");
    expect(markup).toContain("href=\"#\"");
    expect(markup).toContain("id=\"help-link\"");
    expect(markup).not.toContain("target=");
    expect(markup).not.toContain("rel=");
  });

  it.each([
    [undefined, ["gl-link"]],
    ["inline", ["gl-link", "gl-link-inline"]],
    ["meta", ["gl-link", "gl-link-meta"]],
    ["mention", ["gl-link", "gl-link-mention"]],
    ["mentionCurrent", ["gl-link", "gl-link-mention-current"]],
  ] as const)("applies the %s variant classes", (variant, expectedClasses) => {
    const markup = renderLink({ variant });

    expectedClasses.forEach((className) => expect(markup).toContain(className));
  });

  it("removes component classes for the unstyled variant", () => {
    const markup = renderLink({
      active: true,
      className: "consumer-class",
      disabled: true,
      variant: "unstyled",
    });

    expect(markup).toContain("class=\"consumer-class\"");
    expect(markup).not.toContain("gl-link");
    expect(markup).not.toContain("class=\"active");
    expect(markup).not.toContain("disabled consumer-class");
  });

  it("applies active and custom classes", () => {
    const markup = renderLink({ active: true, className: "consumer-class" });

    expect(markup).toContain("gl-link");
    expect(markup).toContain("active");
    expect(markup).toContain("consumer-class");
  });

  it("passes native anchor attributes through", () => {
    const markup = renderLink({
      "aria-current": "page",
      download: "report.csv",
      href: "/report.csv",
    });

    expect(markup).toContain("aria-current=\"page\"");
    expect(markup).toContain("download=\"report.csv\"");
    expect(markup).toContain("href=\"/report.csv\"");
  });

  it("falls back to the hash destination for an empty href", () => {
    expect(renderLink({ href: "" })).toContain("href=\"#\"");
  });

  it("sanitizes unsafe protocols by default", () => {
    expect(renderLink({ href: "javascript:alert(1)" })).toContain("href=\"about:blank\"");
  });

  it("allows trusted consumers to bypass URL sanitization", () => {
    const dataUrl = "data:text/plain;charset=utf-8,GitLab%20is%20awesome";

    expect(renderLink({ href: dataUrl, isUnsafeLink: true })).toContain(`href="${dataUrl}"`);
  });

  it("secures new browsing contexts while preserving supplied rel values", () => {
    const markup = renderLink({
      href: "https://example.com",
      rel: "alternate noopener",
      target: "_blank",
    });

    expect(markup).toContain("rel=\"alternate noopener noreferrer\"");
    expect(markup).toContain("target=\"_blank\"");
  });

  it.each([undefined, "inline", "meta"] as const)(
    "shows the external indicator for the %s variant",
    (variant) => {
      const markup = renderLink({
        href: "https://example.com",
        showExternalIcon: true,
        target: "_blank",
        variant,
      });

      expect(markup).toContain("gl-link-external");
      expect(markup).toContain("data-alt=\"(external link)\"");
    },
  );

  it.each(["mention", "mentionCurrent", "unstyled"] as const)(
    "does not show the external indicator for the %s variant",
    (variant) => {
      const markup = renderLink({
        href: "https://example.com",
        showExternalIcon: true,
        target: "_blank",
        variant,
      });

      expect(markup).not.toContain("gl-link-external");
    },
  );

  it("does not show the external indicator for same-origin or same-window links", () => {
    expect(renderLink({
      href: "/projects",
      showExternalIcon: true,
      target: "_blank",
    })).not.toContain("gl-link-external");
    expect(renderLink({
      href: "https://example.com",
      showExternalIcon: true,
    })).not.toContain("gl-link-external");
  });

  it("exposes the disabled state and removes the link from the tab sequence", () => {
    const markup = renderLink({ disabled: true, href: "/projects" });

    expect(markup).toContain("aria-disabled=\"true\"");
    expect(markup).toContain("tabindex=\"-1\"");
    expect(markup).toContain("disabled");
    expect(markup).toContain("href=\"/projects\"");
    expect(markup).not.toContain(" disabled=\"\"");
  });

  it("supports Base UI render composition for router links", () => {
    const markup = renderLink({
      className: "consumer-class",
      render: <RouterLink className="router-link" data-router-link="" to="/projects" />,
    });

    expect(markup).toContain("data-router-link=\"\"");
    expect(markup).toContain("href=\"/projects\"");
    expect(markup).toContain("router-link");
    expect(markup).toContain("gl-link");
    expect(markup).toContain("consumer-class");
  });

  it("does not block router composition when no href is supplied", () => {
    let composedClick: MouseEventHandler<HTMLAnchorElement> | undefined;
    const preventDefault = vi.fn();

    renderLink({
      render: (props) => {
        composedClick = props.onClick as MouseEventHandler<HTMLAnchorElement>;
        return <a {...props as ComponentPropsWithoutRef<"a">} href="/projects" />;
      },
    });
    composedClick?.({ preventDefault } as unknown as ReactMouseEvent<HTMLAnchorElement>);

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
