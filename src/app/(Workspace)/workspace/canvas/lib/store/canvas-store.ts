import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Define the types for our canvas state
export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  dimensions?: { width: number; height: number };
  style?: Record<string, unknown>;
  selected?: boolean;
  dragHandle?: string;
  parentId?: string; // For grouping/nesting
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string; // straight, bezier, etc.
  style?: Record<string, unknown>;
  label?: string | React.ReactNode;
  selected?: boolean;
  animated?: boolean;
  points?: Array<{ x: number; y: number }>; // For custom paths
}

export type ToolType = 
  | 'select' 
  | 'hand' 
  | 'rectangle' 
  | 'diamond' 
  | 'circle' 
  | 'arrow' 
  | 'line' 
  | 'pen' 
  | 'text' 
  | 'eraser'
  | 'lock';

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedElements: Array<Node | Edge>;
  transform: { x: number; y: number; zoom: number };
  activeTool: ToolType;
  gridSize: number;
  snapToGrid: boolean;
  strokeColor: string;
  fillColor: string;
  borderRadius: number;
  
  // Actions
  setTransform: (transform: Partial<{ x: number; y: number; zoom: number }>) => void;
  setActiveTool: (tool: ToolType) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setBorderRadius: (radius: number) => void;
  updateSelectedNodeStyles: () => void;
  deselectAllNodes: () => void;
  selectMultipleNodes: (nodeIds: string[]) => void;
  moveSelectedToFront: () => void;
  moveSelectedToBack: () => void;
  moveSelectedForward: () => void;
  moveSelectedBackward: () => void;
  
  // Viewport actions
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  panCanvas: (dx: number, dy: number) => void;
  
  // Node actions
  addNode: (node: Node) => void;
  selectNode: (nodeId: string) => void;
  createShapeAtPosition: (type: string, x: number, y: number) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  updateNodeDimensions: (nodeId: string, width: number, height: number) => void;
}

// Helper function to convert Tailwind color names to CSS color values
const getTailwindColor = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'slate-500': '#64748b',
    'gray-500': '#6b7280',
    'zinc-500': '#71717a',
    'neutral-500': '#737373',
    'stone-500': '#78716c',
    'red-500': '#ef4444',
    'orange-500': '#f97316',
    'amber-500': '#f59e0b',
    'yellow-500': '#eab308',
    'lime-500': '#84cc16',
    'green-500': '#22c55e',
    'emerald-500': '#10b981',
    'teal-500': '#14b8a6',
    'cyan-500': '#06b6d4',
    'sky-500': '#0ea5e9',
    'blue-500': '#3b82f6',
    'indigo-500': '#6366f1',
    'violet-500': '#8b5cf6',
    'purple-500': '#a855f7',
    'fuchsia-500': '#d946ef',
    'pink-500': '#ec4899',
    'rose-500': '#f43f5e',
  };

  return colorMap[colorName] || colorName;
};

// Helper function to convert CSS color values back to Tailwind color names
const getTailwindColorName = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    '#000000': 'black',
    '#FFFFFF': 'white',
    '#64748b': 'slate-500',
    '#6b7280': 'gray-500',
    '#71717a': 'zinc-500',
    '#737373': 'neutral-500',
    '#78716c': 'stone-500',
    '#ef4444': 'red-500',
    '#f97316': 'orange-500',
    '#f59e0b': 'amber-500',
    '#eab308': 'yellow-500',
    '#84cc16': 'lime-500',
    '#22c55e': 'green-500',
    '#10b981': 'emerald-500',
    '#14b8a6': 'teal-500',
    '#06b6d4': 'cyan-500',
    '#0ea5e9': 'sky-500',
    '#3b82f6': 'blue-500',
    '#6366f1': 'indigo-500',
    '#8b5cf6': 'violet-500',
    '#a855f7': 'purple-500',
    '#d946ef': 'fuchsia-500',
    '#ec4899': 'pink-500',
    '#f43f5e': 'rose-500',
  };

  // Convert hex to lowercase for case-insensitive comparison
  const lowerHex = hexColor.toLowerCase();
  
  // Try to find an exact match
  for (const [hex, name] of Object.entries(colorMap)) {
    if (hex.toLowerCase() === lowerHex) {
      return name;
    }
  }
  
  // If no exact match, return the original hex
  return hexColor;
};

// Create the store with immer middleware for immutable updates
export const useCanvasStore = create<CanvasState>()(
  immer((set) => ({
    // Initial state
    nodes: [],
    edges: [],
    selectedElements: [],
    transform: { x: 0, y: 0, zoom: 1 },
    activeTool: 'select',
    gridSize: 20,
    snapToGrid: true,
    strokeColor: 'black',
    fillColor: 'white',
    borderRadius: 0,
    
    // Actions
    setTransform: (newTransform) => 
      set((state) => {
        if (newTransform.x !== undefined) state.transform.x = newTransform.x;
        if (newTransform.y !== undefined) state.transform.y = newTransform.y;
        if (newTransform.zoom !== undefined) state.transform.zoom = newTransform.zoom;
      }),
    
    setActiveTool: (tool) => 
      set((state) => {
        state.activeTool = tool;
      }),
    
    setSnapToGrid: (snap) => 
      set((state) => {
        state.snapToGrid = snap;
      }),
    
    setGridSize: (size) => 
      set((state) => {
        state.gridSize = size;
      }),
    
    setStrokeColor: (color) =>
      set((state) => {
        state.strokeColor = color;
        
        // Directly update selected nodes
        const strokeColorHex = getTailwindColor(color);
        console.log('Setting stroke color to:', strokeColorHex);
        
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            console.log('Updating stroke for node:', node.id);
            if (!node.style) {
              node.style = {};
            }
            node.style.borderColor = strokeColorHex;
            updatedAnyNode = true;
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        }
      }),
      
    setFillColor: (color) =>
      set((state) => {
        state.fillColor = color;
        
        // Directly update selected nodes
        const fillColorHex = getTailwindColor(color);
        console.log('Setting fill color to:', fillColorHex);
        
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            console.log('Updating fill for node:', node.id);
            if (!node.style) {
              node.style = {};
            }
            node.style.backgroundColor = fillColorHex;
            updatedAnyNode = true;
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        }
      }),
      
    setBorderRadius: (radius) =>
      set((state) => {
        state.borderRadius = radius;
        console.log('Setting border radius to:', radius);
        
        // Update selected nodes with new border radius
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            console.log('Updating border radius for node:', node.id);
            if (!node.style) {
              node.style = {};
            }
            node.style.borderRadius = `${radius}px`;
            console.log('Node style after update:', node.style);
            updatedAnyNode = true;
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        } else {
          console.log('No nodes were selected to update border radius');
        }
      }),
      
    updateSelectedNodeStyles: () =>
      set((state) => {
        console.log('Updating styles for selected nodes');
        console.log('Current stroke color:', state.strokeColor);
        console.log('Current fill color:', state.fillColor);
        console.log('Current border radius:', state.borderRadius);
        
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            console.log('Found selected node:', node.id);
            
            if (!node.style) {
              node.style = {};
            }
            
            // Convert colors to hex values
            const strokeColorHex = getTailwindColor(state.strokeColor);
            const fillColorHex = getTailwindColor(state.fillColor);
            
            console.log('Setting stroke color to:', strokeColorHex);
            console.log('Setting fill color to:', fillColorHex);
            console.log('Setting border radius to:', `${state.borderRadius}px`);
            
            // Update the node styles
            node.style.borderColor = strokeColorHex;
            node.style.backgroundColor = fillColorHex;
            node.style.borderRadius = `${state.borderRadius}px`;
            
            updatedAnyNode = true;
          }
        });
        
        console.log('Updated any nodes:', updatedAnyNode);
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        }
      }),
    
    deselectAllNodes: () =>
      set((state) => {
        state.nodes.forEach(node => {
          node.selected = false;
        });
        state.selectedElements = [];
      }),
      
    selectMultipleNodes: (nodeIds) =>
      set((state) => {
        // Deselect all nodes first
        state.nodes.forEach(node => {
          node.selected = nodeIds.includes(node.id);
        });
        
        // Update selectedElements array
        state.selectedElements = state.nodes.filter(node => nodeIds.includes(node.id));
      }),
    
    moveSelectedToFront: () =>
      set((state) => {
        // Get all selected nodes
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length === 0) return;
        
        // Remove selected nodes from the array
        state.nodes = state.nodes.filter(node => !node.selected);
        
        // Add them back at the end (top)
        state.nodes.push(...selectedNodes);
      }),
      
    moveSelectedToBack: () =>
      set((state) => {
        // Get all selected nodes
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length === 0) return;
        
        // Remove selected nodes from the array
        state.nodes = state.nodes.filter(node => !node.selected);
        
        // Add them at the beginning (bottom)
        state.nodes.unshift(...selectedNodes);
      }),
      
    moveSelectedForward: () =>
      set((state) => {
        // Get indices of selected nodes
        const selectedIndices = state.nodes
          .map((node, index) => node.selected ? index : -1)
          .filter(index => index !== -1);
        
        if (selectedIndices.length === 0) return;
        
        // Process from last to first to avoid index shifting problems
        for (let i = selectedIndices.length - 1; i >= 0; i--) {
          const currentIndex = selectedIndices[i];
          if (currentIndex < state.nodes.length - 1) {
            // Swap with the next node
            [state.nodes[currentIndex], state.nodes[currentIndex + 1]] = 
            [state.nodes[currentIndex + 1], state.nodes[currentIndex]];
          }
        }
      }),
      
    moveSelectedBackward: () =>
      set((state) => {
        // Get indices of selected nodes
        const selectedIndices = state.nodes
          .map((node, index) => node.selected ? index : -1)
          .filter(index => index !== -1);
        
        if (selectedIndices.length === 0) return;
        
        // Process from first to last to avoid index shifting problems
        for (let i = 0; i < selectedIndices.length; i++) {
          const currentIndex = selectedIndices[i];
          if (currentIndex > 0) {
            // Swap with the previous node
            [state.nodes[currentIndex], state.nodes[currentIndex - 1]] = 
            [state.nodes[currentIndex - 1], state.nodes[currentIndex]];
          }
        }
      }),
    
    // Viewport actions
    zoomIn: () => 
      set((state) => {
        // Limit zoom to a maximum of 2 (200%)
        state.transform.zoom = Math.min(state.transform.zoom + 0.1, 2);
      }),
    
    zoomOut: () => 
      set((state) => {
        // Limit zoom to a minimum of 0.1 (10%)
        state.transform.zoom = Math.max(state.transform.zoom - 0.1, 0.1);
      }),
    
    resetView: () => 
      set((state) => {
        state.transform = { x: 0, y: 0, zoom: 1 };
      }),
    
    panCanvas: (dx, dy) => 
      set((state) => {
        state.transform.x += dx;
        state.transform.y += dy;
      }),
      
    // Node actions
    addNode: (node) =>
      set((state) => {
        state.nodes.push(node);
      }),
      
    selectNode: (nodeId) =>
      set((state) => {
        // Deselect all nodes first
        state.nodes.forEach(node => {
          node.selected = false;
        });
        
        // Find and select the target node
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          node.selected = true;
          state.selectedElements = [node];
          
          // Update the current stroke and fill colors based on the selected node
          if (node.style) {
            const borderColor = node.style.borderColor as string;
            const backgroundColor = node.style.backgroundColor as string;
            const borderRadius = node.style.borderRadius as string;
            
            if (borderColor) {
              state.strokeColor = getTailwindColorName(borderColor);
            }
            
            if (backgroundColor) {
              state.fillColor = getTailwindColorName(backgroundColor);
            }
            
            if (borderRadius) {
              // Extract the numeric value from the borderRadius string (e.g., "10px" -> 10)
              const radiusValue = parseInt((borderRadius.match(/\d+/) || ['0'])[0], 10);
              state.borderRadius = radiusValue;
              console.log('Updated border radius state to:', radiusValue);
            }
          }
        }
      }),
      
    createShapeAtPosition: (type, x, y) =>
      set((state) => {
        // Generate a unique ID for the new node
        const id = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Default dimensions for different shape types
        let dimensions = { width: 100, height: 100 };
        if (type === 'line' || type === 'arrow') {
          dimensions = { width: 150, height: 2 };
        }
        
        // Create the new node
        const newNode: Node = {
          id,
          type,
          position: { x, y },
          data: {},
          dimensions,
          selected: true,
          style: {
            backgroundColor: getTailwindColor(state.fillColor),
            borderColor: getTailwindColor(state.strokeColor),
            borderWidth: 2,
            borderRadius: `${state.borderRadius}px`,
          }
        };
        
        // Add the node to the canvas
        state.nodes.push(newNode);
        
        // Select the new node
        state.nodes.forEach(node => {
          node.selected = node.id === id;
        });
        
        state.selectedElements = [newNode];
        
        // Switch to select tool after creating a shape
        state.activeTool = 'select';
      }),
      
    updateNodePosition: (nodeId, x, y) =>
      set((state) => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          // Apply grid snapping if enabled
          if (state.snapToGrid) {
            node.position.x = Math.round(x / state.gridSize) * state.gridSize;
            node.position.y = Math.round(y / state.gridSize) * state.gridSize;
          } else {
            node.position.x = x;
            node.position.y = y;
          }
        }
      }),
      
    updateNodeDimensions: (nodeId, width, height) =>
      set((state) => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node && node.dimensions) {
          // Apply grid snapping if enabled
          if (state.snapToGrid) {
            node.dimensions.width = Math.round(width / state.gridSize) * state.gridSize;
            node.dimensions.height = Math.round(height / state.gridSize) * state.gridSize;
          } else {
            node.dimensions.width = width;
            node.dimensions.height = height;
          }
        }
      }),
  }))
); 