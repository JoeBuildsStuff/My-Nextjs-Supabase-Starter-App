//import supabase server
import { createClient } from '@/utils/supabase/server'
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { page = '1', asc = true, query = '', resultsPerPage = '10' } = await searchParams
 
  const supabase = await createClient()

  // First, get the total count of items
  const { count } = await supabase
    .from('my_nextjs_supabase_starter_app_tasks_example')
    .select('*', { count: 'exact', head: true })

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / Number(resultsPerPage))

  const { data, error } = await supabase
    .from('my_nextjs_supabase_starter_app_tasks_example')
    .select('*')
    .order('id', { ascending: asc === 'true' })
    .range((Number(page) - 1) * Number(resultsPerPage), Number(page) * Number(resultsPerPage) - 1)
    
  if (error) {
    console.error('Error fetching tasks:', error)
    throw new Error('Failed to fetch tasks')
  }

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
  
      for (let i of range) {
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
        {data.length} of{" "}
        {totalItems} row(s) selected.
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
              {Number(page) > 1 ? (
                // if this is NOT the first page, ENABLE the previous button  
                <PaginationPrevious href={createPageUrl(Number(page) - 1)} className="w-[6.25rem]" />
              ) : (
                // if this is the first page, DISABLE the previous button
                <PaginationPrevious href="#" className="pointer-events-none opacity-50 w-[6.25rem]" />
              )}
            </PaginationItem>
                  
            {/* Pagination links with ellipsis */}
            {getVisiblePages(Number(page), totalPages).map((pageNum, index) => (
              <PaginationItem key={index}>
                {pageNum === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink 
                    href={createPageUrl(pageNum as number)}
                    isActive={pageNum === Number(page)}
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            {/* Next page */}
            <PaginationItem>
              {Number(page) < totalPages ? (
                // if this is NOT the last page, ENABLE the next button
                <PaginationNext href={createPageUrl(Number(page) + 1)} className="w-[6.25rem]"/>
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