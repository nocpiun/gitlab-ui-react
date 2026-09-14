import {
  GlTable,
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
} from "gitlab-ui-react/table";

const rows = [
  { context: "OPanel", name: "Norcleeh", type: "User name" },
  { context: "Profile", name: "@NriotHrreion", type: "User ID" },
  { context: "OPanel", name: "Nocpiun", type: "Organization" },
];

export default function TableExample() {
  return (
    <GlTable>
      <GlTableCaption>Example entities</GlTableCaption>
      <GlTableHeader>
        <GlTableRow>
          <GlTableHead>Name</GlTableHead>
          <GlTableHead>Type</GlTableHead>
          <GlTableHead>Context</GlTableHead>
        </GlTableRow>
      </GlTableHeader>
      <GlTableBody>
        {rows.map((row) => (
          <GlTableRow key={row.name}>
            <GlTableHead scope="row" stackedHeading="Name">{row.name}</GlTableHead>
            <GlTableCell stackedHeading="Type">{row.type}</GlTableCell>
            <GlTableCell stackedHeading="Context">{row.context}</GlTableCell>
          </GlTableRow>
        ))}
      </GlTableBody>
    </GlTable>
  );
}
