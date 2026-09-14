import {
  GlTable,
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
} from "gitlab-ui-react/table";

export default function TableCompactExample() {
  return (
    <GlTable small>
      <GlTableCaption>Project members</GlTableCaption>
      <GlTableHeader>
        <GlTableRow>
          <GlTableHead>Name</GlTableHead>
          <GlTableHead>Role</GlTableHead>
        </GlTableRow>
      </GlTableHeader>
      <GlTableBody>
        <GlTableRow>
          <GlTableHead scope="row">Norcleeh</GlTableHead>
          <GlTableCell>Maintainer</GlTableCell>
        </GlTableRow>
        <GlTableRow>
          <GlTableHead scope="row">@NriotHrreion</GlTableHead>
          <GlTableCell>Developer</GlTableCell>
        </GlTableRow>
      </GlTableBody>
    </GlTable>
  );
}
