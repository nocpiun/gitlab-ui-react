import {
  GlBadge,
  GlButton,
  GlTable,
  GlTableBody,
  GlTableCell,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
} from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

const items = [
  { item: "Oak desk lamp", stock: "42", status: "In stock", variant: "success" as const },
  { item: "Canvas organizer", stock: "8", status: "Low stock", variant: "warning" as const },
  { item: "Ceramic pen cup", stock: "0", status: "Reorder", variant: "danger" as const },
  { item: "Wool desk mat", stock: "19", status: "In stock", variant: "success" as const },
];

export function InventoryBlock() {
  return (
    <ShowcaseCard labelledBy="inventory-block-title">
      <BlockHeader
        action={<GlButton icon="export" size="small">Export</GlButton>}
        description="Track availability without losing sight of items that need attention."
        id="inventory-block-title"
        title="Warehouse summary" />

      <GlTable hover outlined stacked="sm">
        <GlTableHeader>
          <GlTableRow>
            <GlTableHead>Product</GlTableHead>
            <GlTableHead>Available</GlTableHead>
            <GlTableHead>Status</GlTableHead>
          </GlTableRow>
        </GlTableHeader>
        <GlTableBody>
          {items.map((item) => (
            <GlTableRow key={item.item}>
              <GlTableHead scope="row" stackedHeading="Product">{item.item}</GlTableHead>
              <GlTableCell stackedHeading="Available">{item.stock}</GlTableCell>
              <GlTableCell stackedHeading="Status">
                <GlBadge variant={item.variant}>{item.status}</GlBadge>
              </GlTableCell>
            </GlTableRow>
          ))}
        </GlTableBody>
      </GlTable>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-subtle">Showing 4 of 128 products</span>
        <GlButton category="tertiary">View inventory</GlButton>
      </div>
    </ShowcaseCard>
  );
}
