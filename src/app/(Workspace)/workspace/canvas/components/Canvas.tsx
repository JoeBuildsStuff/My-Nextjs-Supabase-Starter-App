'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, Node, MarkerShape } from '../lib/store/canvas-store';
import ShapeRenderer from './shapes/ShapeRenderer';
import SelectionBox from './selection/SelectionBox';
import CanvasGrid from './grid/CanvasGrid';
import LineInProgress from './line-drawing/LineInProgress';
import { ConnectionPointPosition } from './ui/ConnectionPoints';
import { ResizeHandleDirection } from './ui/ResizeHandles';
import { calculateConnectionPointPosition, deepClone } from '../lib/utils/connection-utils';
import AlignmentGuide from './alignment/AlignmentGuide';
import { isElbowLine } from '../lib/utils/elbow-line-utils';
import { toast } from '@/hooks/use-toast';
import IconSheet from './ui/IconSheet';
import ExamplesSheet from './ui/ExamplesSheet';
import { findAlignmentGuides, findClosestLineSegment, findNodeAtPosition, isNodeInSelectionBox, getSnappedPosition } from '../lib/utils/node-utils';

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
    updateNodeDimensions,
    presentationMode,
    startLineDraw,
    updateLineDraw,
    finishLineDraw,
    cancelLineDraw,
    lineInProgress,
    addPointToLine,
    selectLinePoint,
    deselectLinePoints,
    moveLinePoint,
    selectedPointIndices,
    addPointToExistingLine,
    deleteSelectedPoints,
    createConnection,
    markerFillStyle,
    startMarker,
    setStartMarker,
    setMarkerFillStyle,
    updateSelectedLineMarkers,
    toggleNodeSelection,
    setSnapToGrid,
    endMarker,
  } = useCanvasStore();
  
  // State for tracking mouse interactions
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingNode, setIsMovingNode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState<Record<string, { x: number, y: number }>>({});
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [activePointData, setActivePointData] = useState<{
    nodeId: string;
    pointIndex: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [historyInitialized, setHistoryInitialized] = useState(false);
  
  // Add a state for alignment guides
  const [alignmentGuides, setAlignmentGuides] = useState<{
    horizontal: { y: number, start: number, end: number, type?: 'top' | 'bottom' | 'center' }[];
    vertical: { x: number, start: number, end: number, type?: 'left' | 'right' | 'center' }[];
  }>({
    horizontal: [],
    vertical: []
  });
  
  // Add a threshold for alignment snapping (in canvas units)
  // move this to node-utils.ts
  // const ALIGNMENT_THRESHOLD = 5;
  // const EXTENSION_AMOUNT = 50; // Extension amount for guide lines
  
  // Add a state to track the nodes from the store
  const [storeNodes, setStoreNodes] = useState<Node[]>([]);
  
  // Use the nodes from props or from the store
  const displayNodes = nodes.length > 0 ? nodes : storeNodes;
  
  // State for tracking connection points
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{ nodeId: string; position: ConnectionPointPosition } | null>(null);
  const [selectedLineEndpoint, setSelectedLineEndpoint] = useState<{ nodeId: string; pointIndex: number } | null>(null);
  
  // Copy canvas data to clipboard
  const copyCanvasToClipboard = () => {
    const { nodes, connections } = useCanvasStore.getState();
    
    // Check if any nodes are selected
    const selectedNodes = nodes.filter(node => node.selected);
    
    // If nodes are selected, only copy those nodes and their connections
    const nodesToCopy = selectedNodes.length > 0 ? selectedNodes : nodes;
    
    // Get only the connections that involve the nodes being copied
    const nodeIds = nodesToCopy.map(node => node.id);
    const relevantConnections = connections.filter(conn => 
      nodeIds.includes(conn.lineId) && nodeIds.includes(conn.shapeId)
    );
    
    // Prepare the export data
    const exportData = {
      nodes: nodesToCopy,
      connections: relevantConnections,
      version: "1.0",
      exportDate: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: selectedNodes.length > 0 
            ? `Copied ${selectedNodes.length} selected node${selectedNodes.length === 1 ? '' : 's'} to clipboard.`
            : "The canvas JSON data has been copied to your clipboard."
        });
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive"
        });
      });
  };
  
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
      // Initialize history with empty state
      useCanvasStore.setState(state => {
        state.history = [{
          nodes: [],
          edges: [],
          connections: []
        }];
        state.historyIndex = 0;
        return state;
      });
      
      // If we have nodes, add them to history
      if (displayNodes && displayNodes.length > 0) {
        setTimeout(() => {
          useCanvasStore.setState(state => {
            state.history.push({
              nodes: deepClone(displayNodes),
              edges: deepClone(state.edges),
              connections: deepClone(state.connections || [])
            });
            state.historyIndex = 1;
            return state;
          });
        }, 100);
      }
      
      setHistoryInitialized(true);
    }
  }, [canvasId, displayNodes, historyInitialized]);
  
  // Initialize nodes in the store when component mounts
  useEffect(() => {
    // Only initialize if we have nodes from props and they're not already in the store
    if (nodes && nodes.length > 0) {
      const currentStoreNodes = useCanvasStore.getState().nodes;
      if (!currentStoreNodes || currentStoreNodes.length === 0) {
        // Set the nodes in the store
        useCanvasStore.setState({ nodes });
      }
    }
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
  
  // Add event listeners for keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the event target is an input or textarea element
      const target = e.target as HTMLElement;
      const isEditingText = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
      
      // Add arrow key detection
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Only handle arrow keys if we're not editing text
        if (!isEditingText) {
          e.preventDefault(); // Prevent page scrolling
          
          // Get selected nodes
          const selectedNodes = displayNodes.filter(node => node.selected);
          
          // If any nodes are selected, move them in the direction of the arrow key
          if (selectedNodes.length > 0) {
            // Determine base distance to move
            const baseDistance = snapToGrid ? gridSize : 1;
            
            // Use a multiplier of 5 when Shift is pressed
            const multiplier = e.shiftKey ? 5 : 1;
            const moveDistance = baseDistance * multiplier;
            
            // Calculate the movement based on key pressed
            let dx = 0;
            let dy = 0;
            
            switch (e.key) {
              case 'ArrowUp':
                dy = -moveDistance;
                break;
              case 'ArrowDown':
                dy = moveDistance;
                break;
              case 'ArrowLeft':
                dx = -moveDistance;
                break;
              case 'ArrowRight':
                dx = moveDistance;
                break;
            }
            
            // Move each selected node
            selectedNodes.forEach(node => {
              updateNodePosition(
                node.id,
                node.position.x + dx,
                node.position.y + dy
              );
            });
            
            // Push to history to preserve the movement
            useCanvasStore.getState().pushToHistory();
          }
        }
      }
      
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      } else if (e.key === 'Escape') {
        if (lineInProgress) {
          cancelLineDraw();
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText) {
        if (selectedPointIndices && selectedPointIndices.length > 0) {
          deleteSelectedPoints();
          e.preventDefault();
        }
      } else if (e.key === 'c' && (e.metaKey || e.ctrlKey) && !isEditingText) {
        // Handle Cmd+C / Ctrl+C to copy canvas JSON to clipboard
        e.preventDefault();
        copyCanvasToClipboard();
      } else if (e.key === 'a' && (e.metaKey || e.ctrlKey) && !isEditingText) {
        // Handle Cmd+A / Ctrl+A to select all nodes
        e.preventDefault();
        
        // Get all node IDs
        const allNodeIds = displayNodes.map(node => node.id);
        
        // Select all nodes
        selectMultipleNodes(allNodeIds);
      } else if (e.key === 'g' && (e.metaKey || e.ctrlKey) && !e.shiftKey && !isEditingText) {
        // Handle Cmd+G / Ctrl+G to toggle grid
        e.preventDefault();
        setSnapToGrid(!snapToGrid);
      }
      
      // Shortcuts for line markers - only when a line is selected
      const selectedLine = nodes.find(node => 
        node.selected && (node.type === 'line' || node.type === 'arrow')
      );
      
      if (selectedLine) {
        // Alt+1-5 for start marker types
        if (e.key >= '1' && e.key <= '5' && e.altKey) {
          e.preventDefault();
          const markerIndex = parseInt(e.key) - 1;
          const markers: MarkerShape[] = ['none', 'triangle', 'circle', 'square', 'diamond'];
          if (markerIndex >= 0 && markerIndex < markers.length) {
            setStartMarker(markers[markerIndex]);
            updateSelectedLineMarkers();
          }
        }
        
        // Shift+F to toggle fill style
        if (e.key === 'f' && e.shiftKey) {
          e.preventDefault();
          setMarkerFillStyle(markerFillStyle === 'filled' ? 'outlined' : 'filled');
          updateSelectedLineMarkers();
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [lineInProgress, cancelLineDraw, selectedPointIndices, deleteSelectedPoints, setStartMarker, setMarkerFillStyle, updateSelectedLineMarkers, copyCanvasToClipboard, snapToGrid]);
  
  // Add effect to deselect all nodes when line tool is selected
  useEffect(() => {
    if (['line', 'arrow'].includes(activeTool)) {
      deselectAllNodes();
    }
  }, [activeTool, deselectAllNodes]);
  
  // Helper function to check if a node is within the selection box
  // move this to node-utils.ts
  // const isNodeInSelectionBox = (node: Node, selectionBox: { start: { x: number, y: number }, end: { x: number, y: number } }) => {
  //   if (!node.dimensions) return false;
    
  //   const boxLeft = Math.min(selectionBox.start.x, selectionBox.end.x);
  //   const boxRight = Math.max(selectionBox.start.x, selectionBox.end.x);
  //   const boxTop = Math.min(selectionBox.start.y, selectionBox.end.y);
  //   const boxBottom = Math.max(selectionBox.start.y, selectionBox.end.y);
    
  //   // Special handling for line and arrow nodes
  //   if ((node.type === 'line' || node.type === 'arrow') && node.points && node.points.length > 1) {
  //     // Check if any segment of the line intersects with the selection box
  //     for (let i = 0; i < node.points.length - 1; i++) {
  //       const p1 = {
  //         x: node.position.x + node.points[i].x,
  //         y: node.position.y + node.points[i].y
  //       };
  //       const p2 = {
  //         x: node.position.x + node.points[i + 1].x,
  //         y: node.position.y + node.points[i + 1].y
  //       };
        
  //       // Check if either endpoint is inside the box
  //       const p1Inside = 
  //         p1.x >= boxLeft && p1.x <= boxRight && 
  //         p1.y >= boxTop && p1.y <= boxBottom;
        
  //       const p2Inside = 
  //         p2.x >= boxLeft && p2.x <= boxRight && 
  //         p2.y >= boxTop && p2.y <= boxBottom;
        
  //       // If either endpoint is inside, the segment intersects
  //       if (p1Inside || p2Inside) {
  //         return true;
  //       }
        
  //       // Check if the line segment intersects any of the four edges of the selection box
  //       // Line-line intersection check for all four edges of the selection box
  //       if (
  //         lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxLeft, boxTop, boxRight, boxTop) || // Top edge
  //         lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxLeft, boxBottom, boxRight, boxBottom) || // Bottom edge
  //         lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxLeft, boxTop, boxLeft, boxBottom) || // Left edge
  //         lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxRight, boxTop, boxRight, boxBottom)   // Right edge
  //       ) {
  //         return true;
  //       }
  //     }
      
  //     // No segments intersect
  //     return false;
  //   }
    
  //   // Regular bounding box check for other shapes
  //   const nodeLeft = node.position.x;
  //   const nodeRight = node.position.x + node.dimensions.width;
  //   const nodeTop = node.position.y;
  //   const nodeBottom = node.position.y + node.dimensions.height;
    
  //   return (
  //     nodeLeft < boxRight &&
  //     nodeRight > boxLeft &&
  //     nodeTop < boxBottom &&
  //     nodeBottom > boxTop
  //   );
  // };
  
  // Helper function to check if two line segments intersect
  // move this to node-utils.ts
  // const lineSegmentsIntersect = (
  //   x1: number, y1: number, x2: number, y2: number, // First line segment
  //   x3: number, y3: number, x4: number, y4: number  // Second line segment
  // ): boolean => {
  //   // Calculate the direction of the lines
  //   const d1x = x2 - x1;
  //   const d1y = y2 - y1;
  //   const d2x = x4 - x3;
  //   const d2y = y4 - y3;
    
  //   // Calculate the determinant
  //   const det = d1x * d2y - d1y * d2x;
    
  //   // If determinant is zero, lines are parallel
  //   if (det === 0) return false;
    
  //   // Calculate the parameters for the intersection point
  //   const s = ((x1 - x3) * d2y - (y1 - y3) * d2x) / det;
  //   const t = ((x1 - x3) * d1y - (y1 - y3) * d1x) / det;
    
  //   // Check if the intersection point is within both line segments
  //   return s >= 0 && s <= 1 && t >= 0 && t <= 1;
  // };
  
  // Helper function to check if a point is under the cursor
  const findPointAtPosition = (x: number, y: number): { nodeId: string; pointIndex: number } | null => {
    const selectedNodes = displayNodes?.filter(node => 
      node.selected && 
      node.points && 
      node.points.length > 0 &&
      (node.type === 'line' || node.type === 'arrow')
    ) || [];
    
    if (selectedNodes.length === 0) return null;
    
    for (const node of selectedNodes) {
      if (!node.points) continue;
      
      // Check if this is an elbow line
      const isElbowLineNode = isElbowLine(node);
      
      for (let i = 0; i < node.points.length; i++) {
        // For elbow lines, only allow selecting endpoints (first and last points)
        if (isElbowLineNode && i > 0 && i < node.points.length - 1) {
          continue; // Skip middle points for elbow lines
        }
        
        const point = node.points[i];
        const pointX = node.position.x + point.x;
        const pointY = node.position.y + point.y;
        
        const distance = Math.sqrt(
          Math.pow((pointX - x) * transform.zoom, 2) + 
          Math.pow((pointY - y) * transform.zoom, 2)
        );
        
        if (distance <= 10) {
          // Check if this is an endpoint (first or last point)
          const isEndpoint = i === 0 || i === node.points.length - 1;
          
          // Set the selected line endpoint if it's an endpoint
          if (isEndpoint) {
            setSelectedLineEndpoint({ nodeId: node.id, pointIndex: i });
          } else {
            setSelectedLineEndpoint(null);
          }
          
          return { nodeId: node.id, pointIndex: i };
        }
      }
    }
    
    setSelectedLineEndpoint(null);
    return null;
  };
  
  // Find the closest line segment to the given point
  // move this to node-utils.ts
  // const findClosestLineSegment = (
  //   x: number, 
  //   y: number
  // ): { nodeId: string; segmentIndex: number; distance: number } | null => {
  //   if (!displayNodes) return null;
    
  //   let closestSegment: { nodeId: string; segmentIndex: number; distance: number } | null = null;
    
  //   for (const node of displayNodes) {
  //     // Skip nodes without points or with fewer than 2 points
  //     if (!node.points || node.points.length < 2) continue;
      
  //     // Skip elbow lines - we don't allow adding points to them
  //     if (isElbowLine(node)) continue;
      
  //     for (let i = 0; i < node.points.length - 1; i++) {
  //       const p1 = {
  //         x: node.position.x + node.points[i].x,
  //         y: node.position.y + node.points[i].y
  //       };
  //       const p2 = {
  //         x: node.position.x + node.points[i + 1].x,
  //         y: node.position.y + node.points[i + 1].y
  //       };
        
  //       const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
        
  //       if (closestSegment === null || distance < closestSegment.distance) {
  //         closestSegment = {
  //           nodeId: node.id,
  //           segmentIndex: i,
  //           distance
  //         };
  //       }
  //     }
  //   }
    
  //   return closestSegment && closestSegment.distance * transform.zoom <= 10 
  //     ? closestSegment 
  //     : null;
  // };
  
  // Helper function to calculate distance from a point to a line segment
  // move this to node-utils.ts
  // const distanceToLineSegment = (
  //   x: number, y: number,
  //   x1: number, y1: number,
  //   x2: number, y2: number
  // ): number => {
  //   const lengthSquared = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    
  //   if (lengthSquared === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
    
  //   const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
    
  //   const projectionX = x1 + t * (x2 - x1);
  //   const projectionY = y1 + t * (y2 - y1);
    
  //   return Math.sqrt((x - projectionX) * (x - projectionX) + (y - projectionY) * (y - projectionY));
  // };
  
  // Helper function to find a node at a specific position
  // move this to node-utils.ts
  // const findNodeAtPosition = (x: number, y: number): Node | undefined => {
  //   if (!displayNodes) return undefined;
    
  //   // First check groups
  //   for (let i = displayNodes.length - 1; i >= 0; i--) {
  //     const node = displayNodes[i];
  //     const { position, dimensions } = node;
      
  //     if (node.data?.isGroup === true && dimensions) {
  //       if (
  //         x >= position.x && 
  //         x <= position.x + dimensions.width && 
  //         y >= position.y && 
  //         y <= position.y + dimensions.height
  //       ) {
  //         return node;
  //       }
  //     }
  //   }
    
  //   // Check for line segments first - use proximity detection instead of bounding box
  //   for (let i = displayNodes.length - 1; i >= 0; i--) {
  //     const node = displayNodes[i];
      
  //     // For lines and arrows, check if the click is close to any segment
  //     if ((node.type === 'line' || node.type === 'arrow') && node.points && node.points.length > 1) {
  //       // Check each segment of the line
  //       for (let j = 0; j < node.points.length - 1; j++) {
  //         const p1 = {
  //           x: node.position.x + node.points[j].x,
  //           y: node.position.y + node.points[j].y
  //         };
  //         const p2 = {
  //           x: node.position.x + node.points[j + 1].x,
  //           y: node.position.y + node.points[j + 1].y
  //         };
          
  //         // Calculate distance from click to this line segment
  //         const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
          
  //         // If click is close enough to the line segment (within 10px / zoom), return this node
  //         if (distance * transform.zoom <= 10) {
  //           return node;
  //         }
  //       }
  //     }
  //   }
    
  //   // Then check regular nodes using bounding box
  //   for (let i = displayNodes.length - 1; i >= 0; i--) {
  //     const node = displayNodes[i];
  //     const { position, dimensions, parentId } = node;
      
  //     // Skip lines (already checked above), groups, and nodes with parents
  //     if (parentId || node.data?.isGroup === true || node.type === 'line' || node.type === 'arrow') continue;
      
  //     if (!dimensions) continue;
      
  //     if (
  //       x >= position.x && 
  //       x <= position.x + dimensions.width && 
  //       y >= position.y && 
  //       y <= position.y + dimensions.height
  //     ) {
  //       return node;
  //     }
  //   }
    
  //   return undefined;
  // };
  
  // Handle mouse down for panning, shape creation, or node interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left mouse button
    
    // If we're in presentation mode, don't allow editing
    if (presentationMode) return;
    
    // If we're in the middle of a drag operation, don't start a new one
    if (isDragging || isMovingNode || isDraggingPoint) return;
    
    // Get canvas rect
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Calculate mouse position in canvas coordinates
    const x = (e.clientX - rect.left - transform.x) / transform.zoom;
    const y = (e.clientY - rect.top - transform.y) / transform.zoom;
    
    // Apply grid snapping if enabled
    const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
    
    // Check if shift key is pressed for angle constraints
    const isShiftPressed = e.shiftKey;
    
    // Handle different tools
    if (activeTool === 'hand') {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (['rectangle', 'circle', 'triangle', 'diamond', 'text'].includes(activeTool)) {
      // Create a new shape at the clicked position
      const newNode = createShapeAtPosition(activeTool, snappedX, snappedY);
      
      // Select the new node
      selectNode(newNode.id);
      
      // Start moving the new node
      setIsMovingNode(true);
      setActiveNodeId(newNode.id);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      
      const startPositions: Record<string, { x: number, y: number }> = {};
      startPositions[newNode.id] = {
        x: newNode.position.x,
        y: newNode.position.y
      };
      
      setNodeStartPos(startPositions);
    } else if (['line', 'arrow'].includes(activeTool)) {
      // Check if we're hovering over a connection point
      const connectionPointData = findNearbyConnectionPoint(x, y);
      
      if (connectionPointData) {
       // TODO: I dont think this is needed anymore as we are using handleConnectionPointClick

       // handleMouseDown is not fired when clicking on a connection point
       // handleConnectionPointClick is fired when clicking on a connection point


        // Start drawing a line from this connection point
        // const { nodeId, position } = connectionPointData;
        // const node = displayNodes?.find(n => n.id === nodeId);
        
        // if (node) {
        //   // Calculate the exact connection point position
        //   // since this is for the start of the line we can use start position
        //   const connectionPoint = calculateConnectionPointPosition(node, position, true, lineInProgress || undefined, 'start');
          
        //   // Start drawing a line from this connection point
        //   startLineDraw(connectionPoint.x, connectionPoint.y, activeTool as 'line' | 'arrow');
        //   setIsDrawingLine(true);
        // }
      } else {
        // If no connection point is hovered, proceed with normal line drawing
        if (lineInProgress) {
          updateLineDraw(x, y, isShiftPressed);
          addPointToLine();
        } else {
          startLineDraw(snappedX, snappedY, activeTool as 'line' | 'arrow');
          setIsDrawingLine(true);
        }
      }
    } else if (activeTool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        const pointData = findPointAtPosition(x, y);
        if (pointData) {
          selectLinePoint(pointData.nodeId, pointData.pointIndex, e.shiftKey);
          setIsDraggingPoint(true);
          setActivePointData({
            ...pointData,
            startX: x,
            startY: y
          });
          setLastMousePos({ x: e.clientX, y: e.clientY });
          
          // If we're clicking on a line endpoint, check if there's an existing connection
          if (selectedLineEndpoint) {
            const existingConnection = useCanvasStore.getState().connections.find(
              conn => conn.lineId === selectedLineEndpoint.nodeId && conn.pointIndex === selectedLineEndpoint.pointIndex
            );
            
            // If there's an existing connection, show it as hovered
            if (existingConnection) {
              setHoveredConnectionPoint({
                nodeId: existingConnection.shapeId,
                position: existingConnection.position
              });
            }
          }
          
          e.stopPropagation();
          return;
        }
        
        if (e.altKey) {
          const segmentData = findClosestLineSegment(x, y, displayNodes, transform);
          if (segmentData) {
            // Check if this is an elbow line - don't allow adding points to elbow lines
            const node = displayNodes?.find(n => n.id === segmentData.nodeId);
            const isElbowLineNode = node && isElbowLine(node);
            
            if (!isElbowLineNode) {
              addPointToExistingLine(segmentData.nodeId, segmentData.segmentIndex, x, y);
            }
          }
        }
        
        const clickedNode = findNodeAtPosition(x, y, displayNodes, transform);
        if (clickedNode) {
          // Check if shift key is pressed for multi-selection
          if (e.shiftKey) {
            // Toggle selection state of the clicked node
            toggleNodeSelection(clickedNode.id);
            deselectLinePoints();
          } else {
            // Normal click behavior - deselect others and select this one
            if (!clickedNode.selected) {
              selectNode(clickedNode.id);
              deselectLinePoints();
            }
          }
          
          setIsMovingNode(true);
          setActiveNodeId(clickedNode.id);
          setLastMousePos({ x: e.clientX, y: e.clientY });
          
          const startPositions: Record<string, { x: number, y: number }> = {};
          nodes.forEach(node => {
            if (node.selected) {
              startPositions[node.id] = {
                x: node.position.x,
                y: node.position.y
              };
            }
          });
          
          setNodeStartPos(startPositions);
        } else {
          // Check if we're clicking within the bounding box of an already selected line
          // This allows dragging a selected line by its bounding box
          const selectedLineNode = displayNodes?.find(node => 
            node.selected && 
            (node.type === 'line' || node.type === 'arrow') && 
            node.dimensions &&
            x >= node.position.x && 
            x <= node.position.x + node.dimensions.width && 
            y >= node.position.y && 
            y <= node.position.y + node.dimensions.height
          );
          
          if (selectedLineNode) {
            setIsMovingNode(true);
            setActiveNodeId(selectedLineNode.id);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            
            const startPositions: Record<string, { x: number, y: number }> = {};
            startPositions[selectedLineNode.id] = {
              x: selectedLineNode.position.x,
              y: selectedLineNode.position.y
            };
            
            setNodeStartPos(startPositions);
          } else {
            setIsSelecting(true);
            setSelectionBox({
              start: { x, y },
              end: { x, y }
            });
            deselectAllNodes();
            deselectLinePoints();
          }
        }
      }
    }
  };
  
  // Handle mouse move for panning, node movement, or selection box
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      
      panCanvas(dx, dy);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDraggingPoint && activePointData) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Check if we're dragging a line endpoint
        const isEndpoint = selectedLineEndpoint !== null && 
                          activePointData.nodeId === selectedLineEndpoint.nodeId && 
                          activePointData.pointIndex === selectedLineEndpoint.pointIndex;
        
        if (isEndpoint) {
          // Use the more comprehensive check that includes nearby points
          const connectionPointData = findNearbyConnectionPoint(x, y);
          
          // Update the hovered connection point state
          if (JSON.stringify(connectionPointData) !== JSON.stringify(hoveredConnectionPoint)) {
            setHoveredConnectionPoint(connectionPointData);
          }
          
          // If we're hovering over a connection point, snap the line to it
          if (connectionPointData) {
            // Connect the line endpoint to the connection point
            connectLineToPoint(
              activePointData.nodeId,
              activePointData.pointIndex,
              connectionPointData
            );
            return;
          } else {
            // If not hovering over a connection point, move the point normally
            moveLinePoint(
              activePointData.nodeId,
              activePointData.pointIndex,
              x,
              y
            );
          }
        }
      }
    } else if (isMovingNode && activeNodeId) {
      const dx = (e.clientX - lastMousePos.x) / transform.zoom;
      const dy = (e.clientY - lastMousePos.y) / transform.zoom;
      
      const selectedNodes = displayNodes?.filter(node => node.selected) || [];
      
      // Find alignment guides (now works with grid on too)
      if (displayNodes) {
        // Only calculate guides if we have nodes to move
        if (selectedNodes.length > 0) {
          const guides = findAlignmentGuides(selectedNodes, displayNodes, dx, dy, nodeStartPos);
          setAlignmentGuides(guides);
        }
        
        // Apply snapping for each selected node
        selectedNodes.forEach(node => {
          if (!nodeStartPos[node.id]) {
            nodeStartPos[node.id] = { x: node.position.x, y: node.position.y };
          }
          
          if (snapToGrid) {
            // With grid on, we still show guides but snap to grid
            const gridX = Math.round((nodeStartPos[node.id].x + dx) / gridSize) * gridSize;
            const gridY = Math.round((nodeStartPos[node.id].y + dy) / gridSize) * gridSize;
            
            updateNodePosition(
              node.id,
              gridX,
              gridY
            );
          } else {
            // Without grid, use alignment guide snapping
            const { x: adjustedDx, y: adjustedDy } = getSnappedPosition(node, dx, dy, alignmentGuides, nodeStartPos);
            
            updateNodePosition(
              node.id,
              nodeStartPos[node.id].x + adjustedDx,
              nodeStartPos[node.id].y + adjustedDy
            );
          }
        });
      }
    } else if (isSelecting && selectionBox) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        setSelectionBox({
          ...selectionBox,
          end: { x, y }
        });
        
        if (displayNodes) {
          const nodesInBox = displayNodes
            .filter(node => isNodeInSelectionBox(node, { ...selectionBox, end: { x, y } }));
          
          if (e.shiftKey) {
            // With shift, add these nodes to the current selection
            const currentSelectedIds = displayNodes
              .filter(node => node.selected)
              .map(node => node.id);
              
            const newSelectedIds = nodesInBox
              .filter(node => !node.selected)
              .map(node => node.id);
              
            selectMultipleNodes([...currentSelectedIds, ...newSelectedIds]);
          } else {
            // Without shift, select only the nodes in the box
            const selectedNodeIds = nodesInBox.map(node => node.id);
            selectMultipleNodes(selectedNodeIds);
          }
        }
      }
    } else if (lineInProgress) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Check if we're hovering over a connection point
        const connectionPointData = findNearbyConnectionPoint(x, y);
        
        // Update the hovered connection point state
        if (JSON.stringify(connectionPointData) !== JSON.stringify(hoveredConnectionPoint)) {
          setHoveredConnectionPoint(connectionPointData);
        }
        
        // If we're hovering over a connection point, snap the line to it
        if (connectionPointData) {
          // Use the unified helper function to temporarily connect the line to the connection point
          // We don't create a permanent connection yet since the user hasn't released the mouse
          
          // Get the connection point position without creating a connection
          const { nodeId, position } = connectionPointData;
          const node = displayNodes?.find(n => n.id === nodeId);
          
          if (node) {
            // calculateConnectionPointPosition will return a position and consider if a marker is present to adjust
            // for an offset to accomodate the marker.
            const connectionPoint = calculateConnectionPointPosition(node, position, true, lineInProgress || undefined, 'end');
            // Pass false for isShiftPressed to ensure we don't apply angle constraints
            updateLineDraw(connectionPoint.x, connectionPoint.y, false);
          }
          return;
        }
        
        // Otherwise, just update the line normally
        updateLineDraw(x, y, isShiftPressed);
      }
    } else {
      // Check for nearby connection points when the line tool is active, even before starting to draw
      if (['line', 'arrow'].includes(activeTool)) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left - transform.x) / transform.zoom;
          const y = (e.clientY - rect.top - transform.y) / transform.zoom;
          
          // Check for nearby connection points
          const nearbyConnectionPoint = findNearbyConnectionPoint(x, y);
          
          // Update the hovered connection point state
          if (JSON.stringify(nearbyConnectionPoint) !== JSON.stringify(hoveredConnectionPoint)) {
            setHoveredConnectionPoint(nearbyConnectionPoint);
          }
        }
      } else {
        // Reset hovered connection point when not using line tool or drawing a line
        if (hoveredConnectionPoint !== null) {
          setHoveredConnectionPoint(null);
        }
      }
    }
  };
  
  // Handle mouse up for ending panning, node movement, or selection box
  const handleMouseUp = (e: React.MouseEvent) => {
    // If we were dragging a point and it's a line endpoint
    if (isDraggingPoint && activePointData && selectedLineEndpoint) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Check if we're dropping on a connection point
        // First check if we already have a hovered connection point, then try to find one at the current position,
        // and finally check for nearby connection points with a larger radius
        const connectionPointData = findNearbyConnectionPoint(x, y);
        
        if (connectionPointData) {
          // Use the unified helper function to connect the line endpoint to the connection point
          connectLineToPoint(
            selectedLineEndpoint.nodeId,
            selectedLineEndpoint.pointIndex,
            connectionPointData
          );
        }
      }
    }
    
    // If we were drawing a line, finalize it
    if (lineInProgress && isDrawingLine) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // First check if we already have a hovered connection point, then try to find one at the current position,
        // and finally check for nearby connection points with a larger radius
        const connectionPointData = findNearbyConnectionPoint(x, y);

        if (connectionPointData) {
          // Use the unified helper function to connect the line endpoint to the connection point
          const pointIndex = 1; // if we are mouseUp while LineInProgress, we are connecting the second point - the end point
          
          connectLineToPoint(
            lineInProgress.id,
            pointIndex,
            connectionPointData
          );
        }
        
        setIsDrawingLine(false);
        // Important: Only finish the line draw AFTER we've completed any connection
        finishLineDraw();
      }
    }
    
    // Reset states
    setIsDragging(false);
    setIsDraggingPoint(false);
    setIsMovingNode(false);
    setActiveNodeId(null);
    setActivePointData(null);
    // Clear the hovered connection point when mouse up
    setHoveredConnectionPoint(null);
    
    // If we were selecting, finalize the selection
    if (isSelecting && selectionBox) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        setSelectionBox({
          ...selectionBox,
          end: { x, y }
        });
        
        if (displayNodes) {
          const nodesInBox = displayNodes
            .filter(node => isNodeInSelectionBox(node, { ...selectionBox, end: { x, y } }));
          
          if (e.shiftKey) {
            // With shift, add these nodes to the current selection
            const currentSelectedIds = displayNodes
              .filter(node => node.selected)
              .map(node => node.id);
              
            const newSelectedIds = nodesInBox
              .filter(node => !node.selected)
              .map(node => node.id);
              
            selectMultipleNodes([...currentSelectedIds, ...newSelectedIds]);
          } else {
            // Without shift, select only the nodes in the box
            const selectedNodeIds = nodesInBox.map(node => node.id);
            selectMultipleNodes(selectedNodeIds);
          }
        }
      }
    }
    
    setSelectedLineEndpoint(null);
    setIsDragging(false);
    setIsMovingNode(false);
    setIsSelecting(false);
    setSelectionBox(null);
    setNodeStartPos({});
    setIsDraggingPoint(false);
    setActivePointData(null);
    
    // Clear alignment guides
    setAlignmentGuides({ 
      horizontal: [], 
      vertical: [] 
    });
  };
  
  // Handle double click to finish line drawing
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (lineInProgress && !isDrawingLine) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        updateLineDraw(x, y, isShiftPressed);
        finishLineDraw();
      } else {
        finishLineDraw();
      }
      
      e.stopPropagation();
    } else {
      // Add text node on double click when no line is in progress
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Apply grid snapping if enabled
        const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
        const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
        
        // Check if we clicked on an existing node
        const clickedNode = findNodeAtPosition(x, y, displayNodes, transform);
        
        // Only create a text node if we didn't click on an existing node
        if (!clickedNode && !presentationMode) {
          // Create a new text node at the clicked position
          const newNode = createShapeAtPosition('text', snappedX, snappedY);
          
          // Select the new node
          selectNode(newNode.id);
        }
      }
    }
  };
  
  // Handle resizing of nodes
  const handleResizeNode = (nodeId: string, direction: ResizeHandleDirection, dx: number, dy: number) => {
    const node = displayNodes?.find(n => n.id === nodeId);
    if (!node || !node.dimensions) return;
    
    const adjustedDx = dx / transform.zoom;
    const adjustedDy = dy / transform.zoom;
    
    let newWidth = node.dimensions.width;
    let newHeight = node.dimensions.height;
    let newX = node.position.x;
    let newY = node.position.y;
    
    switch (direction) {
      case 'e':
        newWidth = Math.max(10, node.dimensions.width + adjustedDx);
        break;
      case 'w':
        newWidth = Math.max(10, node.dimensions.width - adjustedDx);
        newX = node.position.x + adjustedDx;
        break;
      case 's':
        newHeight = Math.max(10, node.dimensions.height + adjustedDy);
        break;
      case 'n':
        newHeight = Math.max(10, node.dimensions.height - adjustedDy);
        newY = node.position.y + adjustedDy;
        break;
      case 'ne':
        newWidth = Math.max(10, node.dimensions.width + adjustedDx);
        newHeight = Math.max(10, node.dimensions.height - adjustedDy);
        newY = node.position.y + adjustedDy;
        break;
      case 'nw':
        newWidth = Math.max(10, node.dimensions.width - adjustedDx);
        newHeight = Math.max(10, node.dimensions.height - adjustedDy);
        newX = node.position.x + adjustedDx;
        newY = node.position.y + adjustedDy;
        break;
      case 'se':
        newWidth = Math.max(10, node.dimensions.width + adjustedDx);
        newHeight = Math.max(10, node.dimensions.height + adjustedDy);
        break;
      case 'sw':
        newWidth = Math.max(10, node.dimensions.width - adjustedDx);
        newHeight = Math.max(10, node.dimensions.height + adjustedDy);
        newX = node.position.x + adjustedDx;
        break;
    }
    
    if (snapToGrid) {
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // For icon shapes, maintain a square aspect ratio
    const isIconShape = node.type === 'icon' || (node.data?.isIcon === true);
    if (isIconShape) {
      // Use the larger dimension to ensure the icon stays square
      // and doesn't get too small when resizing
      const maxDimension = Math.max(newWidth, newHeight);
      
      // Adjust position based on which corner is being dragged
      switch (direction) {
        case 'nw':
          newX = node.position.x + node.dimensions.width - maxDimension;
          newY = node.position.y + node.dimensions.height - maxDimension;
          break;
        case 'ne':
          newY = node.position.y + node.dimensions.height - maxDimension;
          break;
        case 'sw':
          newX = node.position.x + node.dimensions.width - maxDimension;
          break;
        // SE corner doesn't need position adjustment
      }
      
      // Set both dimensions to the same value
      newWidth = maxDimension;
      newHeight = maxDimension;
    }
    
    const isGroup = node.data?.isGroup === true;
    
    if (isGroup && displayNodes) {
      const childNodes = displayNodes.filter(n => n.parentId === nodeId);
      const widthRatio = newWidth / node.dimensions.width;
      const heightRatio = newHeight / node.dimensions.height;
      
      childNodes.forEach(childNode => {
        if (!childNode.dimensions) return;
        
        const newChildX = childNode.position.x * widthRatio;
        const newChildY = childNode.position.y * heightRatio;
        const newChildWidth = childNode.dimensions.width * widthRatio;
        const newChildHeight = childNode.dimensions.height * heightRatio;
        
        updateNodePosition(childNode.id, newChildX, newChildY);
        updateNodeDimensions(childNode.id, newChildWidth, newChildHeight);
      });
    }
    
    updateNodePosition(nodeId, newX, newY);
    updateNodeDimensions(nodeId, newWidth, newHeight);
  };
  
  // Handle connection point click
  const handleConnectionPointClick = (nodeId: string, position: ConnectionPointPosition) => {
    // Make sure we're using the line or arrow tool
    if (!['line', 'arrow'].includes(activeTool)) {
      return;
    }
    
    try {
      // Find the node to get its actual position
      const node = displayNodes?.find(n => n.id === nodeId);
      if (!node) return;
      
      // Calculate the exact connection point position using our utility
      // calculateConnectionPointPosition will return a position and consider if a marker is present to adjust
      // for an offset to accomodate the marker.  

      if (lineInProgress) {
        // TODO: Is this needed?  How can we click on a connection point and not have a line in progress?
        // What circumstance can we click on a connection point and have a line in progress?

        // If we already have a line in progress, finish it at this connection point
        // Use the unified helper function to connect the line endpoint to the connection point
        const pointIndex = lineInProgress.points ? lineInProgress.points.length - 1 : 1;
        
        // Get marker information from line in progress - we create the connection directly without using this marker info
        const lineData = lineInProgress.data || {};
        console.log('Connecting line with markers:', lineData.startMarker, lineData.endMarker);
        
        createConnection({
          sourceNodeId: lineInProgress.id,   
          sourcePointIndex: pointIndex,     
          targetNodeId: nodeId,     
          targetPosition: position   
        });
      
        // Important: Only finish the line draw AFTER we've established the connection
        finishLineDraw();
      } else {
        // Start a new line from this connection point - use startMarker and endMarker from the store state
        // that's already available in the component scope
        const connectionPoint = calculateConnectionPointPosition(
          node, 
          position, 
          true, 
          undefined, 
          'start', 
          startMarker,
          endMarker
        );
      
        startLineDraw(connectionPoint.x, connectionPoint.y, activeTool as 'line' | 'arrow');
        setIsDrawingLine(true);
        
        // Store the connection information for the start point
        const lineId = useCanvasStore.getState().lineInProgress?.id;
        if (lineId) {
          createConnection({
            sourceNodeId: lineId,     
            sourcePointIndex: 0,     
            targetNodeId: nodeId,     
            targetPosition: position   
          });
        }
      }
    } catch (error) {
      console.error('Error handling connection point click:', error);
    }
  };
  
  // Update nodes in parent component when they change
  useEffect(() => {
    const storeNodes = useCanvasStore.getState().nodes;
    if (onNodesChange && storeNodes) {
      onNodesChange(storeNodes);
    }
  }, [onNodesChange]);
  
  // Add a useEffect to update the selectedLineEndpoint when selectedPointIndices changes
  useEffect(() => {
    // If there are selected points, check if any of them are endpoints
    if (selectedPointIndices && selectedPointIndices.length > 0) {
      // Get the first selected point index
      const pointIndex = selectedPointIndices[0];
      
      // Find the selected node (the one that has the selected point)
      const node = displayNodes?.find(n => n.selected && n.points);
      
      if (node && node.points) {
        // Check if this is an endpoint (first or last point)
        const isEndpoint = pointIndex === 0 || pointIndex === node.points.length - 1;
        
        if (isEndpoint) {
          setSelectedLineEndpoint({ nodeId: node.id, pointIndex });
          
          // Check if there's an existing connection for this endpoint
          const existingConnection = useCanvasStore.getState().connections.find(
            conn => conn.lineId === node.id && conn.pointIndex === pointIndex
          );
          
          // If there's an existing connection, show it as hovered
          if (existingConnection) {
            setHoveredConnectionPoint({
              nodeId: existingConnection.shapeId,
              position: existingConnection.position
            });
          }
          
          return;
        }
      }
    }
    
    // If no endpoints are selected, reset the state
    setSelectedLineEndpoint(null);
    setHoveredConnectionPoint(null);
  }, [selectedPointIndices, displayNodes]);
  
  // Helper function to find a nearby connection point with a larger radius
  // this is used when hovering over shape to show the connection points for users to click on
  const findNearbyConnectionPoint = (x: number, y: number): { nodeId: string; position: ConnectionPointPosition } | null => {
    // Get all nodes that can have connection points (exclude the line in progress and groups)
    const nodesWithConnectionPoints = displayNodes?.filter(node => {
      // Skip the node if:
      // 1. It's a line (has points)
      // 2. It's a group
      // 3. It's the current line in progress
      // 4. It's the line we're currently dragging an endpoint of
      const isCurrentLine = lineInProgress && node.id === lineInProgress.id;
      const isDraggedLine = selectedLineEndpoint && node.id === selectedLineEndpoint.nodeId;
      
      return !node.points && !node.data?.isGroup && !isCurrentLine && !isDraggedLine;
    }) || [];
    
    // Use a larger radius for nearby detection
    const nearbyRadius = 50; // Increased from 40 to 50 for better detection
    
    // First check if there's a currently hovered connection point
    if (hoveredConnectionPoint) {
      const node = displayNodes?.find(n => n.id === hoveredConnectionPoint.nodeId);
      if (node) {
        // Get marker information if we have a selected line
        let startOrEnd: 'start' | 'end' | undefined = undefined;
        let startMarker: MarkerShape | undefined = undefined;
        let endMarker: MarkerShape | undefined = undefined;
        
        // If we have a selected line with an endpoint, get marker info
        if (selectedLineEndpoint) {
          const lineNode = displayNodes?.find(n => n.id === selectedLineEndpoint.nodeId);
          
          if (lineNode) {
            // Determine if this is a start or end point
            const { pointIndex } = selectedLineEndpoint;
            
            if (lineNode.points && (pointIndex === 0 || pointIndex === lineNode.points.length - 1)) {
              startOrEnd = pointIndex === 0 ? 'start' : 'end';
              
              // Get marker info from line data
              const lineData = lineNode.data || {};
              startMarker = lineData.startMarker as MarkerShape || 'none';
              endMarker = lineData.endMarker as MarkerShape || 'none';
            }
          }
        } else if (lineInProgress) {
          // If we're drawing a new line, use its marker settings
          const lineData = lineInProgress.data || {};
          startOrEnd = 'end'; // Always end for a line in progress
          startMarker = lineData.startMarker as MarkerShape || 'none';
          endMarker = lineData.endMarker as MarkerShape || 'none';
        }
        
        const connectionPoint = calculateConnectionPointPosition(
          node, 
          hoveredConnectionPoint.position, 
          true, 
          undefined, 
          startOrEnd, 
          startMarker, 
          endMarker
        );
        
        const distance = Math.sqrt(
          Math.pow(x - connectionPoint.x, 2) + 
          Math.pow(y - connectionPoint.y, 2)
        );
        
        // If we're still reasonably close to the hovered point, prioritize it
        if (distance <= nearbyRadius * 1.5) {
          return hoveredConnectionPoint;
        }
      }
    }
    
    // Check each node for connection points
    let closestPoint: { nodeId: string; position: ConnectionPointPosition; distance: number } | null = null;
    let minDistance = nearbyRadius;
    
    // Get marker information if we have a selected line
    let startOrEnd: 'start' | 'end' | undefined = undefined;
    let startMarker: MarkerShape | undefined = undefined;
    let endMarker: MarkerShape | undefined = undefined;
    
    // If we have a selected line with an endpoint, get marker info
    if (selectedLineEndpoint) {
      const lineNode = displayNodes?.find(n => n.id === selectedLineEndpoint.nodeId);
      
      if (lineNode) {
        // Determine if this is a start or end point
        const { pointIndex } = selectedLineEndpoint;
        
        if (lineNode.points && (pointIndex === 0 || pointIndex === lineNode.points.length - 1)) {
          startOrEnd = pointIndex === 0 ? 'start' : 'end';
          
          // Get marker info from line data
          const lineData = lineNode.data || {};
          startMarker = lineData.startMarker as MarkerShape || 'none';
          endMarker = lineData.endMarker as MarkerShape || 'none';
        }
      }
    } else if (lineInProgress) {
      // If we're drawing a new line, use its marker settings
      const lineData = lineInProgress.data || {};
      startOrEnd = 'end'; // Always end for a line in progress
      startMarker = lineData.startMarker as MarkerShape || 'none';
      endMarker = lineData.endMarker as MarkerShape || 'none';
    }
    
    for (const node of nodesWithConnectionPoints) {
      if (!node.dimensions) continue;
      
      // Check each possible connection point position
      const connectionPositions: ConnectionPointPosition[] = ['n', 's', 'e', 'w'];
      
      for (const position of connectionPositions) {
        // Calculate the connection point position with marker information
        const connectionPoint = calculateConnectionPointPosition(
          node, 
          position, 
          true, 
          undefined, 
          startOrEnd, 
          startMarker, 
          endMarker
        );
        
        // Calculate distance from mouse to connection point
        const distance = Math.sqrt(
          Math.pow(x - connectionPoint.x, 2) + 
          Math.pow(y - connectionPoint.y, 2)
        );
        
        // If mouse is close enough to the connection point and it's closer than any previous point
        if (distance <= nearbyRadius && distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            nodeId: node.id,
            position,
            distance
          };
        }
      }
    }
    
    return closestPoint;
  };
  
  // Helper function to connect a line endpoint to a connection point
  // This unifies the logic for both new lines and existing lines
  const connectLineToPoint = (
    lineId: string,
    pointIndex: number,
    connectionPointData: { nodeId: string; position: ConnectionPointPosition }
  ) => {
    const { nodeId, position } = connectionPointData;
    
    // First, check if this is a line in progress
    let lineNode = null;
    
    if (lineInProgress && lineId === lineInProgress.id) {
      // If it's a line in progress, use that directly
      lineNode = lineInProgress;
    } else {
      // Otherwise, look for it in displayNodes
      lineNode = displayNodes?.find(n => n.id === lineId);
    }
    
    const node = displayNodes?.find(n => n.id === nodeId);
    
    if (!node || !lineNode) {
      console.error('Failed to find nodes for connection:', { 
        nodeId, 
        lineId, 
        node: !!node, 
        lineNode: !!lineNode 
      });
      return;
    }

    const startOrEnd = pointIndex === 0 ? 'start' : 'end';

    // Extract marker information from the line node
    const startMarker = lineNode.data?.startMarker as MarkerShape || 'none';
    const endMarker = lineNode.data?.endMarker as MarkerShape || 'none';

    // Calculate the exact connection point position, passing marker information directly
    const connectionPoint = calculateConnectionPointPosition(
      node, 
      position, 
      true, 
      lineNode, 
      startOrEnd,
      startMarker,
      endMarker
    );
    
    // Create the connection in the store
    createConnection({
      sourceNodeId: lineId,
      sourcePointIndex: pointIndex,
      targetNodeId: nodeId,
      targetPosition: position
    });
    
    // If this is a line in progress (new line being drawn)
    if (lineInProgress && lineId === lineInProgress.id) {
      // Update the line to end at this connection point
      // Pass false for isShiftPressed to ensure we don't apply angle constraints
      updateLineDraw(connectionPoint.x, connectionPoint.y, false);
    } else {
      // This is an existing line, move the point directly
      moveLinePoint(
        lineId,
        pointIndex,
        connectionPoint.x,
        connectionPoint.y
      );
    }
  };
  
  // Function to find alignment guides with other shapes - optimized with useMemo
  // move this to node-utils.ts
  // const findAlignmentGuides = (
  //   movingNodes: Node[],
  //   allNodes: Node[],
  //   dx: number,
  //   dy: number
  // ) => {
  //   const horizontalGuides: { y: number, start: number, end: number, type: 'top' | 'bottom' | 'center' }[] = [];
  //   const verticalGuides: { x: number, start: number, end: number, type: 'left' | 'right' | 'center' }[] = [];
    
  //   // Get the bounding boxes of the moving nodes with the proposed movement applied
  //   const movingBoxes = movingNodes.map(node => {
  //     if (!node.dimensions) return null;
      
  //     const startPos = nodeStartPos[node.id] || { x: node.position.x, y: node.position.y };
  //     const newX = startPos.x + dx;
  //     const newY = startPos.y + dy;
  //     const width = node.dimensions.width;
  //     const height = node.dimensions.height;
      
  //     return {
  //       id: node.id,
  //       left: newX,
  //       top: newY,
  //       right: newX + width,
  //       bottom: newY + height,
  //       centerX: newX + width / 2,
  //       centerY: newY + height / 2
  //     };
  //   }).filter(Boolean) as {
  //     id: string;
  //     left: number;
  //     top: number;
  //     right: number;
  //     bottom: number;
  //     centerX: number;
  //     centerY: number;
  //   }[];
    
  //   // Skip if no moving boxes with dimensions
  //   if (movingBoxes.length === 0) return { horizontal: [], vertical: [] };
    
  //   // Get the bounding boxes of the static nodes (not being moved)
  //   const staticBoxes = allNodes
  //     .filter(node => !node.selected && node.dimensions && !['line', 'arrow'].includes(node.type))
  //     .map(node => {
  //       const x = node.position.x;
  //       const y = node.position.y;
  //       const width = node.dimensions!.width;
  //       const height = node.dimensions!.height;
        
  //       return {
  //         id: node.id,
  //         left: x,
  //         top: y,
  //         right: x + width,
  //         bottom: y + height,
  //         centerX: x + width / 2,
  //         centerY: y + height / 2
  //       };
  //     });
    
  //   // Skip if no static boxes to align with
  //   if (staticBoxes.length === 0) return { horizontal: [], vertical: [] };
    
  //   // Helper function to add a horizontal guide if it doesn't exist yet
  //   const addHorizontalGuide = (y: number, movingBox: {
  //     id: string;
  //     left: number;
  //     top: number;
  //     right: number;
  //     bottom: number;
  //     centerX: number;
  //     centerY: number;
  //   }, alignmentType: string) => {
  //     // Check if a similar guide already exists (within 1 pixel)
  //     const existingGuide = horizontalGuides.find(g => Math.abs(g.y - y) < 1);
      
  //     if (existingGuide) {
  //       // Extend the existing guide if needed
  //       existingGuide.start = Math.min(existingGuide.start, movingBox.left - EXTENSION_AMOUNT);
  //       existingGuide.end = Math.max(existingGuide.end, movingBox.right + EXTENSION_AMOUNT);
  //       // If this is a center guide, mark it as such
  //       if (alignmentType === 'center') {
  //         existingGuide.type = 'center';
  //       }
  //     } else {
  //       // Add a new guide
  //       horizontalGuides.push({
  //         y,
  //         start: movingBox.left - EXTENSION_AMOUNT,
  //         end: movingBox.right + EXTENSION_AMOUNT,
  //         type: alignmentType as 'top' | 'bottom' | 'center'
  //       });
  //     }
  //   };
    
  //   // Helper function to add a vertical guide if it doesn't exist yet
  //   const addVerticalGuide = (x: number, movingBox: {
  //     id: string;
  //     left: number;
  //     top: number;
  //     right: number;
  //     bottom: number;
  //     centerX: number;
  //     centerY: number;
  //   }, alignmentType: string) => {
  //     // Check if a similar guide already exists (within 1 pixel)
  //     const existingGuide = verticalGuides.find(g => Math.abs(g.x - x) < 1);
      
  //     if (existingGuide) {
  //       // Extend the existing guide if needed
  //       existingGuide.start = Math.min(existingGuide.start, movingBox.top - EXTENSION_AMOUNT);
  //       existingGuide.end = Math.max(existingGuide.end, movingBox.bottom + EXTENSION_AMOUNT);
  //       // If this is a center guide, mark it as such
  //       if (alignmentType === 'center') {
  //         existingGuide.type = 'center';
  //       }
  //     } else {
  //       // Add a new guide
  //       verticalGuides.push({
  //         x,
  //         start: movingBox.top - EXTENSION_AMOUNT,
  //         end: movingBox.bottom + EXTENSION_AMOUNT,
  //         type: alignmentType as 'left' | 'right' | 'center'
  //       });
  //     }
  //   };
    
  //   // Track which nodes have center alignment
  //   const nodesWithCenterYAlignment = new Set<string>();
  //   const nodesWithCenterXAlignment = new Set<string>();
    
  //   // First pass: check for center alignments
  //   for (const movingBox of movingBoxes) {
  //     for (const staticBox of staticBoxes) {
  //       // Check for center alignment (horizontal)
  //       if (Math.abs(movingBox.centerY - staticBox.centerY) < ALIGNMENT_THRESHOLD) {
  //         addHorizontalGuide(staticBox.centerY, movingBox, 'center');
  //         nodesWithCenterYAlignment.add(movingBox.id);
  //       }
        
  //       // Check for center alignment (vertical)
  //       if (Math.abs(movingBox.centerX - staticBox.centerX) < ALIGNMENT_THRESHOLD) {
  //         addVerticalGuide(staticBox.centerX, movingBox, 'center');
  //         nodesWithCenterXAlignment.add(movingBox.id);
  //       }
  //     }
  //   }
    
  //   // Second pass: check for edge alignments, but only for nodes that don't have center alignment
  //   for (const movingBox of movingBoxes) {
  //     // Skip edge alignment checks if this node has center alignment
  //     const hasCenterYAlignment = nodesWithCenterYAlignment.has(movingBox.id);
  //     const hasCenterXAlignment = nodesWithCenterXAlignment.has(movingBox.id);
      
  //     for (const staticBox of staticBoxes) {
  //       // Check for horizontal alignments (top, bottom) only if no center alignment
  //       if (!hasCenterYAlignment) {
  //         // Top edge alignment
  //         if (Math.abs(movingBox.top - staticBox.top) < ALIGNMENT_THRESHOLD) {
  //           addHorizontalGuide(staticBox.top, movingBox, 'top');
  //         }
          
  //         // Bottom edge alignment
  //         if (Math.abs(movingBox.bottom - staticBox.bottom) < ALIGNMENT_THRESHOLD) {
  //           addHorizontalGuide(staticBox.bottom, movingBox, 'bottom');
  //         }
          
  //         // Top to bottom alignment
  //         if (Math.abs(movingBox.top - staticBox.bottom) < ALIGNMENT_THRESHOLD) {
  //           addHorizontalGuide(staticBox.bottom, movingBox, 'bottom');
  //         }
          
  //         // Bottom to top alignment
  //         if (Math.abs(movingBox.bottom - staticBox.top) < ALIGNMENT_THRESHOLD) {
  //           addHorizontalGuide(staticBox.top, movingBox, 'top');
  //         }
  //       }
        
  //       // Check for vertical alignments (left, right) only if no center alignment
  //       if (!hasCenterXAlignment) {
  //         // Left edge alignment
  //         if (Math.abs(movingBox.left - staticBox.left) < ALIGNMENT_THRESHOLD) {
  //           addVerticalGuide(staticBox.left, movingBox, 'left');
  //         }
          
  //         // Right edge alignment
  //         if (Math.abs(movingBox.right - staticBox.right) < ALIGNMENT_THRESHOLD) {
  //           addVerticalGuide(staticBox.right, movingBox, 'right');
  //         }
          
  //         // Left to right alignment
  //         if (Math.abs(movingBox.left - staticBox.right) < ALIGNMENT_THRESHOLD) {
  //           addVerticalGuide(staticBox.right, movingBox, 'right');
  //         }
          
  //         // Right to left alignment
  //         if (Math.abs(movingBox.right - staticBox.left) < ALIGNMENT_THRESHOLD) {
  //           addVerticalGuide(staticBox.left, movingBox, 'left');
  //         }
  //       }
  //     }
  //   }
    
  //   // Return only the type property from guides for backward compatibility
  //   return { 
  //     horizontal: horizontalGuides.map(({y, start, end}) => ({y, start, end})), 
  //     vertical: verticalGuides.map(({x, start, end}) => ({x, start, end}))
  //   };
  // };
  
  // Function to calculate adjusted position based on alignment guides - optimized
  // move this to node-utils.ts
  // const getSnappedPosition = (
  //   node: Node,
  //   dx: number,
  //   dy: number,
  //   guides: {
  //     horizontal: { y: number, start: number, end: number }[];
  //     vertical: { x: number, start: number, end: number }[];
  //   }
  // ) => {
  //   if (!node.dimensions) return { x: dx, y: dy };
    
  //   const startPos = nodeStartPos[node.id] || { x: node.position.x, y: node.position.y };
  //   let adjustedDx = dx;
  //   let adjustedDy = dy;
    
  //   // Calculate the box with the proposed movement
  //   const width = node.dimensions.width;
  //   const height = node.dimensions.height;
  //   const box = {
  //     left: startPos.x + dx,
  //     top: startPos.y + dy,
  //     right: startPos.x + dx + width,
  //     bottom: startPos.y + dy + height,
  //     centerX: startPos.x + dx + width / 2,
  //     centerY: startPos.y + dy + height / 2
  //   };
    
  //   // Find the closest horizontal guide to snap to
  //   let closestHorizontalDist = ALIGNMENT_THRESHOLD;
  //   let closestHorizontalSnap = null;
    
  //   for (const guide of guides.horizontal) {
  //     // Top edge alignment
  //     const topDist = Math.abs(box.top - guide.y);
  //     if (topDist < closestHorizontalDist) {
  //       closestHorizontalDist = topDist;
  //       closestHorizontalSnap = { edge: 'top', y: guide.y };
  //     }
      
  //     // Bottom edge alignment
  //     const bottomDist = Math.abs(box.bottom - guide.y);
  //     if (bottomDist < closestHorizontalDist) {
  //       closestHorizontalDist = bottomDist;
  //       closestHorizontalSnap = { edge: 'bottom', y: guide.y };
  //     }
      
  //     // Center alignment (horizontal)
  //     const centerYDist = Math.abs(box.centerY - guide.y);
  //     if (centerYDist < closestHorizontalDist) {
  //       closestHorizontalDist = centerYDist;
  //       closestHorizontalSnap = { edge: 'centerY', y: guide.y };
  //     }
  //   }
    
  //   // Apply the closest horizontal snap if found
  //   if (closestHorizontalSnap) {
  //     if (closestHorizontalSnap.edge === 'top') {
  //       adjustedDy = closestHorizontalSnap.y - startPos.y;
  //     } else if (closestHorizontalSnap.edge === 'bottom') {
  //       adjustedDy = closestHorizontalSnap.y - height - startPos.y;
  //     } else if (closestHorizontalSnap.edge === 'centerY') {
  //       adjustedDy = closestHorizontalSnap.y - height / 2 - startPos.y;
  //     }
  //   }
    
  //   // Find the closest vertical guide to snap to
  //   let closestVerticalDist = ALIGNMENT_THRESHOLD;
  //   let closestVerticalSnap = null;
    
  //   for (const guide of guides.vertical) {
  //     // Left edge alignment
  //     const leftDist = Math.abs(box.left - guide.x);
  //     if (leftDist < closestVerticalDist) {
  //       closestVerticalDist = leftDist;
  //       closestVerticalSnap = { edge: 'left', x: guide.x };
  //     }
      
  //     // Right edge alignment
  //     const rightDist = Math.abs(box.right - guide.x);
  //     if (rightDist < closestVerticalDist) {
  //       closestVerticalDist = rightDist;
  //       closestVerticalSnap = { edge: 'right', x: guide.x };
  //     }
      
  //     // Center alignment (vertical)
  //     const centerXDist = Math.abs(box.centerX - guide.x);
  //     if (centerXDist < closestVerticalDist) {
  //       closestVerticalDist = centerXDist;
  //       closestVerticalSnap = { edge: 'centerX', x: guide.x };
  //     }
  //   }
    
  //   // Apply the closest vertical snap if found
  //   if (closestVerticalSnap) {
  //     if (closestVerticalSnap.edge === 'left') {
  //       adjustedDx = closestVerticalSnap.x - startPos.x;
  //     } else if (closestVerticalSnap.edge === 'right') {
  //       adjustedDx = closestVerticalSnap.x - width - startPos.x;
  //     } else if (closestVerticalSnap.edge === 'centerX') {
  //       adjustedDx = closestVerticalSnap.x - width / 2 - startPos.x;
  //     }
  //   }
    
  //   return { x: adjustedDx, y: adjustedDy };
  // };
  
  // Handle text change
  
  
  const handleTextChange = (nodeId: string, text: string) => {
    const updatedNodes = useCanvasStore.getState().nodes.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, text, isNew: false } } : node
    );
    useCanvasStore.setState(state => {
      state.nodes = updatedNodes;
      return state;
    });
    useCanvasStore.getState().pushToHistory();
    if (onNodesChange) onNodesChange(updatedNodes);
  };
  
  // Add handler for empty text shapes
  const handleEmptyTextShape = (nodeId: string) => {
    // Filter out the empty text node
    const updatedNodes = useCanvasStore.getState().nodes.filter(node => node.id !== nodeId);
    useCanvasStore.setState(state => {
      state.nodes = updatedNodes;
      return state;
    });
    useCanvasStore.getState().pushToHistory();
    if (onNodesChange) onNodesChange(updatedNodes);
  };
  
  // Handle paste event for JSON data
  const handlePaste = (e: React.ClipboardEvent) => {
    // If we're in presentation mode, don't allow pasting
    if (presentationMode) return;
    
    // Check if we're editing text (input or textarea)
    const target = e.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;
    
    // If we're editing text, let the default paste behavior happen
    if (isEditingText) return;
    
    // Get clipboard data as text
    const clipboardText = e.clipboardData.getData('text');
    
    try {
      // Try to parse the clipboard text as JSON
      const jsonData = JSON.parse(clipboardText);
      
      // Validate the JSON data
      if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.nodes)) {
        // Not valid canvas JSON data, ignore
        return;
      }
      
      // Check if nodes have required properties
      for (const node of jsonData.nodes) {
        if (!node.id || !node.type || !node.position) {
          // Invalid node data, ignore
          return;
        }
      }
      
      // Get current store state to save to history
      useCanvasStore.getState().pushToHistory();
      
      // Generate new IDs for the pasted nodes to avoid conflicts
      const idMap = new Map<string, string>();
      const newNodes = jsonData.nodes.map((node: Node) => {
        const newId = `${node.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        idMap.set(node.id, newId);
        
        // Create a new node with a new ID
        return {
          ...node,
          id: newId,
          // Offset the position slightly to make it clear it's a new node
          position: {
            x: node.position.x + 20,
            y: node.position.y + 20
          },
          // Make sure the node is selected
          selected: true
        };
      });
      
      // Update connections to use the new IDs
      const newConnections = jsonData.connections && Array.isArray(jsonData.connections) 
        ? jsonData.connections.map((conn: { lineId: string; shapeId: string }) => {
            // Skip connections that reference nodes not in the paste data
            if (!idMap.has(conn.lineId) || !idMap.has(conn.shapeId)) {
              return null;
            }
            
            return {
              ...conn,
              lineId: idMap.get(conn.lineId) || conn.lineId,
              shapeId: idMap.get(conn.shapeId) || conn.shapeId
            };
          }).filter(Boolean)
        : [];
      
      // Add the new nodes and connections to the canvas
      useCanvasStore.setState(state => {
        // Deselect all existing nodes
        state.nodes.forEach(node => {
          node.selected = false;
        });
        
        // Add the new nodes to the existing ones
        state.nodes = [...state.nodes, ...newNodes];
        
        // Add the new connections to the existing ones
        if (newConnections.length > 0) {
          state.connections = [...state.connections, ...newConnections];
        }
        
        return state;
      });
      
      // Prevent default paste behavior
      e.preventDefault();
      
      // Show success toast
      toast({
        title: "Import Successful",
        description: `Pasted ${newNodes.length} nodes to the canvas.`,
      });
    } catch {
      // Not JSON or other error, let default paste behavior happen
      return;
    }
  };
  
  // Add effect for wheel event (with passive: false option)
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    
    const wheelHandler = (e: WheelEvent) => {
      // Prevent default scrolling behavior
      e.preventDefault();
      
      // Check if we're in presentation mode
      if (presentationMode) return;
      
      // Get the delta values
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;

      // Check for Cmd/Ctrl key for zooming
      if (e.metaKey || e.ctrlKey) {
        // Get canvas rect
        const rect = canvasElement.getBoundingClientRect();
        if (!rect) return;
        
        // Calculate mouse position in canvas coordinates (before zoom change)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate position relative to the content (account for current transform)
        const contentX = (mouseX - transform.x) / transform.zoom;
        const contentY = (mouseY - transform.y) / transform.zoom;
        
        // Current zoom level
        const oldZoom = transform.zoom;
        
        // New zoom level based on scroll direction
        let newZoom;
        if (deltaY < 0) {
          // Zoom in - wheel up (limit to max zoom of 2.0)
          newZoom = Math.min(oldZoom + 0.1, 2.0);
        } else {
          // Zoom out - wheel down (limit to min zoom of 0.1)
          newZoom = Math.max(oldZoom - 0.1, 0.1);
        }
        
        // Calculate new transform to keep the point under the mouse fixed
        const newX = mouseX - contentX * newZoom;
        const newY = mouseY - contentY * newZoom;
        
        // Update the transform in one operation to avoid flickering
        useCanvasStore.setState(state => {
          state.transform = {
            x: newX,
            y: newY,
            zoom: newZoom
          };
        });
      } else {
        // Handle both horizontal and vertical panning
        // This supports the MX Master's thumb scroll wheel for horizontal panning
        if (deltaX !== 0) {
          // Horizontal panning - using the thumb wheel or Shift+scroll on other mice
          panCanvas(-deltaX, 0);
        }
        
        if (deltaY !== 0) {
          // Vertical panning with main wheel
          panCanvas(0, -deltaY);
        }
      }
    };
    
    // Add event listener with { passive: false } to allow preventDefault()
    canvasElement.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Cleanup function to remove event listener
    return () => {
      canvasElement.removeEventListener('wheel', wheelHandler);
    };
  }, [transform, presentationMode, panCanvas]);
  
  return (
    <div 
      ref={canvasRef}
      data-testid="canvas-container"
      className={`relative overflow-hidden bg-background ${className}`}
      style={{ 
        width: dimensions.width, 
        height: dimensions.height,
        cursor: activeTool === 'text' ? 'text' : 'default'  // Add cursor style for text tool
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onPaste={handlePaste}
      tabIndex={0} // Make the div focusable to receive keyboard events
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
      
      <div 
        className="absolute"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {displayNodes && displayNodes.map(node => (
          <ShapeRenderer
            key={node.id}
            node={node}
            isSelected={node.selected}
            activeTool={activeTool}
            onSelect={selectNode}
            onResize={handleResizeNode}
            onConnectionPointClick={handleConnectionPointClick}
            hoveredConnectionPoint={hoveredConnectionPoint}
            selectedLineEndpoint={selectedLineEndpoint}
            onTextChange={handleTextChange}
            onEmptyText={handleEmptyTextShape}
          />
        ))}
        
        {lineInProgress && (
          <LineInProgress 
            lineInProgress={lineInProgress}
          />
        )}
      </div>
      <IconSheet />
      <ExamplesSheet />
    </div>
  );
};

export default Canvas; 