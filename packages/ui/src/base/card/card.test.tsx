/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/card/card.spec.js
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlCard, { GlCardContent, GlCardFooter, GlCardHeader } from "./card";

const HEADER_TEXT = "In legal trouble?";
const BODY_TEXT = "Better call Saul!";
const FOOTER_TEXT = "(505) 503-4455";

const renderCard = (subcomponents: ReactNode) => renderToStaticMarkup(
  <GlCard>{subcomponents}</GlCard>,
);

describe("GlCard", () => {
  describe("with just the body content", () => {
    it("renders the body content without header or footer", () => {
      const markup = renderCard(<GlCardContent>{BODY_TEXT}</GlCardContent>);

      expect(markup).toContain("<div class=\"gl-card\">");
      expect(markup).toContain(`<div class="gl-card-body">${BODY_TEXT}</div>`);
      expect(markup).not.toContain("gl-card-header");
      expect(markup).not.toContain("gl-card-footer");
    });
  });

  describe("with additional header content", () => {
    it("renders the header and body content", () => {
      const markup = renderCard(
        <>
          <GlCardHeader>{HEADER_TEXT}</GlCardHeader>
          <GlCardContent>{BODY_TEXT}</GlCardContent>
        </>,
      );

      expect(markup).toContain(`<div class="gl-card-header">${HEADER_TEXT}</div>`);
      expect(markup).toContain(`<div class="gl-card-body">${BODY_TEXT}</div>`);
      expect(markup).not.toContain("gl-card-footer");
    });
  });

  describe("with additional footer content", () => {
    it("renders the body and footer content", () => {
      const markup = renderCard(
        <>
          <GlCardContent>{BODY_TEXT}</GlCardContent>
          <GlCardFooter>{FOOTER_TEXT}</GlCardFooter>
        </>,
      );

      expect(markup).toContain(`<div class="gl-card-body">${BODY_TEXT}</div>`);
      expect(markup).toContain(`<div class="gl-card-footer">${FOOTER_TEXT}</div>`);
      expect(markup).not.toContain("gl-card-header");
    });
  });

  describe("className merging", () => {
    it("merges consumer classes on the card", () => {
      const markup = renderToStaticMarkup(<GlCard className="applied-class" />);

      expect(markup).toContain("class=\"gl-card applied-class\"");
    });

    it("merges consumer classes on the header", () => {
      const markup = renderToStaticMarkup(<GlCardHeader className="applied-class" />);

      expect(markup).toContain("class=\"gl-card-header applied-class\"");
    });

    it("merges consumer classes on the content", () => {
      const markup = renderToStaticMarkup(<GlCardContent className="applied-class" />);

      expect(markup).toContain("class=\"gl-card-body applied-class\"");
    });

    it("merges consumer classes on the footer", () => {
      const markup = renderToStaticMarkup(<GlCardFooter className="applied-class" />);

      expect(markup).toContain("class=\"gl-card-footer applied-class\"");
    });
  });

  describe("element props", () => {
    it("passes native attributes through to the rendered element", () => {
      const markup = renderToStaticMarkup(
        <GlCard data-testid="card" id="example" />,
      );

      expect(markup).toContain("data-testid=\"card\"");
      expect(markup).toContain("id=\"example\"");
    });
  });
});
