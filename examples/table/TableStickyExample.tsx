import {
  GlTable,
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
} from "gitlab-ui-react/table";

const pipelines = Array.from({ length: 10 }, (_, index) => ({
  name: `Pipeline ${index + 1}`,
  status: index % 2 === 0 ? "Passed" : "Running",
}));

export default function TableStickyExample() {
  return (
    <div className="max-w-md">
      <GlTable stickyHeader="14rem">
        <GlTableCaption>Pipeline history</GlTableCaption>
        <GlTableHeader>
          <GlTableRow>
            <GlTableHead>Pipeline</GlTableHead>
            <GlTableHead>Status</GlTableHead>
          </GlTableRow>
        </GlTableHeader>
        <GlTableBody>
          {pipelines.map((pipeline) => (
            <GlTableRow key={pipeline.name}>
              <GlTableHead scope="row">{pipeline.name}</GlTableHead>
              <GlTableCell>{pipeline.status}</GlTableCell>
            </GlTableRow>
          ))}
        </GlTableBody>
      </GlTable>
    </div>
  );
}
