import { useState } from "react";
import { GlPagination } from "gitlab-ui-react/pagination";

export default function PaginationExample() {
  const [page, setPage] = useState(3);

  return (
    <GlPagination
      perPage={10}
      totalItems={200}
      value={page}
      onValueChange={setPage} />
  );
}
