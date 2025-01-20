
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default async function Page({
    currentPage, // current page
    totalPages, // total pages
    resultsPerPage, // results per page
    query, // query
    asc, // ascending
    selectedRows, // selected rows
    totalRows, // total rows
}: {
    currentPage: number, // current page
    totalPages: number, // total pages
    resultsPerPage: number, // results per page
    query: string, // query
    asc: boolean, // ascending
    selectedRows: number, // selected rows
    totalRows: number, // total rows
}) {
  
  // Helper function to create URLs with preserved query parameters
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams()
    params.set('page', pageNumber.toString())
    params.set('asc', asc.toString())
    params.set('resultsPerPage', resultsPerPage.toString())
    if (query) params.set('query', query.toString())
    return `?${params.toString()}`
  }

  // Helper function to determine which page numbers to show
  // Show 4 pages then ellipsis --> 1 2 3 4 ... 10
  // FIRST page and LAST page are always shown --> 1 ... 4 5 6 7 8 ... 10
  const getVisiblePages = (currentPage: number, totalPages: number) => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    let l;
    range.push(1);
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }
    range.push(totalPages);
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-between px-2">
      {/* Selected items */}
      <div className="flex-1 text-sm text-muted-foreground">
        {selectedRows} of{" "}
        {totalRows} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">

      {/* Rows per page */}
      <div className="flex items-center space-x-4">
        <p className="text-sm font-medium whitespace-nowrap">
          Rows per page
        </p>
        <Select>
          <SelectTrigger className="w-[4rem]">
            <SelectValue placeholder={resultsPerPage} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        </div>

        {/* Pagination */}
        <Pagination>
          <PaginationContent>
            {/* Previous page */}
            <PaginationItem>
              {currentPage > 1 ? (
                // if this is NOT the first page, ENABLE the previous button  
                <PaginationPrevious href={createPageUrl(currentPage - 1)} className="w-[6.25rem]" />
              ) : (
                // if this is the first page, DISABLE the previous button
                <PaginationPrevious href="#" className="pointer-events-none opacity-50 w-[6.25rem]" />
              )}
            </PaginationItem>
                  
            {/* Pagination links with ellipsis */}
            {getVisiblePages(currentPage, totalPages).map((pageNum, index) => (
              <PaginationItem key={index}>
                {pageNum === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink 
                    href={createPageUrl(pageNum as number)}
                    isActive={pageNum === currentPage}
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            {/* Next page */}
            <PaginationItem>
              {currentPage < totalPages ? (
                // if this is NOT the last page, ENABLE the next button
                <PaginationNext href={createPageUrl(currentPage + 1)} className="w-[6.25rem]"/>
              ) : (
                // if this is the last page, DISABLE the next button
                <PaginationNext href="#" className="pointer-events-none opacity-50 w-[6.25rem]" />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}