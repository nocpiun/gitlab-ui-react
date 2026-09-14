import {
  GlPath,
  GlPathItem,
  GlPathItemMetric,
  GlPathItemTitle,
} from "gitlab-ui-react/path";

const stages = [
  { metric: "2d", title: "Plan", value: "plan" },
  { metric: "4d", title: "Develop", value: "develop" },
  { metric: "1d", title: "Review", value: "review" },
  { metric: "3d", title: "Deploy", value: "deploy" },
];

export default function PathExample() {
  return (
    <GlPath defaultValue="develop">
      {stages.map((stage) => (
        <GlPathItem key={stage.value} value={stage.value}>
          <GlPathItemTitle>{stage.title}</GlPathItemTitle>
          <GlPathItemMetric>{stage.metric}</GlPathItemMetric>
        </GlPathItem>
      ))}
    </GlPath>
  );
}
