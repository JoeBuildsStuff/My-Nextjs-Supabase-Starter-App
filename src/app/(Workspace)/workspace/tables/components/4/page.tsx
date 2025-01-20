//import supabase server
import { createClient } from '@/utils/supabase/server'
import DataTablePagination from './compontents/data-table-pagination'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { currentPage = '1', asc = true, query = '', resultsPerPage = '10' } = await searchParams
 
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
    .range((Number(currentPage) - 1) * Number(resultsPerPage), Number(currentPage) * Number(resultsPerPage) - 1)
    
  if (error) {
    console.error('Error fetching tasks:', error)
    throw new Error('Failed to fetch tasks')
  }

  return (
    < DataTablePagination
      currentPage={Number(currentPage)} // current page
      totalPages={totalPages} // total pages
      resultsPerPage={Number(resultsPerPage)} // results per page
      query={query as string} // query
      asc={asc === 'true'} // ascending
      selectedRows={data.length} // selected rows
      totalRows={totalItems} // total rows
    />
  )
}