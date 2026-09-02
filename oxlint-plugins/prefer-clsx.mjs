/** Matches `<array>.filter(Boolean).join(" ")` and suggests clsx() instead. */
const preferClsx = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer clsx() over [...].filter(Boolean).join(...) to merge class names",
    },
    messages: {
      preferClsx:
        "Use `clsx()` to merge class names instead of `[...].filter(Boolean).join(...)`.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // The outer call must be `.join(...)`.
        const { callee, arguments: joinArgs } = node;
        if(
          callee?.type !== "MemberExpression"
          || callee.computed
          || callee.property?.type !== "Identifier"
          || callee.property.name !== "join"
          || joinArgs.length !== 1
          || joinArgs[0].type !== "Literal"
        ) return;

        // Its receiver must be a `.filter(Boolean)` call.
        const filterCall = callee.object;
        if(
          filterCall?.type !== "CallExpression"
          || filterCall.callee?.type !== "MemberExpression"
          || filterCall.callee.computed
          || filterCall.callee.property?.type !== "Identifier"
          || filterCall.callee.property.name !== "filter"
          || filterCall.arguments.length !== 1
          || filterCall.arguments[0].type !== "Identifier"
          || filterCall.arguments[0].name !== "Boolean"
        ) return;

        context.report({ node, messageId: "preferClsx" });
      },
    };
  },
};

export default {
  meta: { name: "gitlab-ui-react" },
  rules: { "prefer-clsx": preferClsx },
};
