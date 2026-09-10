import { defineMdastPlugin } from "satteri";

const CALLOUTS = {
  caution: { title: "Caution", variant: "danger" },
  important: { title: "Important", variant: "info" },
  note: { title: "Note", variant: "info" },
  tip: { title: "Tip", variant: "tip" },
  warning: { title: "Warning", variant: "warning" },
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
        { type: "mdxJsxAttribute", name: "title", value: callout.title },
        { type: "mdxJsxAttribute", name: "variant", value: callout.variant },
      ],
      children: firstParagraph
        ? [firstParagraph, ...remainingChildren]
        : remainingChildren,
    });
  },
});
