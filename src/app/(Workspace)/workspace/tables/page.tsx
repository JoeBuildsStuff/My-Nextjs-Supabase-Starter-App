import { Card, CardTitle, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { DataTable1 } from "./components/1/data-table-1";
import { DataTable2 } from "./components/2/data-table-2";
import DataTable3 from "./components/3/data-table-3";

export default function TablesPage() {
  return (
    <div className="container mx-auto py-10 space-y-12">
      {/* Basic Table */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Table</CardTitle>
          <CardDescription><div className="prose dark:prose-invert max-w-none">
          <p>
            A simple table with basic features like headers, footers, and captions. Perfect for displaying static data.
          </p>
          <ul>
            <li>Basic row and column layout</li>
            <li>Header and footer support</li>
            <li>Table captions</li>
          </ul>
        </div></CardDescription>
        </CardHeader>
        <CardContent>
          
        <DataTable1 />
        </CardContent>
      </Card>

      {/* Advanced Table */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Data Table</CardTitle>
          <CardDescription>
            <div className="prose dark:prose-invert max-w-none">

          <p>
            Table with essential data management capabilities.
          </p>
          <ul>
            <li>Column sorting and filtering</li>
            <li>Pagination controls</li>
            <li>Row selection</li>
            <li>Column visibility toggle</li>
            <li>Basic row actions</li>
          </ul>
          </div>
        </CardDescription>
        </CardHeader>
        <CardContent>
        <DataTable2 />
        </CardContent>
      </Card>

      {/* Complex Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complex Table</CardTitle>
          <CardDescription><div className="prose dark:prose-invert max-w-none">
          <p>
            Table implementation with advanced features for complex data management.
          </p>
          <ul>
            <li>Advanced filtering (multi-select, date range, status)</li>
            <li>Advanced pagination</li>
          </ul>
        </div>
        </CardDescription>
        </CardHeader>
        <CardContent>
        <DataTable3 />
        </CardContent>
      </Card>
    </div>
  );
}
