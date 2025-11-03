import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

interface PagePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  basePath?: string;
  additionalQuery?: Record<string, string | undefined>;
}

export function PagePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  basePath = "/dashboard",
  additionalQuery,
}: PagePaginationProps) {
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
    });

    if (additionalQuery) {
      for (const [key, value] of Object.entries(additionalQuery)) {
        if (value) {
          params.set(key, value);
        }
      }
    }

    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between my-4">
      <div className="text-sm text-gray-600">
        {totalItems === 0 ? (
          <>Showing 0 of 0 results</>
        ) : (
          <>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
            results
          </>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* First Page */}
        <Link
          href={buildUrl(1)}
          className={!hasPreviousPage ? "pointer-events-none opacity-50" : ""}
        >
          <Button variant="outline" size="sm" disabled={!hasPreviousPage}>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>

        {/* Previous Page */}
        <Link
          href={buildUrl(currentPage - 1)}
          className={!hasPreviousPage ? "pointer-events-none opacity-50" : ""}
        >
          <Button variant="outline" size="sm" disabled={!hasPreviousPage}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        </Link>

        {/* Page Info */}
        {totalPages > 0 && (
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
        )}

        {/* Next Page */}
        <Link
          href={buildUrl(currentPage + 1)}
          className={hasNextPage ? "" : "pointer-events-none opacity-50"}
        >
          <Button variant="outline" size="sm" disabled={!hasNextPage}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </Link>

        {/* Last Page */}
        <Link
          href={buildUrl(totalPages)}
          className={hasNextPage ? "" : "pointer-events-none opacity-50"}
        >
          <Button variant="outline" size="sm" disabled={!hasNextPage}>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
