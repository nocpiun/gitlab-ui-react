/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/attribute_list/attribute_list.spec.js
 */

import {
  createRef,
  Fragment,
  type CSSProperties,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlAttributeList, { GlAttributeListItem } from "./attribute-list";

const renderList = (children: ReactNode = null) => renderToStaticMarkup(
  <GlAttributeList>{children}</GlAttributeList>,
);

describe("GlAttributeList", () => {
  it("renders semantic description-list markup inside its responsive container", () => {
    const markup = renderList(
      <GlAttributeListItem label="Author">John Doe</GlAttributeListItem>,
    );

    expect(markup).toMatch(/^<div class="gl-attribute-list-container"><dl/u);
    expect(markup).toContain("<div class=\"gl-attribute-list-item\">");
    expect(markup).toContain(
      "<dt class=\"gl-attribute-list-item-label\"><span>Author</span></dt>",
    );
    expect(markup).toContain(
      "<dd class=\"gl-attribute-list-item-description\">John Doe</dd>",
    );
  });

  it("uses the horizontal layout by default and supports vertical layout", () => {
    expect(renderList()).toContain(
      "class=\"gl-attribute-list gl-attribute-list-horizontal-items\"",
    );

    const verticalMarkup = renderToStaticMarkup(
      <GlAttributeList layout="vertical" />,
    );

    expect(verticalMarkup).toContain(
      "class=\"gl-attribute-list gl-attribute-list-vertical-items\"",
    );
  });

  it("derives the two-column row count from renderable children", () => {
    const visible = true;
    const markup = renderList(
      <>
        <GlAttributeListItem label="One">1</GlAttributeListItem>
        {false && <GlAttributeListItem label="Hidden">Hidden</GlAttributeListItem>}
        {[<GlAttributeListItem key="two" label="Two">2</GlAttributeListItem>]}
        <Fragment>
          <GlAttributeListItem label="Three">3</GlAttributeListItem>
          {visible && <GlAttributeListItem label="Four">4</GlAttributeListItem>}
          <GlAttributeListItem label="Five">5</GlAttributeListItem>
        </Fragment>
      </>,
    );

    expect(markup).toContain("--attribute-list-row-count:3");
  });

  it("uses zero rows for an empty list and keeps its internal row count authoritative", () => {
    const emptyMarkup = renderToStaticMarkup(<GlAttributeList />);
    const styledMarkup = renderToStaticMarkup(
      <GlAttributeList
        style={{
          color: "red",
          "--attribute-list-row-count": 99,
        } as CSSProperties}>
        <GlAttributeListItem label="One">1</GlAttributeListItem>
      </GlAttributeList>,
    );

    expect(emptyMarkup).toContain("--attribute-list-row-count:0");
    expect(styledMarkup).toContain("color:red");
    expect(styledMarkup).toContain("--attribute-list-row-count:1");
    expect(styledMarkup).not.toContain("--attribute-list-row-count:99");
  });

  it("passes native attributes and merges classes on the dl and item elements", () => {
    const markup = renderToStaticMarkup(
      <GlAttributeList className="custom-list" data-testid="list" id="details">
        <GlAttributeListItem
          className="custom-item"
          data-testid="item"
          label="Status">
          Active
        </GlAttributeListItem>
      </GlAttributeList>,
    );

    expect(markup).toContain(
      "<dl data-testid=\"list\" id=\"details\" class=\"gl-attribute-list gl-attribute-list-horizontal-items custom-list\"",
    );
    expect(markup).toContain(
      "<div data-testid=\"item\" class=\"gl-attribute-list-item custom-item\">",
    );
  });

  it("combines list-wide and item-specific label and description classes", () => {
    const markup = renderToStaticMarkup(
      <GlAttributeList
        labelClassName="all-labels"
        descriptionClassName="all-descriptions">
        <GlAttributeListItem
          label="Status"
          labelClassName="status-label"
          descriptionClassName="status-description">
          Active
        </GlAttributeListItem>
      </GlAttributeList>,
    );

    expect(markup).toContain(
      "class=\"gl-attribute-list-item-label all-labels status-label\"",
    );
    expect(markup).toContain(
      "class=\"gl-attribute-list-item-description all-descriptions status-description\"",
    );
  });

  it("renders optional icons as decorative strong icons", () => {
    const markup = renderList(
      <>
        <GlAttributeListItem icon="user" label="Author">John Doe</GlAttributeListItem>
        <GlAttributeListItem label="Status">Active</GlAttributeListItem>
      </>,
    );

    expect(markup.match(/<svg/g)).toHaveLength(1);
    expect(markup).toContain("data-testid=\"user-icon\"");
    expect(markup).toContain("aria-hidden=\"true\"");
    expect(markup).toContain("gl-fill-icon-strong");
    expect(markup).toContain("gl-attribute-list-item-label-icon");
  });

  it("accepts rich React content for labels and descriptions", () => {
    const markup = renderList(
      <GlAttributeListItem
        label={<strong>Merge request</strong>}>
        <a href="#merge-request">!12345</a>
      </GlAttributeListItem>,
    );

    expect(markup).toContain("<span><strong>Merge request</strong></span>");
    expect(markup).toContain("<a href=\"#merge-request\">!12345</a>");
  });

  it("accepts refs for the dl and item elements", () => {
    const listRef = createRef<HTMLDListElement>();
    const itemRef = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(
      <GlAttributeList ref={listRef}>
        <GlAttributeListItem ref={itemRef} label="Status">Active</GlAttributeListItem>
      </GlAttributeList>,
    )).not.toThrow();
  });
});
