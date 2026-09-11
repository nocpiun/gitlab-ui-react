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
import { formatTemplate, languageTags, type Locale } from "../i18n/config";
import {
  formatCurrency,
  matchesOrderFilter,
  type OrderFilter,
  type OrderStatus,
  showcaseContent,
} from "../i18n/showcase-content";

type OrderFixture = {
  id: string;
  status: OrderStatus;
  total: number;
};

const orderFixtures: OrderFixture[] = [
  { id: "#1048", status: "completed", total: 128 },
  { id: "#1047", status: "processing", total: 86.5 },
  { id: "#1046", status: "completed", total: 214 },
  { id: "#1045", status: "processing", total: 42.9 },
  { id: "#1044", status: "completed", total: 176.2 },
  { id: "#1043", status: "completed", total: 64 },
  { id: "#1042", status: "processing", total: 319.9 },
  { id: "#1041", status: "completed", total: 95.4 },
  { id: "#1040", status: "processing", total: 148 },
  { id: "#1039", status: "completed", total: 72.75 },
  { id: "#1038", status: "processing", total: 260 },
  { id: "#1037", status: "completed", total: 54.3 },
  { id: "#1036", status: "processing", total: 190 },
  { id: "#1035", status: "completed", total: 132.8 },
  { id: "#1034", status: "processing", total: 410 },
  { id: "#1033", status: "completed", total: 88.1 },
];

const itemsPerPage = 5;

type OrdersTableBlockProps = {
  locale: Locale;
};

export function OrdersTableBlock({ locale }: OrdersTableBlockProps) {
  const content = showcaseContent[locale].orders;
  const orders = orderFixtures.map((order, index) => ({
    ...order,
    customer: content.customers[index],
  }));
  const tabs: Array<{ filter: OrderFilter; title: string }> = [
    { filter: "processing", title: content.processing },
    { filter: "completed", title: content.completed },
  ];
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  function renderOrders(filter: OrderFilter) {
    const normalizedQuery = query.trim().toLocaleLowerCase(languageTags[locale]);
    const filteredOrders = orders.filter((order) => {
      const matchesTab = matchesOrderFilter(order.status, filter);
      const matchesQuery = !normalizedQuery
        || order.id.toLocaleLowerCase(languageTags[locale]).includes(normalizedQuery)
        || order.customer.toLocaleLowerCase(languageTags[locale]).includes(normalizedQuery);

      return matchesTab && matchesQuery;
    });
    const visibleOrders = filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );

    return (
      <div className="grid gap-4 pt-4">
        <GlFormInput
          aria-label={content.searchLabel}
          onValueChange={(value) => {
            setQuery(String(value));
            setCurrentPage(1);
          }}
          placeholder={content.searchPlaceholder}
          type="search"
          value={query} />

        <GlTable fixed hover small stacked="sm" striped>
          <GlTableCaption className="sr-only">{content.caption}</GlTableCaption>
          <GlTableHeader>
            <GlTableRow>
              <GlTableHead>{content.order}</GlTableHead>
              <GlTableHead>{content.status}</GlTableHead>
              <GlTableHead className="text-right">{content.total}</GlTableHead>
            </GlTableRow>
          </GlTableHeader>
          <GlTableBody>
            {visibleOrders.length > 0 ? visibleOrders.map((order) => (
              <GlTableRow key={order.id}>
                <GlTableHead scope="row" stackedHeading={content.order}>
                  <span className="block font-semibold">{order.id}</span>
                  <span className="block truncate text-xs font-normal text-subtle">
                    {order.customer}
                  </span>
                </GlTableHead>
                <GlTableCell stackedHeading={content.status}>
                  <GlBadge variant={order.status === "completed" ? "success" : "warning"}>
                    {content[order.status]}
                  </GlBadge>
                </GlTableCell>
                <GlTableCell
                  className="text-right font-semibold"
                  stackedHeading={content.total}>
                  {formatCurrency(locale, order.total, content.currency)}
                </GlTableCell>
              </GlTableRow>
            )) : (
              <GlTableRow>
                <GlTableCell className="py-6 text-center text-subtle" colSpan={3}>
                  {content.empty}
                </GlTableCell>
              </GlTableRow>
            )}
          </GlTableBody>
        </GlTable>

        <GlPagination
          align="center"
          labelFirstPage={content.firstPageLabel}
          labelLastPage={content.lastPageLabel}
          labelNav={content.paginationLabel}
          labelNextPage={content.nextPageLabel}
          labelPage={(page) => formatTemplate(content.pageLabel, { page })}
          labelPrevPage={content.previousPageLabel}
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
        <GlBreadcrumb autoResize={false} aria-label={content.breadcrumbLabel}>
          <GlBreadcrumbItem href="#statistics">{content.statistics}</GlBreadcrumbItem>
          <GlBreadcrumbItem href="#orders">{content.orders}</GlBreadcrumbItem>
        </GlBreadcrumb>
        <h2 className="mb-4 mt-4 text-[1.25rem] font-semibold text-heading sm:text-[1.5rem]">
          {content.title}
        </h2>
      </div>

      <GlAlert className="mb-4" dismissible={false} variant="info">
        <GlAlertDescription>
          {content.alert}
        </GlAlertDescription>
      </GlAlert>

      <GlTabs
        justified
        lazy
        onValueChange={() => setCurrentPage(1)}>
        {tabs.map((tab) => {
          const count = tab.filter === "all"
            ? orders.length
            : orders.filter((order) => order.status === tab.filter).length;

          return (
            <GlTab
              key={tab.filter}
              tabCount={count}
              tabCountSrText={formatTemplate(content.tabCountLabel, {
                count,
                status: tab.title.toLocaleLowerCase(languageTags[locale]),
              })}
              title={tab.title}>
              {renderOrders(tab.filter)}
            </GlTab>
          );
        })}
      </GlTabs>
    </ShowcaseCard>
  );
}
