# Canvas Module: Technical Implementation

This document provides deeper technical details about the Canvas module implementation for developers who need to modify or extend the codebase.

## Core Architecture

The Canvas module follows a component-based architecture with state management centralized through Zustand. The primary technical components are:

1. **Canvas State Store**: Central state management using Zustand with Immer
2. **Component Tree**: React component hierarchy for rendering
3. **Event System**: Mouse/keyboard handling for interactive elements 
4. **Connection Logic**: Smart connection system with auto-routing
5. **Render Pipeline**: Efficient rendering of shapes, lines, and text

## State Management with Zustand

### Store Structure

The canvas-store.ts file defines the entire application state with a focused structure:

```typescript
interface CanvasState {
  // Core data
  nodes: Node[];                        // All shapes, lines, text elements
  edges: Edge[];                        // Legacy connections (primarily used for compatibility)
  connections: Connection[];            // Shape-to-line connections
  
  // View state
  transform: { x: number; y: number; zoom: number };
  
  // Tool state
  activeTool: ToolType;                 // Current active tool
  
  // Style settings
  strokeColor: string;
  fillColor: string;
  defaultShade: string;
  borderRadius: number;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  lineType: 'straight' | 'elbow';
  
  // Selection state  
  selectedElements: Array<Node | Edge>;
  
  // Line drawing state
  lineInProgress: Node | null;
  selectedPointIndices: number[] | null;
  
  // History tracking
  history: Array<{ nodes: Node[]; edges: Edge[]; connections: Connection[] }>;
  historyIndex: number;
  
  // Various action functions...
}
```

### Immutable Updates with Immer

The store uses Immer to handle immutable updates with a mutable API:

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useCanvasStore = create(
  immer<CanvasState>((set, get) => ({
    // Initial state...
    
    // Example of an action with immer:
    updateNodePosition: (nodeId, x, y) => {
      set(state => {
        // Find the node
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          // Update position with a "mutable" API
          node.position.x = x;
          node.position.y = y;
          
          // Update any connected lines
          updateAllLineConnections(state.nodes, state.connections);
        }
      });
    },
    
    // Other actions...
  }))
);
```

This approach allows for complex state updates while maintaining immutability behind the scenes.

## Component Hierarchy

### Main Canvas Component

The `Canvas.tsx` component serves as the primary container and handles most user interactions:

```typescript
const Canvas: React.FC<CanvasProps> = ({ width, height, className = '' }) => {
  // Reference to the canvas DOM element
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Get state and actions from the store
  const { 
    transform, 
    activeTool, 
    // ... other state
  } = useCanvasStore();
  
  // Local component state for interaction tracking
  const [isDragging, setIsDragging] = useState(false);
  // ... other local state
  
  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Mouse down logic
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // Mouse move logic
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    // Mouse up logic
  };
  
  // Render the canvas
  return (
    <div 
      ref={canvasRef}
      className={`canvas ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      // ... other event handlers
    >
      {/* Grid */}
      <CanvasGrid />
      
      {/* Render all nodes */}
      {displayNodes.map(node => (
        <Node 
          key={node.id}
          node={node} 
          // ... props
        />
      ))}
      
      {/* Active line being drawn */}
      {lineInProgress && <LineInProgress />}
      
      {/* Selection box for multi-select */}
      {isSelecting && selectionBox && <SelectionBox box={selectionBox} />}
      
      {/* Alignment guides */}
      {alignmentGuides.horizontal.map(/* ... */)}
      {alignmentGuides.vertical.map(/* ... */)}
    </div>
  );
};
```

### Node Component System

The `Node.tsx` component acts as a dispatcher for different node types:

```typescript
const Node: React.FC<NodeProps> = ({ node, onResizeStart, onResizeMove, onResizeEnd }) => {
  // Determine which renderer to use based on node type
  const renderNode = () => {
    switch (node.type) {
      case 'rectangle':
      case 'diamond':
      case 'circle':
      case 'cylinder':
      case 'triangle':
        return <ShapeRenderer node={node} />;
        
      case 'line':
      case 'arrow':
        return <LineRenderer node={node} />;
        
      case 'text':
        return <TextRenderer node={node} />;
        
      // ... other node types
        
      default:
        return <div>Unknown node type: {node.type}</div>;
    }
  };
  
  // Node position styles with transform
  const style = {
    transform: `translate(${node.position.x}px, ${node.position.y}px)`,
    // ... other styles
  };
  
  return (
    <div 
      className={`node ${node.selected ? 'selected' : ''}`}
      style={style}
      data-node-id={node.id}
      data-node-type={node.type}
    >
      {renderNode()}
      
      {/* Show resize handles if selected */}
      {node.selected && <ResizeHandles onResizeStart={onResizeStart} /* ... */ />}
      
      {/* Show connection points under certain conditions */}
      {showConnectionPoints && <ConnectionPoints node={node} />}
    </div>
  );
};
```

## Connection System Implementation

### Connection Model

Connections are stored in the main state:

```typescript
interface Connection {
  lineId: string;       // ID of the line
  pointIndex: number;   // Index of the point on the line (0 for start, 1+ for end)
  shapeId: string;      // ID of the shape this is connected to
  position: ConnectionPointPosition; // Position on the shape (n, s, e, w, etc.)
  dynamic?: boolean;    // Whether to recalculate optimal connection point
}
```

### Connection Point Calculation

Connection points are calculated based on shape geometry:

```typescript
// Example for calculating a connection point on a rectangle
const calculateRectangleConnectionPoint = (
  node: Node, 
  position: ConnectionPointPosition
): { x: number; y: number } => {
  const { width, height } = node.dimensions || { width: 100, height: 60 };
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  switch (position) {
    case 'n': return { x: halfWidth, y: 0 };
    case 's': return { x: halfWidth, y: height };
    case 'e': return { x: width, y: halfHeight };
    case 'w': return { x: 0, y: halfHeight };
    case 'nw': return { x: 0, y: 0 };
    case 'ne': return { x: width, y: 0 };
    case 'sw': return { x: 0, y: height };
    case 'se': return { x: width, y: height };
    default: return { x: halfWidth, y: halfHeight };
  }
};
```

### Line Routing

The system implements two primary line routing methods:

1. **Straight Lines**: Direct connections from point to point

2. **Elbow Lines**: Orthogonal lines with automatic corner calculation

```typescript
// Example of elbow line point generation
const generateElbowPoints = (
  start: { x: number; y: number },
  end: { x: number; y: number }
): Array<{ x: number; y: number }> => {
  // Calculate midpoint for the elbow
  const midX = (start.x + end.x) / 2;
  
  // Create points for the route: start -> mid horizontal -> mid vertical -> end
  return [
    { x: start.x, y: start.y },
    { x: midX, y: start.y },
    { x: midX, y: end.y },
    { x: end.x, y: end.y }
  ];
};
```

## Event Handling Pipeline

The Canvas component implements a sophisticated event handling system to manage different interactions:

### Event Flow

1. **Mouse Down**:
   - Check for active tool
   - Check if clicking on a node
   - Handle line drawing start
   - Start selection box
   - Begin pan operation

2. **Mouse Move**:
   - Update line drawing
   - Update selection box
   - Pan the canvas
   - Move selected nodes
   - Calculate alignment guides

3. **Mouse Up**:
   - Complete line drawing
   - Finalize node selection
   - End canvas panning
   - Complete node movement
   - Push state to history

### Example: Line Drawing Implementation

```typescript
// Starting a line
const startLineDraw = (x: number, y: number, type: 'line' | 'arrow') => {
  const newLine: Node = {
    id: generateId(),
    type,
    position: { x: 0, y: 0 }, // Lines use absolute coordinates in points
    data: {},
    points: [{ x, y }], // Starting point
    style: {
      strokeColor,
      strokeWidth,
      strokeStyle
    }
  };
  
  set(state => {
    state.lineInProgress = newLine;
  });
};

// Updating the line during drawing
const updateLineDraw = (x: number, y: number, isShiftPressed = false) => {
  set(state => {
    if (state.lineInProgress) {
      const points = state.lineInProgress.points || [];
      
      if (isShiftPressed && points.length > 0) {
        // Constrain to 45-degree angles if shift is pressed
        const lastPoint = points[points.length - 1];
        const dx = Math.abs(x - lastPoint.x);
        const dy = Math.abs(y - lastPoint.y);
        
        if (dx > dy) {
          // Horizontal constraint
          y = lastPoint.y;
        } else {
          // Vertical constraint
          x = lastPoint.x;
        }
      }
      
      // Update the last point if we're dragging
      if (points.length > 1) {
        points[points.length - 1] = { x, y };
      } else {
        // Add a new point for the current mouse position
        points.push({ x, y });
      }
    }
  });
};
```

## Performance Optimizations

The Canvas implements several performance optimizations:

1. **Selective Rendering**: Only re-render affected components when state changes

2. **Virtualization**: Only render nodes that are within or near the viewport

3. **Debounced Updates**: Throttle frequent operations like mouse movement

4. **Memoization**: Cache expensive calculations using React.memo and useMemo

5. **Batched State Updates**: Group state changes to minimize renders

## Extension Points

The system is designed to be extended in several ways:

1. **New Node Types**: Add new shape types to NodeRegistry.tsx

2. **Custom Renderers**: Create specialized renderers for different node types

3. **New Tools**: Extend the toolbar with additional tools

4. **Style Presets**: Add new styling presets and themes

5. **Export/Import Formats**: Add support for different file formats 