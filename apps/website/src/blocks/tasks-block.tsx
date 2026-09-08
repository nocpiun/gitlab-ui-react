import { useState } from "react";
import {
  GlBadge,
  GlButton,
  GlFormCheckbox,
  GlFormInput,
  GlToken,
} from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

const tasks = [
  { label: "Review the campaign outline", value: "outline", done: true },
  { label: "Approve final illustrations", value: "illustrations", done: false },
  { label: "Schedule the launch email", value: "email", done: false },
];

export function TasksBlock() {
  const [query, setQuery] = useState("");
  const visibleTasks = tasks.filter((task) => task.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <ShowcaseCard labelledBy="tasks-block-title">
      <BlockHeader
        action={<GlBadge variant="warning">Due Friday</GlBadge>}
        description="Keep a small creative project moving."
        id="tasks-block-title"
        title="Autumn campaign" />

      <GlFormInput
        onInput={(value) => setQuery(String(value))}
        placeholder="Filter tasks..."
        type="search"
        value={query} />

      <div className="mt-3 flex flex-wrap gap-2">
        <GlToken viewOnly>Marketing</GlToken>
        <GlToken viewOnly>High priority</GlToken>
        <GlToken viewOnly>3 collaborators</GlToken>
      </div>

      <div className="mt-3 grid gap-1 rounded-lg border border-section bg-default p-4">
        {visibleTasks.length > 0 ? visibleTasks.map((task) => (
          <GlFormCheckbox
            checked={task.done ? task.value : null}
            key={task.value}
            value={task.value}>
            {task.label}
          </GlFormCheckbox>
        )) : (
          <p className="m-0 text-subtle">No tasks match this filter.</p>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <GlButton icon="plus" variant="confirm">New task</GlButton>
        <GlButton>View board</GlButton>
      </div>
    </ShowcaseCard>
  );
}
