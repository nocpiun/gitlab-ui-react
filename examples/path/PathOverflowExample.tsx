import {
  GlPath,
  GlPathItem,
  GlPathItemMetric,
  GlPathItemTitle,
} from "gitlab-ui-react/path";

const stages = [
  { metric: "1d", title: "Plan", value: "plan" },
  { metric: "2d", title: "Design", value: "design" },
  { metric: "4d", title: "Develop", value: "develop" },
  { metric: "1d", title: "Review", value: "review" },
  { metric: "2d", title: "Test", value: "test" },
  { metric: "3d", title: "Deploy", value: "deploy" },
];

export default function PathOverflowExample() {
  return (
    <div className="w-[18rem] max-w-full">
      <GlPath defaultValue="develop">
        {stages.map((stage) => (
          <GlPathItem key={stage.value} value={stage.value}>
            <GlPathItemTitle>{stage.title}</GlPathItemTitle>
            <GlPathItemMetric>{stage.metric}</GlPathItemMetric>
          </GlPathItem>
        ))}
      </GlPath>
    </div>
  );
}
