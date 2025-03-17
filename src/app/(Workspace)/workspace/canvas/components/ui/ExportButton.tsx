import { Button } from '@/components/ui/button';
import { Download, FileJson, Clipboard, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { useCanvasStore, Node, Connection } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface ExportData {
  nodes: Node[];
  connections: Connection[];
  version: string;
  exportDate: string;
}

export function ExportButton() {
  const [copied, setCopied] = useState(false);
  const [jsonVisible, setJsonVisible] = useState(false);
  const { nodes, connections } = useCanvasStore();

  // Prepare the export data
  const prepareExportData = (): ExportData => {
    return {
      nodes,
      connections,
      version: "1.0",
      exportDate: new Date().toISOString()
    };
  };

  // Export the diagram as a JSON file
  const exportAsJson = () => {
    const exportData = prepareExportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `canvas-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Your canvas has been exported as a JSON file."
    });
  };

  // Copy the JSON data to clipboard
  const copyToClipboard = () => {
    const exportData = prepareExportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "The JSON data has been copied to your clipboard."
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive"
      });
    });
  };

  // View the JSON data
  const viewJson = () => {
    setJsonVisible(!jsonVisible);
  };

  // Format node count for display
  const getNodeCountText = () => {
    const count = nodes.length;
    return `${count} ${count === 1 ? 'node' : 'nodes'}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
          <Download className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        <div className="p-2">
          <p className="text-sm font-medium">Export Canvas</p>
          <p className="text-xs text-muted-foreground mt-1">{getNodeCountText()}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsJson}>
          <Download className="mr-2 h-4 w-4" />
          <span>Save as JSON</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Clipboard className="mr-2 h-4 w-4" />
          )}
          <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={viewJson}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>View JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DetailedExportButton() {
  const [copied, setCopied] = useState(false);
  const [jsonVisible, setJsonVisible] = useState(false);
  const { nodes, connections } = useCanvasStore();

  // Prepare the export data
  const prepareExportData = (): ExportData => {
    return {
      nodes,
      connections,
      version: "1.0",
      exportDate: new Date().toISOString()
    };
  };

  // Export the diagram as a JSON file
  const exportAsJson = () => {
    const exportData = prepareExportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `canvas-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Your canvas has been exported as a JSON file."
    });
  };

  // Copy the JSON data to clipboard
  const copyToClipboard = () => {
    const exportData = prepareExportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "The JSON data has been copied to your clipboard."
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive"
      });
    });
  };

  // Get a preview of the JSON data
  const getJsonPreview = () => {
    const exportData = prepareExportData();
    return JSON.stringify(exportData, null, 2);
  };

  return (
    <Popover open={jsonVisible} onOpenChange={setJsonVisible}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
          <Download className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80 md:w-96">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Export Canvas</h4>
            <p className="text-xs text-muted-foreground">{nodes.length} nodes</p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={exportAsJson}
            >
              <Download className="mr-2 h-4 w-4" />
              Save as JSON
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Clipboard className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy JSON"}
            </Button>
          </div>
          
          {jsonVisible && (
            <div className="border rounded-md mt-2">
              <div className="max-h-60 overflow-auto p-2">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {getJsonPreview()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Use ExportButton for dropdown or DetailedExportButton for popover with preview
export default ExportButton;