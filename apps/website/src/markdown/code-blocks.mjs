import { defineHastPlugin } from "satteri";

export const codeBlocksPlugin = defineHastPlugin({
  name: "docs-code-blocks",
  element: {
    filter: ["pre"],
    visit(node, context) {
      const isCodeBlock = node.children.some((child) => (
        child.type === "element" && child.tagName === "code"
      ));
      if(!isCodeBlock) return;

      context.wrapNode(node, {
        type: "element",
        tagName: "div",
        properties: { className: ["docs-code-block"] },
        children: [],
      });
    },
  },
});
