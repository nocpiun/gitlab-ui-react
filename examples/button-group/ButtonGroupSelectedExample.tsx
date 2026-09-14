import { useState } from "react";
import { GlButton } from "gitlab-ui-react/button";
import { GlButtonGroup } from "gitlab-ui-react/button-group";

export default function ButtonGroupSelectedExample() {
  const [selectedView, setSelectedView] = useState<"list" | "board">("list");

  return (
    <GlButtonGroup>
      <GlButton
        aria-pressed={selectedView === "list"}
        onClick={() => setSelectedView("list")}
        selected={selectedView === "list"}>
        List
      </GlButton>
      <GlButton
        aria-pressed={selectedView === "board"}
        onClick={() => setSelectedView("board")}
        selected={selectedView === "board"}>
        Board
      </GlButton>
    </GlButtonGroup>
  );
}
