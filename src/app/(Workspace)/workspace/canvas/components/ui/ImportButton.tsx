import { Button } from '@/components/ui/button';
import { ArrowBigUpDash, FileUp, AlertTriangle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useRef, ChangeEvent } from 'react';
import { useCanvasStore, Node, Connection } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportData {
  nodes: Node[];
  connections: Connection[];
  version: string;
  exportDate: string;
}

export function ImportButton() {
  const [jsonInput, setJsonInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { deselectAllNodes, pushToHistory } = useCanvasStore();
  
  // Handle JSON input changes
  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setImportError(null);
  };
  
  // Validate the JSON input
  const validateJsonInput = (jsonData: unknown): jsonData is ImportData => {
    if (!jsonData) return false;
    
    // Check for required fields
    if (!jsonData || typeof jsonData !== 'object' || !Array.isArray((jsonData as Record<string, unknown>).nodes)) {
      setImportError("Invalid JSON: 'nodes' field is missing or not an array");
      return false;
    }
    
    // Check if nodes have required properties
    for (const node of (jsonData as ImportData).nodes) {
      if (!node.id || !node.type || !node.position) {
        setImportError("Invalid JSON: Node is missing required properties (id, type, position)");
        return false;
      }
    }
    
    // Validate connections if present
    if ((jsonData as ImportData).connections && !Array.isArray((jsonData as ImportData).connections)) {
      setImportError("Invalid JSON: 'connections' field is not an array");
      return false;
    }
    
    return true;
  };
  
  // Import data into the canvas
  const importData = () => {
    try {
      // Parse the JSON input
      const jsonData = JSON.parse(jsonInput);
      
      // Validate the parsed data
      if (!validateJsonInput(jsonData)) {
        return;
      }
      
      // Get current store state to save to history
      pushToHistory();
      
      // Reset the canvas
      useCanvasStore.setState(state => {
        // Deselect all nodes first
        deselectAllNodes();
        
        // Replace the nodes with imported ones
        state.nodes = jsonData.nodes;
        
        // Replace connections if available
        if (jsonData.connections) {
          state.connections = jsonData.connections;
        }
        
        return state;
      });
      
      // Close the dialog
      setIsOpen(false);
      setJsonInput('');
      
      // Show success toast
      toast({
        title: "Import Successful",
        description: `Imported ${jsonData.nodes.length} nodes to the canvas.`,
      });
    } catch (error) {
      // Handle JSON parsing errors
      setImportError(`Invalid JSON: ${(error as Error).message}`);
      
      toast({
        title: "Import Failed",
        description: "There was an error importing the JSON data.",
        variant: "destructive",
      });
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if the file is JSON
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setImportError("Please select a valid JSON file");
      return;
    }
    
    // Read the file
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const content = event.target.result as string;
        setJsonInput(content);
        setImportError(null);
      }
    };
    
    reader.onerror = () => {
      setImportError("Failed to read the file");
    };
    
    reader.readAsText(file);
  };
  
  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm ml-2">
            <ArrowBigUpDash className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Canvas</DialogTitle>
            <DialogDescription>
              Paste JSON data or upload a file to import a canvas.
            </DialogDescription>
          </DialogHeader>
          
          {importError && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="json-input">JSON Data</Label>
              <Textarea 
                id="json-input"
                placeholder='Paste JSON data here...'
                value={jsonInput}
                onChange={handleJsonInputChange}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button 
                variant="outline" 
                onClick={handleUploadClick}
                type="button"
                className="w-full"
              >
                <FileUp className="mr-2 h-4 w-4" />
                <span>Upload JSON File</span>
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={importData}
              disabled={!jsonInput.trim()}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
}

export default ImportButton;