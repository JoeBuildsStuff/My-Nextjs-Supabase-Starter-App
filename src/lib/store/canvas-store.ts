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
  
  // Actions
  setTransform: (transform: Partial<{ x: number; y: number; zoom: number }>) => void;
  setActiveTool: (tool: ToolType) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  
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
            backgroundColor: 'white',
            borderColor: 'black',
            borderWidth: 2,
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