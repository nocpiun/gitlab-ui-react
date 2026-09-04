/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/broadcast_message/broadcast_message.spec.js
 *
 * The dismiss callback is covered by the Storybook play function because
 * unit tests run in a node environment.
 */

import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlBroadcastMessage, {
  type GlBroadcastMessageTheme,
} from "./broadcast-message";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const themes = [
  "indigo",
  "light-indigo",
  "blue",
  "light-blue",
  "green",
  "light-green",
  "red",
  "light-red",
  "dark",
  "light",
] satisfies GlBroadcastMessageTheme[];

const renderMessage = (
  props: Partial<ComponentProps<typeof GlBroadcastMessage>> = {},
  children: ReactNode = "Some message",
) => renderToStaticMarkup(
  <GlBroadcastMessage {...props}>{children}</GlBroadcastMessage>,
);

describe("GlBroadcastMessage", () => {
  it("renders the upstream defaults and message structure", () => {
    const markup = renderMessage();

    expect(markup).toContain("gl-broadcast-message indigo banner");
    expect(markup).toContain("gl-broadcast-message-content");
    expect(markup).toContain("gl-broadcast-message-text");
    expect(markup).toContain("<h2 class=\"gl-sr-only\">Admin message</h2>Some message");
    expect(markup).toContain("data-testid=\"bullhorn-icon\"");
    expect(markup).toContain("aria-hidden=\"true\"");
  });

  it("renders a dismiss button by default", () => {
    const markup = renderMessage();

    expect(markup).toContain("gl-broadcast-message-dismiss");
    expect(markup).toContain("aria-label=\"Dismiss\"");
    expect(markup).toContain("data-testid=\"close-icon\"");
  });

  it("does not render a dismiss button when a banner is not dismissible", () => {
    const markup = renderMessage({ dismissible: false });

    expect(markup).not.toContain("gl-broadcast-message-dismiss");
    expect(markup).not.toContain("data-testid=\"close-icon\"");
  });

  it("always renders the dismiss button for notification messages", () => {
    const markup = renderMessage({ dismissible: false, type: "notification" });

    expect(markup).toContain("gl-broadcast-message indigo notification");
    expect(markup).toContain("gl-broadcast-message-dismiss");
  });

  it("supports a custom icon and dismiss label", () => {
    const markup = renderMessage({
      dismissLabel: "Close announcement",
      iconName: "information-o",
    });

    expect(markup).toContain("aria-label=\"Close announcement\"");
    expect(markup).toContain("data-testid=\"information-o-icon\"");
    expect(markup).not.toContain("data-testid=\"bullhorn-icon\"");
  });

  it.each(themes)("renders the %s theme class", (theme) => {
    expect(renderMessage({ theme })).toContain(
      `gl-broadcast-message ${theme} banner`,
    );
  });

  it("passes native attributes and merges a consumer className", () => {
    const markup = renderMessage({
      "aria-label": "Scheduled maintenance",
      className: "custom-message",
      id: "maintenance-message",
    });

    expect(markup).toContain("gl-broadcast-message indigo banner custom-message");
    expect(markup).toContain("aria-label=\"Scheduled maintenance\"");
    expect(markup).toContain("id=\"maintenance-message\"");
  });

  it("renders rich React children without rewriting them", () => {
    const markup = renderMessage({}, (
      <p>
        Planned maintenance. <a href="/status">View status</a>
      </p>
    ));

    expect(markup).toContain(
      "<p>Planned maintenance. <a href=\"/status\">View status</a></p>",
    );
  });
});
