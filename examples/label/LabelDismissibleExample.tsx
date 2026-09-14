import { useState } from "react";
import { GlLabel } from "gitlab-ui-react/label";

const initialLabels = [
  { backgroundColor: "#CBE2F9", title: "frontend" },
  { backgroundColor: "#D9C2EE", title: "documentation" },
];

export default function LabelDismissibleExample() {
  const [labels, setLabels] = useState(initialLabels);

  return (
    <div className="flex flex-wrap gap-3">
      {labels.map((label) => (
        <GlLabel
          key={label.title}
          backgroundColor={label.backgroundColor}
          onClose={() => setLabels((current) => (
            current.filter((item) => item.title !== label.title)
          ))}
          showCloseButton
          title={label.title} />
      ))}
    </div>
  );
}
