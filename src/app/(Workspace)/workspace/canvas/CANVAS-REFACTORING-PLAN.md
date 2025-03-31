# Detailed Canvas.tsx Refactoring Plan

## Overview

Canvas.tsx has grown significantly and now handles multiple concerns including state management, event handling, rendering, and utility calculations. This refactoring plan outlines how to break down this monolithic component into smaller, more maintainable modules without breaking functionality.

## Step 1: Create Utility Functions Module

THIS IS DONE!
### 1.1 Create Node Utility Functions

**File:** `src/app/(Workspace)/workspace/canvas/lib/utils/node-utils.ts`

```typescript
import { Node, Connection } from '../store/canvas-store';

// Find a node at a specific position
export function findNodeAtPosition(
  x: number, 
  y: number, 
  nodes: Node[]
): Node | undefined {
  // Extract the node finding logic from Canvas.tsx
  // First check groups, then line segments, then regular nodes
  // ...existing implementation...
}

// Check if a node is within a selection box
export function isNodeInSelectionBox(
  node: Node, 
  selectionBox: { start: { x: number, y: number }, end: { x: number, y: number } }
): boolean {
  // Extract the selection box check logic
  // ...existing implementation...
}

// Check if two line segments intersect
export function lineSegmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  // Extract line intersection check logic
  // ...existing implementation...
}

// Find the closest line segment to a given point
export function findClosestLineSegment(
  x: number, 
  y: number,
  nodes: Node[]
): { nodeId: string; segmentIndex: number; distance: number } | null {
  // Extract closest line segment logic
  // ...existing implementation...
}

// Calculate distance from a point to a line segment
export function distanceToLineSegment(
  x: number, y: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  // Extract distance calculation logic
  // ...existing implementation...
}
```
1.1 is done!


### 1.2 Create Alignment Utility Functions

**File:** `src/app/(Workspace)/workspace/canvas/lib/utils/alignment-utils.ts`

```typescript
import { Node } from '../store/canvas-store';

export interface AlignmentGuides {
  horizontal: { y: number, start: number, end: number, type?: 'top' | 'bottom' | 'center' }[];
  vertical: { x: number, start: number, end: number, type?: 'left' | 'right' | 'center' }[];
}

// Find alignment guides for moving nodes
export function findAlignmentGuides(
  movingNodes: Node[],
  allNodes: Node[],
  dx: number,
  dy: number,
  nodeStartPos: Record<string, { x: number, y: number }>,
  threshold: number = 5,
  extensionAmount: number = 50
): AlignmentGuides {
  // Extract alignment guide finding logic
  // ...existing implementation...
}

// Get position adjustments based on alignment guides
export function getSnappedPosition(
  node: Node,
  dx: number,
  dy: number,
  guides: AlignmentGuides,
  nodeStartPos: Record<string, { x: number, y: number }>,
  threshold: number = 5
): { x: number, y: number } {
  // Extract position snapping logic
  // ...existing implementation...
}
```

## Step 2: Create Custom Hooks

### 2.1 Create Canvas Mouse Hook

**File:** `src/app/(Workspace)/workspace/canvas/hooks/useCanvasMouse.ts`

```typescript
import { useState, useRef, RefObject } from 'react';
import { useCanvasStore, Node } from '../lib/store/canvas-store';
import { findNodeAtPosition, isNodeInSelectionBox } from '../lib/utils/node-utils';
import { findAlignmentGuides, getSnappedPosition } from '../lib/utils/alignment-utils';

export function useCanvasMouse(canvasRef: RefObject<HTMLDivElement>) {
  // Extract relevant state from Canvas.tsx
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingNode, setIsMovingNode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState<Record<string, { x: number, y: number }>>({});
  const [alignmentGuides, setAlignmentGuides] = useState({
    horizontal: [],
    vertical: []
  });

  // Get store functions
  const { 
    transform, 
    activeTool, 
    gridSize, 
    snapToGrid,
    panCanvas,
    createShapeAtPosition,
    selectNode,
    updateNodePosition,
    deselectAllNodes,
    selectMultipleNodes,
    presentationMode,
    nodes
  } = useCanvasStore();

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Extract mouse down logic
    // ...existing implementation...
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    // Extract mouse move logic
    // ...existing implementation...
  };

  // Handle mouse up
  const handleMouseUp = (e: React.MouseEvent) => {
    // Extract mouse up logic
    // ...existing implementation...
  };

  return {
    isDragging,
    isMovingNode,
    isSelecting,
    selectionBox,
    activeNodeId,
    lastMousePos,
    nodeStartPos,
    alignmentGuides,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}
```

### 2.2 Create Line Drawing Hook

**File:** `src/app/(Workspace)/workspace/canvas/hooks/useLineDrawing.ts`

```typescript
import { useState, RefObject } from 'react';
import { useCanvasStore, ConnectionPointPosition } from '../lib/store/canvas-store';
import { findNearbyConnectionPoint } from '../lib/utils/connection-utils';

export function useLineDrawing(canvasRef: RefObject<HTMLDivElement>) {
  // Extract relevant state
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{ nodeId: string; position: ConnectionPointPosition } | null>(null);
  const [selectedLineEndpoint, setSelectedLineEndpoint] = useState<{ nodeId: string; pointIndex: number } | null>(null);
  const [activePointData, setActivePointData] = useState<{
    nodeId: string;
    pointIndex: number;
    startX: number;
    startY: number;
  } | null>(null);

  const { 
    lineInProgress, 
    startLineDraw,
    updateLineDraw,
    finishLineDraw,
    cancelLineDraw,
    addPointToLine,
    selectLinePoint,
    moveLinePoint,
    createConnection,
    transform,
    activeTool,
    isShiftPressed
  } = useCanvasStore();

  // Handle double click (for finishing lines)
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Extract double click logic for line drawing
    // ...existing implementation...
  };

  // Connect a line endpoint to a connection point
  const connectLineToPoint = (
    lineId: string,
    pointIndex: number,
    connectionPointData: { nodeId: string; position: ConnectionPointPosition }
  ) => {
    // Extract connection logic
    // ...existing implementation...
  };

  return {
    isDrawingLine,
    isDraggingPoint,
    hoveredConnectionPoint,
    selectedLineEndpoint,
    activePointData,
    lineInProgress,
    handleDoubleClick,
    connectLineToPoint,
    setHoveredConnectionPoint,
    setSelectedLineEndpoint,
    setIsDraggingPoint,
    setActivePointData,
    setIsDrawingLine
  };
}
```

### 2.3 Create Keyboard Shortcuts Hook

**File:** `src/app/(Workspace)/workspace/canvas/hooks/useKeyboardShortcuts.ts`

```typescript
import { useEffect } from 'react';
import { useCanvasStore } from '../lib/store/canvas-store';

export function useKeyboardShortcuts(copyCanvasToClipboard: () => void) {
  const {
    lineInProgress,
    cancelLineDraw,
    selectedPointIndices,
    deleteSelectedPoints,
    setStartMarker,
    setMarkerFillStyle,
    updateSelectedLineMarkers,
    markerFillStyle,
    snapToGrid,
    setSnapToGrid,
    startMarker,
    endMarker
  } = useCanvasStore();

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Extract keyboard event handling logic
      // ...existing implementation...
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Extract key up logic
      // ...existing implementation...
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    lineInProgress,
    cancelLineDraw,
    selectedPointIndices,
    deleteSelectedPoints,
    setStartMarker,
    setMarkerFillStyle,
    updateSelectedLineMarkers,
    copyCanvasToClipboard,
    snapToGrid
  ]);

  return {
    // Any exposed methods or state if needed
  };
}
```

### 2.4 Create Clipboard Operations Hook

**File:** `src/app/(Workspace)/workspace/canvas/hooks/useClipboardOperations.ts`

```typescript
import { RefObject } from 'react';
import { useCanvasStore, Node } from '../lib/store/canvas-store';
import { toast } from '@/hooks/use-toast';

export function useClipboardOperations(canvasRef: RefObject<HTMLDivElement>) {
  const { nodes, connections, pushToHistory } = useCanvasStore();

  // Copy canvas data to clipboard
  const copyCanvasToClipboard = () => {
    // Extract copyCanvasToClipboard logic
    // ...existing implementation...
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    // Extract paste handling logic
    // ...existing implementation...
  };

  return {
    copyCanvasToClipboard,
    handlePaste
  };
}
```

### 2.5 Create Connection Points Hook

**File:** `src/app/(Workspace)/workspace/canvas/hooks/useConnectionPoints.ts`

```typescript
import { useState, useEffect } from 'react';
import { useCanvasStore, ConnectionPointPosition } from '../lib/store/canvas-store';
import { calculateConnectionPointPosition } from '../lib/utils/connection-utils';

export function useConnectionPoints() {
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{ nodeId: string; position: ConnectionPointPosition } | null>(null);
  const { nodes, lineInProgress, activeTool, transform } = useCanvasStore();

  // Find a nearby connection point with a larger radius
  const findNearbyConnectionPoint = (x: number, y: number): { nodeId: string; position: ConnectionPointPosition } | null => {
    // Extract connection point finding logic
    // ...existing implementation...
    return null;
  };

  // Handle connection point click
  const handleConnectionPointClick = (nodeId: string, position: ConnectionPointPosition) => {
    // Extract connection point click logic
    // ...existing implementation...
  };

  // Update connection point hover state when mouse moves
  useEffect(() => {
    // Logic for updating connection point hover state
    // ...existing implementation if any...
  }, [activeTool, lineInProgress]);

  return {
    hoveredConnectionPoint,
    setHoveredConnectionPoint,
    findNearbyConnectionPoint,
    handleConnectionPointClick
  };
}
```

## Step 3: Create Component Wrappers

### 3.1 Create Canvas Content Component

**File:** `src/app/(Workspace)/workspace/canvas/components/canvas/CanvasContent.tsx`

```typescript
import React from 'react';
import { Node } from '../../lib/store/canvas-store';
import ShapeRenderer from '../shapes/ShapeRenderer';
import LineInProgress from '../line-drawing/LineInProgress';

interface CanvasContentProps {
  nodes: Node[];
  lineInProgress: Node | null;
  transform: {
    x: number;
    y: number;
    zoom: number;
  };
  onSelect: (id: string) => void;
  onResize: (nodeId: string, direction: string, dx: number, dy: number) => void;
  onConnectionPointClick: (nodeId: string, position: string) => void;
  onTextChange?: (nodeId: string, text: string) => void;
  onEmptyText?: (nodeId: string) => void;
  hoveredConnectionPoint: { nodeId: string; position: string } | null;
  selectedLineEndpoint: { nodeId: string; pointIndex: number } | null;
  activeTool: string;
  children?: React.ReactNode;
}

const CanvasContent: React.FC<CanvasContentProps> = ({
  nodes,
  lineInProgress,
  transform,
  onSelect,
  onResize,
  onConnectionPointClick,
  onTextChange,
  onEmptyText,
  hoveredConnectionPoint,
  selectedLineEndpoint,
  activeTool,
  children
}) => {
  return (
    <div 
      className="absolute"
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        transformOrigin: '0 0',
        width: '100%',
        height: '100%',
      }}
    >
      {nodes && nodes.map(node => (
        <ShapeRenderer
          key={node.id}
          node={node}
          isSelected={node.selected}
          activeTool={activeTool}
          onSelect={onSelect}
          onResize={onResize}
          onConnectionPointClick={onConnectionPointClick}
          hoveredConnectionPoint={hoveredConnectionPoint}
          selectedLineEndpoint={selectedLineEndpoint}
          onTextChange={onTextChange}
          onEmptyText={onEmptyText}
        />
      ))}
      
      {lineInProgress && (
        <LineInProgress 
          lineInProgress={lineInProgress}
        />
      )}
      
      {children}
    </div>
  );
};

export default CanvasContent;
```

### 3.2 Create Canvas Event Handlers Component

**File:** `src/app/(Workspace)/workspace/canvas/components/canvas/CanvasEventHandlers.tsx`

```typescript
import React, { forwardRef, ReactNode } from 'react';
import { useCanvasMouse } from '../../hooks/useCanvasMouse';
import { useLineDrawing } from '../../hooks/useLineDrawing';
import { useClipboardOperations } from '../../hooks/useClipboardOperations';

interface CanvasEventHandlersProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const CanvasEventHandlers = forwardRef<HTMLDivElement, CanvasEventHandlersProps>(
  ({ children, className = '', style = {} }, ref) => {
    // Use custom hooks
    const { 
      handleMouseDown, 
      handleMouseMove, 
      handleMouseUp 
    } = useCanvasMouse(ref);
    
    const {
      handleDoubleClick
    } = useLineDrawing(ref);
    
    const {
      handlePaste
    } = useClipboardOperations(ref);

    return (
      <div
        ref={ref}
        className={className}
        style={style}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onPaste={handlePaste}
        tabIndex={0} // Make the div focusable to receive keyboard events
      >
        {children}
      </div>
    );
  }
);

CanvasEventHandlers.displayName = 'CanvasEventHandlers';

export default CanvasEventHandlers;
```

## Step 4: Refactor Canvas.tsx

**File:** `src/app/(Workspace)/workspace/canvas/components/Canvas.tsx`

```typescript
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, Node } from '../lib/store/canvas-store';
import SelectionBox from './selection/SelectionBox';
import CanvasGrid from './grid/CanvasGrid';
import AlignmentGuide from './alignment/AlignmentGuide';
import IconSheet from './ui/IconSheet';
import ExamplesSheet from './ui/ExamplesSheet';
import CanvasContent from './canvas/CanvasContent';
import CanvasEventHandlers from './canvas/CanvasEventHandlers';
import { useCanvasMouse } from '../hooks/useCanvasMouse';
import { useLineDrawing } from '../hooks/useLineDrawing';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useClipboardOperations } from '../hooks/useClipboardOperations';
import { useConnectionPoints } from '../hooks/useConnectionPoints';
import { deepClone } from '../lib/utils/connection-utils';
import { calculateConnectionPointPosition } from '../lib/utils/connection-utils';
import { ResizeHandleDirection } from './ui/ResizeHandles';
import { ConnectionPointPosition } from './ui/ConnectionPoints';

interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
  nodes?: Node[];
  onNodesChange?: (nodes: Node[]) => void;
  canvasId?: string;
}

const Canvas: React.FC<CanvasProps> = ({ 
  width,
  height,
  className = '',
  nodes = [],
  onNodesChange,
  canvasId
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [historyInitialized, setHistoryInitialized] = useState(false);
  const [storeNodes, setStoreNodes] = useState<Node[]>([]);
  
  // Get canvas store state and functions
  const { 
    transform, 
    activeTool, 
    gridSize, 
    snapToGrid,
    presentationMode,
    lineInProgress,
    selectedPointIndices,
    startMarker,
    endMarker,
    markerFillStyle,
    selectNode,
    updateNodeDimensions,
    deselectAllNodes,
    updateNodePosition,
    selectMultipleNodes
  } = useCanvasStore();
  
  // Use custom hooks
  const { 
    alignmentGuides,
    selectionBox,
    isSelecting,
  } = useCanvasMouse(canvasRef);
  
  const {
    hoveredConnectionPoint,
    selectedLineEndpoint
  } = useLineDrawing(canvasRef);
  
  const { copyCanvasToClipboard } = useClipboardOperations(canvasRef);
  
  useKeyboardShortcuts(copyCanvasToClipboard);
  
  const { handleConnectionPointClick } = useConnectionPoints();
  
  // Use the nodes from props or from the store
  const displayNodes = nodes.length > 0 ? nodes : storeNodes;
  
  // Set dimensions after component mounts on client side
  useEffect(() => {
    const parentWidth = canvasRef.current?.parentElement?.clientWidth;
    const parentHeight = canvasRef.current?.parentElement?.clientHeight;
    
    setDimensions({
      width: width || parentWidth || 2000,
      height: height || parentHeight || 1500
    });
    
    const handleResize = () => {
      if (!width || !height) {
        const parentWidth = canvasRef.current?.parentElement?.clientWidth;
        const parentHeight = canvasRef.current?.parentElement?.clientHeight;
        
        setDimensions({
          width: width || parentWidth || 2000,
          height: height || parentHeight || 1500
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  // Initialize history when canvas first loads
  useEffect(() => {
    if (canvasId && !historyInitialized) {
      // Initialize history logic
      // ...existing implementation...
      setHistoryInitialized(true);
    }
  }, [canvasId, displayNodes, historyInitialized]);
  
  // Initialize nodes in the store when component mounts
  useEffect(() => {
    // Only initialize if we have nodes from props and they're not already in the store
    // ...existing implementation...
  }, [nodes]);
  
  // Subscribe to store changes to keep local state in sync
  useEffect(() => {
    // Initial sync
    setStoreNodes(useCanvasStore.getState().nodes);
    
    // Subscribe to store changes
    const unsubscribe = useCanvasStore.subscribe((state) => {
      setStoreNodes(state.nodes);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Add effect to deselect all nodes when line tool is selected
  useEffect(() => {
    if (['line', 'arrow'].includes(activeTool)) {
      deselectAllNodes();
    }
  }, [activeTool, deselectAllNodes]);
  
  // Handle resizing of nodes
  const handleResizeNode = (nodeId: string, direction: ResizeHandleDirection, dx: number, dy: number) => {
    // Extract resizing logic
    // ...existing implementation...
  };
  
  // Handle text change
  const handleTextChange = (nodeId: string, text: string) => {
    // Extract text change logic
    // ...existing implementation...
  };
  
  // Add handler for empty text shapes
  const handleEmptyTextShape = (nodeId: string) => {
    // Extract empty text shape logic
    // ...existing implementation...
  };

  // Add effect for wheel event (with passive: false option)
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    
    const wheelHandler = (e: WheelEvent) => {
      // Extract wheel event handling logic
      // ...existing implementation...
    };
    
    // Add event listener with { passive: false } to allow preventDefault()
    canvasElement.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Cleanup function to remove event listener
    return () => {
      canvasElement.removeEventListener('wheel', wheelHandler);
    };
  }, [transform, presentationMode]);
  
  return (
    <CanvasEventHandlers
      ref={canvasRef}
      className={`relative overflow-hidden bg-background ${className}`}
      style={{ 
        width: dimensions.width, 
        height: dimensions.height,
        cursor: activeTool === 'text' ? 'text' : 'default'
      }}
    >
      <CanvasGrid 
        snapToGrid={snapToGrid} 
        gridSize={gridSize} 
        transform={transform} 
        presentationMode={presentationMode} 
      />
      
      {isSelecting && selectionBox && (
        <SelectionBox 
          selectionBox={selectionBox} 
          transform={transform} 
        />
      )}
      
      {/* Render alignment guides */}
      {alignmentGuides.horizontal.map((guide, index) => (
        <AlignmentGuide
          key={`h-${index}`}
          orientation="horizontal"
          position={guide.y}
          start={guide.start}
          end={guide.end}
          transform={transform}
        />
      ))}
      
      {alignmentGuides.vertical.map((guide, index) => (
        <AlignmentGuide
          key={`v-${index}`}
          orientation="vertical"
          position={guide.x}
          start={guide.start}
          end={guide.end}
          transform={transform}
        />
      ))}
      
      <CanvasContent
        nodes={displayNodes}
        lineInProgress={lineInProgress}
        transform={transform}
        onSelect={selectNode}
        onResize={handleResizeNode}
        onConnectionPointClick={handleConnectionPointClick}
        onTextChange={handleTextChange}
        onEmptyText={handleEmptyTextShape}
        hoveredConnectionPoint={hoveredConnectionPoint}
        selectedLineEndpoint={selectedLineEndpoint}
        activeTool={activeTool}
      />
      
      <IconSheet />
      <ExamplesSheet />
    </CanvasEventHandlers>
  );
};

export default Canvas;
```

## Step 5: Update Connection Utilities

**File:** `src/app/(Workspace)/workspace/canvas/lib/utils/connection-utils.ts`

Enhance the existing file with additional functions:

```typescript
import { Node, Connection, ConnectionPointPosition, MarkerShape } from '../store/canvas-store';

// Find a nearby connection point with a larger radius
export function findNearbyConnectionPoint(
  x: number, 
  y: number, 
  nodes: Node[],
  hoveredConnectionPoint: { nodeId: string; position: ConnectionPointPosition } | null,
  lineInProgress: Node | null,
  selectedLineEndpoint: { nodeId: string; pointIndex: number } | null,
  transform: { x: number; y: number; zoom: number }
): { nodeId: string; position: ConnectionPointPosition } | null {
  // Extract connection point finding logic
  // ...existing implementation...
  return null;
}

// Connect a line endpoint to a connection point
export function connectLineToPoint(
  lineId: string,
  pointIndex: number,
  connectionPointData: { nodeId: string; position: ConnectionPointPosition },
  nodes: Node[],
  lineInProgress: Node | null,
  updateLineDraw: (x: number, y: number, isShiftPressed: boolean) => void,
  moveLinePoint: (nodeId: string, pointIndex: number, x: number, y: number) => void,
  createConnection: (connection: Connection) => void
): void {
  // Extract line connection logic
  // ...existing implementation...
}

// Other connection utility functions
// ...
```

## Step 6: Integration Plan

1. Start with the utility files since they're relatively self-contained
2. Create hooks one by one, starting with simpler ones
3. Create component wrappers
4. Refactor Canvas.tsx to use the new components and hooks
5. Test each step thoroughly before proceeding to the next

### Testing Strategy

1. Create a separate test branch for the refactoring
2. Set up tests for each extracted component and hook
3. Run integration tests after each major step
4. Do manual testing in the UI
5. Have multiple team members review the changes

### Schedule Recommendation

| Week | Task | Description |
|------|------|-------------|
| 1 | Setup & Utilities | Create utility files and basic structure |
| 2 | Basic Hooks | Implement core hooks (mouse, keyboard) |
| 3 | Advanced Hooks | Implement complex hooks (line drawing, connections) |
| 4 | Component Wrappers | Create component wrappers |
| 5 | Canvas Refactoring | Refactor main Canvas.tsx component |
| 6 | Testing & Integration | Full testing and integration |

## Conclusion

This refactoring will significantly improve the maintainability of the canvas component by:

1. Separating concerns into logical modules
2. Reducing the size of individual files
3. Improving reusability of code
4. Making testing easier
5. Making future feature additions simpler

The modular approach will allow different team members to work on different aspects of the canvas without conflicts, and will make it easier to locate and fix bugs.