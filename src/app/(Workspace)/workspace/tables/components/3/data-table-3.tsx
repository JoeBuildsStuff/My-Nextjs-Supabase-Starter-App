import { Metadata } from "next"
import { createClient } from '@/utils/supabase/server'
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { taskSchema } from "./data/schema"
import { z } from "zod"

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
}

// Fetch tasks from Supabase
async function getTasks() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('my_nextjs_supabase_staarter_app_tasks_example')
    .select('id,title, status, label, priority')

  if (error) {
    console.error('Error fetching tasks:', error)
    throw new Error('Failed to fetch tasks')
  }
  
  // Validate the data with Zod
  return z.array(taskSchema).parse(data)
}

export default async function DataTable3() {
  const tasks = await getTasks()

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <DataTable data={tasks} columns={columns} />
    </div>
  )
}
