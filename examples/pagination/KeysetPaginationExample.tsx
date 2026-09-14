import { useState } from "react";
import { GlKeysetPagination } from "gitlab-ui-react/keyset-pagination";

export default function KeysetPaginationExample() {
  const [page, setPage] = useState(1);

  return (
    <GlKeysetPagination
      endCursor={`page-${page}`}
      hasNextPage={page < 4}
      hasPreviousPage={page > 1}
      startCursor={`page-${page}`}
      onNext={() => setPage((current) => current + 1)}
      onPrevious={() => setPage((current) => current - 1)} />
  );
}
