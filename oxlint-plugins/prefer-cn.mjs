/** Matches `<array>.filter(Boolean).join(...)` used as a className, and suggests cn() instead. */

const CLASS_NAME_SINK = /className$/i;

/** Finds the scope variable declared by a VariableDeclarator with an Identifier id. */
function findDeclaredVariable(sourceCode, declarator) {
  let scope = sourceCode.getScope(declarator);
  while(scope) {
    const variable = scope.set.get(declarator.id.name);
    if(variable) return variable;
    scope = scope.upper;
  }
  return null;
}

/**
 * Walks up from the join call through transparent wrappers (`||`/`??`,
 * ternaries, `as` casts, arrow bodies, return statements) and returns true
 * when the joined value ends up where a className is expected: a `className`/
 * `*ClassName` JSX attribute, an object property (e.g. a cva config), or a
 * variable named `*className`.
 *
 * A variable with any other name is followed through its read references, so
 * `const a = [...].filter(Boolean).join(""); <div className={a} />` and alias
 * chains like `const b = a` are still reported.
 */
function flowsIntoClassName(sourceCode, node, seen = new Set()) {
  if(seen.has(node)) return false;
  seen.add(node);

  let current = node;
  let parent = current.parent;

  while(
    parent && (
      (parent.type === "LogicalExpression" && (parent.operator === "||" || parent.operator === "??"))
      || parent.type === "ConditionalExpression"
      || parent.type === "TSAsExpression"
      || parent.type === "TSSatisfiesExpression"
      || parent.type === "ReturnStatement"
      || (parent.type === "ArrowFunctionExpression" && parent.body === current)
    )
  ) {
    current = parent;
    parent = current.parent;
  }

  // JSX attribute: <div className={...} />, <div wrapperClassName={...} />
  if(parent?.type === "JSXExpressionContainer") {
    const attribute = parent.parent;
    return attribute?.type === "JSXAttribute"
      && attribute.name?.type === "JSXIdentifier"
      && CLASS_NAME_SINK.test(attribute.name.name);
  }

  // Object property: cva({ className: ... })
  if(
    parent?.type === "Property"
    && !parent.computed
    && parent.key?.type === "Identifier"
  ) {
    return CLASS_NAME_SINK.test(parent.key.name);
  }

  // Variable: const popupClassName = [...].filter(Boolean).join(...)
  // or const popupClassName = () => [...].filter(Boolean).join(...)
  if(parent?.type === "VariableDeclarator" && parent.id?.type === "Identifier") {
    if(CLASS_NAME_SINK.test(parent.id.name)) return true;

    // A plain variable: follow its read references (and aliases) to the sink.
    const variable = findDeclaredVariable(sourceCode, parent);
    return variable?.references.some(
      (reference) => reference.isRead()
        && flowsIntoClassName(sourceCode, reference.identifier, seen),
    ) ?? false;
  }

  return false;
}

const preferCn = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer cn() over [...].filter(Boolean).join(...) to merge class names",
    },
    messages: {
      preferCn:
        "Use `cn()` to merge class names instead of `[...].filter(Boolean).join(...)`.",
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

        if(!flowsIntoClassName(context.sourceCode, node)) return;

        context.report({ node, messageId: "preferCn" });
      },
    };
  },
};

export default {
  meta: { name: "gitlab-ui-react" },
  rules: { "prefer-cn": preferCn },
};
