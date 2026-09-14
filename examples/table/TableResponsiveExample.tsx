import {
  GlTable,
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
} from "gitlab-ui-react/table";

export default function TableResponsiveExample() {
  return (
    <div className="max-w-md">
      <GlTable stacked>
        <GlTableCaption>Project members</GlTableCaption>
        <GlTableHeader>
          <GlTableRow>
            <GlTableHead>Name</GlTableHead>
            <GlTableHead>Role</GlTableHead>
            <GlTableHead>Organization</GlTableHead>
          </GlTableRow>
        </GlTableHeader>
        <GlTableBody>
          <GlTableRow>
            <GlTableHead scope="row" stackedHeading="Name">Norcleeh</GlTableHead>
            <GlTableCell stackedHeading="Role">Maintainer</GlTableCell>
            <GlTableCell stackedHeading="Organization">Nocpiun</GlTableCell>
          </GlTableRow>
          <GlTableRow>
            <GlTableHead scope="row" stackedHeading="Name">NriotHrreion</GlTableHead>
            <GlTableCell stackedHeading="Role">Developer</GlTableCell>
            <GlTableCell stackedHeading="Organization">Nocpiun</GlTableCell>
          </GlTableRow>
        </GlTableBody>
      </GlTable>
    </div>
  );
}
