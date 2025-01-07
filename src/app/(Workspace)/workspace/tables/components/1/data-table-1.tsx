import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  
  import { createClient } from '@/utils/supabase/server'

  export async function DataTable1() {

    const supabase = await createClient()

    const { data, error, statusText } = await supabase
    .from('my_nextjs_supabase_starter_app_invoices_example')
    .select('id, invoice, payment_status, payment_method, total_amount')

    if (error) {
      console.error('Error fetching invoices:', error)
      console.error('Status text:', statusText)
      return <div>Error fetching invoices</div>
    }
    
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell className="font-medium">{row.invoice}</TableCell>
                <TableCell>{row.payment_status}</TableCell>
                <TableCell>{row.payment_method}</TableCell>
                <TableCell className="text-right">{row.total_amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell className="text-right">${data.reduce((total, row) => total + parseFloat(row.total_amount.replace('$', '')), 0).toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )
  }
  