import { defineMdastPlugin } from "satteri";

const CALLOUTS = {
  caution: { variant: "danger" },
  important: { variant: "info" },
  note: { variant: "info" },
  tip: { variant: "tip" },
  warning: { variant: "warning" },
};

const CALLOUT_MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]*\r?\n|[ \t]+|$)/i;

function withoutCalloutMarker(paragraph, markerLength) {
  const [marker, ...remainingChildren] = paragraph.children;
  const markerRemainder = marker.value.slice(markerLength);
  const children = markerRemainder
    ? [{ ...marker, value: markerRemainder }, ...remainingChildren]
    : remainingChildren;

  return children.length ? { ...paragraph, children } : null;
}

export const calloutsPlugin = defineMdastPlugin({
  name: "docs-callouts",
  blockquote(node, context) {
    const [firstChild, ...remainingChildren] = node.children;
    if(firstChild?.type !== "paragraph") return;

    const markerNode = firstChild.children[0];
    if(markerNode?.type !== "text") return;

    const marker = CALLOUT_MARKER.exec(markerNode.value);
    if(!marker) return;

    const callout = CALLOUTS[marker[1].toLowerCase()];
    const firstParagraph = withoutCalloutMarker(firstChild, marker[0].length);

    context.replaceNode(node, {
      type: "mdxJsxFlowElement",
      name: "DocsCallout",
      attributes: [
        { type: "mdxJsxAttribute", name: "kind", value: marker[1].toLowerCase() },
        { type: "mdxJsxAttribute", name: "variant", value: callout.variant },
      ],
      children: firstParagraph
        ? [firstParagraph, ...remainingChildren]
        : remainingChildren,
    });
  },
});
