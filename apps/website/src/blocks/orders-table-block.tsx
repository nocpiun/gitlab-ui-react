import { useState } from "react";
import {
  GlAlert,
  GlAlertDescription,
  GlBadge,
  GlBreadcrumb,
  GlBreadcrumbItem,
  GlFormInput,
  GlPagination,
  GlTab,
  GlTable,
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
  GlTabs,
} from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

type OrderStatus = "Completed" | "Processing";
type OrderFilter = "all" | "completed" | "processing";

type Order = {
  customer: string;
  id: string;
  status: OrderStatus;
  total: string;
};

const orders: Order[] = [
  { customer: "Lena Ortiz", id: "#1048", status: "Completed", total: "$128.00" },
  { customer: "Ethan Reed", id: "#1047", status: "Processing", total: "$86.50" },
  { customer: "Mina Park", id: "#1046", status: "Completed", total: "$214.00" },
  { customer: "Noah Williams", id: "#1045", status: "Processing", total: "$42.90" },
  { customer: "Ava Patel", id: "#1044", status: "Completed", total: "$176.20" },
  { customer: "Leo Martin", id: "#1043", status: "Completed", total: "$64.00" },
  { customer: "Sofia Rossi", id: "#1042", status: "Processing", total: "$319.90" },
  { customer: "Oliver Chen", id: "#1041", status: "Completed", total: "$95.40" },
  { customer: "Amara Okafor", id: "#1040", status: "Processing", total: "$148.00" },
  { customer: "Lucas Silva", id: "#1039", status: "Completed", total: "$72.75" },
  { customer: "Hana Kim", id: "#1038", status: "Processing", total: "$260.00" },
  { customer: "Mateo Garcia", id: "#1037", status: "Completed", total: "$54.30" },
  { customer: "Freya Jensen", id: "#1036", status: "Processing", total: "$190.00" },
  { customer: "Samira Khan", id: "#1035", status: "Completed", total: "$132.80" },
  { customer: "Jack Thompson", id: "#1034", status: "Processing", total: "$410.00" },
  { customer: "Chloe Dubois", id: "#1033", status: "Completed", total: "$88.10" },
];

const tabs: Array<{ filter: OrderFilter; title: string }> = [
  { filter: "processing", title: "Processing" },
  { filter: "completed", title: "Completed" },
];

const itemsPerPage = 5;

export function OrdersTableBlock() {
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  function renderOrders(filter: OrderFilter) {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredOrders = orders.filter((order) => {
      const matchesTab = filter === "all" || order.status.toLowerCase() === filter;
      const matchesQuery = !normalizedQuery
        || order.id.toLowerCase().includes(normalizedQuery)
        || order.customer.toLowerCase().includes(normalizedQuery);

      return matchesTab && matchesQuery;
    });
    const visibleOrders = filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );

    return (
      <div className="grid gap-4 pt-4">
        <GlFormInput
          aria-label="Search orders"
          onInput={(value) => {
            setQuery(String(value));
            setCurrentPage(1);
          }}
          placeholder="Search orders or customers..."
          type="search"
          value={query} />

        <GlTable fixed hover small stacked="sm" striped>
          <GlTableCaption className="sr-only">Customer orders</GlTableCaption>
          <GlTableHeader>
            <GlTableRow>
              <GlTableHead>Order</GlTableHead>
              <GlTableHead>Status</GlTableHead>
              <GlTableHead className="text-right">Total</GlTableHead>
            </GlTableRow>
          </GlTableHeader>
          <GlTableBody>
            {visibleOrders.length > 0 ? visibleOrders.map((order) => (
              <GlTableRow key={order.id}>
                <GlTableHead scope="row" stackedHeading="Order">
                  <span className="block font-semibold">{order.id}</span>
                  <span className="block truncate text-xs font-normal text-subtle">
                    {order.customer}
                  </span>
                </GlTableHead>
                <GlTableCell stackedHeading="Status">
                  <GlBadge variant={order.status === "Completed" ? "success" : "warning"}>
                    {order.status}
                  </GlBadge>
                </GlTableCell>
                <GlTableCell
                  className="text-right font-semibold"
                  stackedHeading="Total">
                  {order.total}
                </GlTableCell>
              </GlTableRow>
            )) : (
              <GlTableRow>
                <GlTableCell className="py-6 text-center text-subtle" colSpan={3}>
                  No orders found
                </GlTableCell>
              </GlTableRow>
            )}
          </GlTableBody>
        </GlTable>

        <GlPagination
          align="center"
          labelNav="Orders pagination"
          limits={{ default: 3, lg: 3, md: 3, sm: 3, xl: 3, xs: 0 }}
          onValueChange={setCurrentPage}
          perPage={itemsPerPage}
          totalItems={filteredOrders.length}
          value={currentPage} />
      </div>
    );
  }

  return (
    <ShowcaseCard>
      <div>
        <GlBreadcrumb autoResize={false} aria-label="Dashboard location">
          <GlBreadcrumbItem href="#statistics">Statistics</GlBreadcrumbItem>
          <GlBreadcrumbItem href="#orders">Orders</GlBreadcrumbItem>
        </GlBreadcrumb>
        <h2 className="mb-4 mt-4 text-[1.25rem] font-semibold text-heading sm:text-[1.5rem]">
          Customer Orders
        </h2>
      </div>

      <GlAlert className="mb-4" dismissible={false} variant="info">
        <GlAlertDescription>
          Recent order updates may take a few minutes to appear.
        </GlAlertDescription>
      </GlAlert>

      <GlTabs
        justified
        lazy
        onValueChange={() => setCurrentPage(1)}>
        {tabs.map((tab) => {
          const count = tab.filter === "all"
            ? orders.length
            : orders.filter((order) => order.status.toLowerCase() === tab.filter).length;

          return (
            <GlTab
              key={tab.filter}
              tabCount={count}
              tabCountSrText={`${count} ${tab.title.toLowerCase()} orders`}
              title={tab.title}>
              {renderOrders(tab.filter)}
            </GlTab>
          );
        })}
      </GlTabs>
    </ShowcaseCard>
  );
}
