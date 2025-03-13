'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, Node } from '../lib/store/canvas-store';
import ShapeRenderer from './shapes/ShapeRenderer';
import SelectionBox from './selection/SelectionBox';
import CanvasGrid from './grid/CanvasGrid';
import LineInProgress from './line-drawing/LineInProgress';
import { ConnectionPointPosition } from './ui/ConnectionPoints';
import { ResizeHandleDirection } from './ui/ResizeHandles';
import { calculateConnectionPointPosition, deepClone } from '../lib/utils/connection-utils';

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
    createConnection
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
  
  // Add a state to track the nodes from the store
  const [storeNodes, setStoreNodes] = useState<Node[]>([]);
  
  // Use the nodes from props or from the store
  const displayNodes = nodes.length > 0 ? nodes : storeNodes;
  
  // State for tracking the hovered connection point
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{ nodeId: string; position: ConnectionPointPosition } | null>(null);
  
  // Add a new state to track the selected line endpoint
  const [selectedLineEndpoint, setSelectedLineEndpoint] = useState<{
    nodeId: string;
    pointIndex: number;
  } | null>(null);
  
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
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      } else if (e.key === 'Escape') {
        if (lineInProgress) {
          cancelLineDraw();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPointIndices && selectedPointIndices.length > 0) {
          deleteSelectedPoints();
          e.preventDefault();
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
  }, [lineInProgress, cancelLineDraw, selectedPointIndices, deleteSelectedPoints]);
  
  // Add effect to deselect all nodes when line tool is selected
  useEffect(() => {
    if (['line', 'arrow'].includes(activeTool)) {
      deselectAllNodes();
    }
  }, [activeTool, deselectAllNodes]);
  
  // Helper function to check if a node is within the selection box
  const isNodeInSelectionBox = (node: Node, selectionBox: { start: { x: number, y: number }, end: { x: number, y: number } }) => {
    if (!node.dimensions) return false;
    
    const boxLeft = Math.min(selectionBox.start.x, selectionBox.end.x);
    const boxRight = Math.max(selectionBox.start.x, selectionBox.end.x);
    const boxTop = Math.min(selectionBox.start.y, selectionBox.end.y);
    const boxBottom = Math.max(selectionBox.start.y, selectionBox.end.y);
    
    // Special handling for line and arrow nodes
    if ((node.type === 'line' || node.type === 'arrow') && node.points && node.points.length > 1) {
      // Check if any segment of the line intersects with the selection box
      for (let i = 0; i < node.points.length - 1; i++) {
        const p1 = {
          x: node.position.x + node.points[i].x,
          y: node.position.y + node.points[i].y
        };
        const p2 = {
          x: node.position.x + node.points[i + 1].x,
          y: node.position.y + node.points[i + 1].y
        };
        
        // Check if either endpoint is inside the box
        const p1Inside = 
          p1.x >= boxLeft && p1.x <= boxRight && 
          p1.y >= boxTop && p1.y <= boxBottom;
        
        const p2Inside = 
          p2.x >= boxLeft && p2.x <= boxRight && 
          p2.y >= boxTop && p2.y <= boxBottom;
        
        // If either endpoint is inside, the segment intersects
        if (p1Inside || p2Inside) {
          return true;
        }
        
        // Check if the line segment intersects any of the four edges of the selection box
        // Line-line intersection check for all four edges of the selection box
        if (
          lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxLeft, boxTop, boxRight, boxTop) || // Top edge
          lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxLeft, boxBottom, boxRight, boxBottom) || // Bottom edge
          lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxLeft, boxTop, boxLeft, boxBottom) || // Left edge
          lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, boxRight, boxTop, boxRight, boxBottom)   // Right edge
        ) {
          return true;
        }
      }
      
      // No segments intersect
      return false;
    }
    
    // Regular bounding box check for other shapes
    const nodeLeft = node.position.x;
    const nodeRight = node.position.x + node.dimensions.width;
    const nodeTop = node.position.y;
    const nodeBottom = node.position.y + node.dimensions.height;
    
    return (
      nodeLeft < boxRight &&
      nodeRight > boxLeft &&
      nodeTop < boxBottom &&
      nodeBottom > boxTop
    );
  };
  
  // Helper function to check if two line segments intersect
  const lineSegmentsIntersect = (
    x1: number, y1: number, x2: number, y2: number, // First line segment
    x3: number, y3: number, x4: number, y4: number  // Second line segment
  ): boolean => {
    // Calculate the direction of the lines
    const d1x = x2 - x1;
    const d1y = y2 - y1;
    const d2x = x4 - x3;
    const d2y = y4 - y3;
    
    // Calculate the determinant
    const det = d1x * d2y - d1y * d2x;
    
    // If determinant is zero, lines are parallel
    if (det === 0) return false;
    
    // Calculate the parameters for the intersection point
    const s = ((x1 - x3) * d2y - (y1 - y3) * d2x) / det;
    const t = ((x1 - x3) * d1y - (y1 - y3) * d1x) / det;
    
    // Check if the intersection point is within both line segments
    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
  };
  
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
      
      for (let i = 0; i < node.points.length; i++) {
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
  
  // Helper function to find the closest line segment to a point
  const findClosestLineSegment = (
    x: number, 
    y: number
  ): { nodeId: string; segmentIndex: number; distance: number } | null => {
    const lineNodes = displayNodes?.filter(node => 
      node.points && 
      node.points.length > 1 &&
      (node.type === 'line' || node.type === 'arrow')
    ) || [];
    
    if (lineNodes.length === 0) return null;
    
    let closestSegment: { nodeId: string; segmentIndex: number; distance: number } | null = null;
    
    for (const node of lineNodes) {
      if (!node.points) continue;
      
      for (let i = 0; i < node.points.length - 1; i++) {
        const p1 = {
          x: node.position.x + node.points[i].x,
          y: node.position.y + node.points[i].y
        };
        const p2 = {
          x: node.position.x + node.points[i + 1].x,
          y: node.position.y + node.points[i + 1].y
        };
        
        const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
        
        if (closestSegment === null || distance < closestSegment.distance) {
          closestSegment = {
            nodeId: node.id,
            segmentIndex: i,
            distance
          };
        }
      }
    }
    
    return closestSegment && closestSegment.distance * transform.zoom <= 10 
      ? closestSegment 
      : null;
  };
  
  // Helper function to calculate distance from a point to a line segment
  const distanceToLineSegment = (
    x: number, y: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number => {
    const lengthSquared = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    
    if (lengthSquared === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
    
    const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
    
    const projectionX = x1 + t * (x2 - x1);
    const projectionY = y1 + t * (y2 - y1);
    
    return Math.sqrt((x - projectionX) * (x - projectionX) + (y - projectionY) * (y - projectionY));
  };
  
  // Helper function to find a node at a specific position
  const findNodeAtPosition = (x: number, y: number): Node | undefined => {
    if (!displayNodes) return undefined;
    
    // First check groups
    for (let i = displayNodes.length - 1; i >= 0; i--) {
      const node = displayNodes[i];
      const { position, dimensions } = node;
      
      if (node.data?.isGroup === true && dimensions) {
        if (
          x >= position.x && 
          x <= position.x + dimensions.width && 
          y >= position.y && 
          y <= position.y + dimensions.height
        ) {
          return node;
        }
      }
    }
    
    // Check for line segments first - use proximity detection instead of bounding box
    for (let i = displayNodes.length - 1; i >= 0; i--) {
      const node = displayNodes[i];
      
      // For lines and arrows, check if the click is close to any segment
      if ((node.type === 'line' || node.type === 'arrow') && node.points && node.points.length > 1) {
        // Check each segment of the line
        for (let j = 0; j < node.points.length - 1; j++) {
          const p1 = {
            x: node.position.x + node.points[j].x,
            y: node.position.y + node.points[j].y
          };
          const p2 = {
            x: node.position.x + node.points[j + 1].x,
            y: node.position.y + node.points[j + 1].y
          };
          
          // Calculate distance from click to this line segment
          const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
          
          // If click is close enough to the line segment (within 10px / zoom), return this node
          if (distance * transform.zoom <= 10) {
            return node;
          }
        }
      }
    }
    
    // Then check regular nodes using bounding box
    for (let i = displayNodes.length - 1; i >= 0; i--) {
      const node = displayNodes[i];
      const { position, dimensions, parentId } = node;
      
      // Skip lines (already checked above), groups, and nodes with parents
      if (parentId || node.data?.isGroup === true || node.type === 'line' || node.type === 'arrow') continue;
      
      if (!dimensions) continue;
      
      if (
        x >= position.x && 
        x <= position.x + dimensions.width && 
        y >= position.y && 
        y <= position.y + dimensions.height
      ) {
        return node;
      }
    }
    
    return undefined;
  };
  
  // Helper function to find a connection point at a position
  const findConnectionPointAtPosition = (x: number, y: number): { nodeId: string; position: ConnectionPointPosition } | null => {
    // Check for connection points if we're drawing a line OR dragging a line endpoint
    if (!((['line', 'arrow'].includes(activeTool) && lineInProgress) || 
          (isDraggingPoint && selectedLineEndpoint !== null))) {
      return null;
    }
    
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
    
    // Connection point size from ConnectionPoints component
    const handleSize = 10;
    // Increase the click radius significantly to make it easier to hit connection points
    const clickRadius = handleSize + 10; // Much larger radius for easier connection
    
    // Check each node for connection points
    for (const node of nodesWithConnectionPoints) {
      if (!node.dimensions) continue;
      
      // Check each possible connection point position
      const connectionPositions: ConnectionPointPosition[] = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
      
      for (const position of connectionPositions) {
        // Calculate the connection point position
        const connectionPoint = calculateConnectionPointPosition(node, position);
        
        // Calculate distance from mouse to connection point
        const distance = Math.sqrt(
          Math.pow(x - connectionPoint.x, 2) + 
          Math.pow(y - connectionPoint.y, 2)
        );
        
        // If mouse is close enough to the connection point, return it
        if (distance <= clickRadius) {
          return {
            nodeId: node.id,
            position
          };
        }
      }
    }
    
    return null;
  };
  
  // Handle mouse down for panning, shape creation, or node interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand' || (e.button === 1) || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (['rectangle', 'circle', 'diamond', 'cylinder'].includes(activeTool)) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
        const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
        
        createShapeAtPosition(activeTool, snappedX, snappedY);
      }
    } else if (['arrow', 'line'].includes(activeTool)) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
        const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
        
        // Check if we're hovering over a connection point
        if (hoveredConnectionPoint) {
          // Find the node to get its actual position
          const node = displayNodes?.find(n => n.id === hoveredConnectionPoint.nodeId);
          if (node) {
            // Calculate the exact connection point position
            const connectionPoint = calculateConnectionPointPosition(node, hoveredConnectionPoint.position);
            
            if (lineInProgress) {
              // If we already have a line in progress, finish it at this connection point
              // Use the unified helper function to connect the line endpoint to the connection point
              const pointIndex = lineInProgress.points ? lineInProgress.points.length - 1 : 1;
              connectLineToPoint(
                lineInProgress.id,
                pointIndex,
                hoveredConnectionPoint
              );
              
              finishLineDraw();
            } else {
              // Start a new line from this connection point
              startLineDraw(connectionPoint.x, connectionPoint.y, activeTool as 'line' | 'arrow');
              setIsDrawingLine(true);
              
              // Store the connection information for the start point
              const lineId = useCanvasStore.getState().lineInProgress?.id;
              if (lineId) {
                createConnection({
                  sourceNodeId: lineId,
                  sourcePointIndex: 0, // First point of the line
                  targetNodeId: hoveredConnectionPoint.nodeId,
                  targetPosition: hoveredConnectionPoint.position
                });
              }
            }
            return; // Exit early since we've handled the connection point
          }
        }
        
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
          const segmentData = findClosestLineSegment(x, y);
          if (segmentData) {
            addPointToExistingLine(segmentData.nodeId, segmentData.segmentIndex, x, y);
            selectNode(segmentData.nodeId);
            e.stopPropagation();
            return;
          }
        }
        
        const clickedNode = findNodeAtPosition(x, y);
        if (clickedNode) {
          if (!clickedNode.selected) {
            selectNode(clickedNode.id);
            deselectLinePoints();
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
          // Always check for connection points when dragging an endpoint
          const connectionPointData = findConnectionPointAtPosition(x, y);
          
          // Update the hovered connection point state
          if (JSON.stringify(connectionPointData) !== JSON.stringify(hoveredConnectionPoint)) {
            setHoveredConnectionPoint(connectionPointData);
          }
          
          // If we're hovering over a connection point, snap the line to it
          if (connectionPointData) {
            // Use the unified helper function to connect the line endpoint to the connection point
            connectLineToPoint(
              activePointData.nodeId,
              activePointData.pointIndex,
              connectionPointData
            );
            return;
          } else {
            // If not hovering over a connection point, move the point normally
            // but keep checking for nearby connection points
            moveLinePoint(
              activePointData.nodeId,
              activePointData.pointIndex,
              x,
              y
            );
            
            // Check for connection points in a slightly larger radius
            const nearbyConnectionPoint = findNearbyConnectionPoint(x, y);
            if (nearbyConnectionPoint && !hoveredConnectionPoint) {
              setHoveredConnectionPoint(nearbyConnectionPoint);
              
              // If we found a nearby connection point, snap to it immediately
              if (nearbyConnectionPoint) {
                // Use the unified helper function to connect the line endpoint to the connection point
                connectLineToPoint(
                  activePointData.nodeId,
                  activePointData.pointIndex,
                  nearbyConnectionPoint
                );
                return;
              }
            }
          }
        } else {
          // If not an endpoint, just move the point normally
          moveLinePoint(
            activePointData.nodeId,
            activePointData.pointIndex,
            x,
            y
          );
        }
      }
    } else if (isMovingNode && activeNodeId) {
      const dx = (e.clientX - lastMousePos.x) / transform.zoom;
      const dy = (e.clientY - lastMousePos.y) / transform.zoom;
      
      const selectedNodes = displayNodes?.filter(node => node.selected) || [];
      
      selectedNodes.forEach(node => {
        if (!nodeStartPos[node.id]) {
          nodeStartPos[node.id] = { x: node.position.x, y: node.position.y };
        }
        
        updateNodePosition(
          node.id,
          nodeStartPos[node.id].x + dx,
          nodeStartPos[node.id].y + dy
        );
      });
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
          const selectedNodeIds = displayNodes
            .filter(node => isNodeInSelectionBox(node, { ...selectionBox, end: { x, y } }))
            .map(node => node.id);
          
          selectMultipleNodes(selectedNodeIds);
        }
      }
    } else if (lineInProgress) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Check if we're hovering over a connection point
        const connectionPointData = findConnectionPointAtPosition(x, y);
        
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
            const connectionPoint = calculateConnectionPointPosition(node, position);
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
        const connectionPointData = hoveredConnectionPoint || findConnectionPointAtPosition(x, y) || findNearbyConnectionPoint(x, y);
        
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
          const selectedNodeIds = displayNodes
            .filter(node => isNodeInSelectionBox(node, { ...selectionBox, end: { x, y } }))
            .map(node => node.id);
          
          selectMultipleNodes(selectedNodeIds);
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
        const connectionPointData = hoveredConnectionPoint || findConnectionPointAtPosition(x, y) || findNearbyConnectionPoint(x, y);
        
        if (connectionPointData) {
          // Use the unified helper function to connect the line endpoint to the connection point
          const pointIndex = lineInProgress.points ? lineInProgress.points.length - 1 : 1;
          connectLineToPoint(
            lineInProgress.id,
            pointIndex,
            connectionPointData
          );
        }
      }
      
      setIsDrawingLine(false);
      finishLineDraw();
    }
    
    setSelectedLineEndpoint(null);
    setIsDragging(false);
    setIsMovingNode(false);
    setIsSelecting(false);
    setSelectionBox(null);
    setNodeStartPos({});
    setIsDraggingPoint(false);
    setActivePointData(null);
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
      const connectionPoint = calculateConnectionPointPosition(node, position);
      
      if (lineInProgress) {
        // If we already have a line in progress, finish it at this connection point
        // Use the unified helper function to connect the line endpoint to the connection point
        const pointIndex = lineInProgress.points ? lineInProgress.points.length - 1 : 1;
        connectLineToPoint(
          lineInProgress.id,
          pointIndex,
          { nodeId, position }
        );
        
        finishLineDraw();
      } else {
        // Start a new line from this connection point
        startLineDraw(connectionPoint.x, connectionPoint.y, activeTool as 'line' | 'arrow');
        setIsDrawingLine(true);
        
        // Store the connection information for the start point
        const lineId = useCanvasStore.getState().lineInProgress?.id;
        if (lineId) {
          createConnection({
            sourceNodeId: lineId,
            sourcePointIndex: 0, // First point of the line
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
  }, [useCanvasStore.getState().nodes, onNodesChange]);
  
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
        const connectionPoint = calculateConnectionPointPosition(node, hoveredConnectionPoint.position);
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
    
    for (const node of nodesWithConnectionPoints) {
      if (!node.dimensions) continue;
      
      // Check each possible connection point position
      const connectionPositions: ConnectionPointPosition[] = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
      
      for (const position of connectionPositions) {
        // Calculate the connection point position
        const connectionPoint = calculateConnectionPointPosition(node, position);
        
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
    const node = displayNodes?.find(n => n.id === nodeId);
    
    if (!node) return;
    
    // Calculate the exact connection point position
    const connectionPoint = calculateConnectionPointPosition(node, position);
    
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
  
  return (
    <div 
      ref={canvasRef}
      data-testid="canvas-container"
      className={`relative overflow-hidden bg-background ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
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
          />
        ))}
        
        {lineInProgress && (
          <LineInProgress 
            lineInProgress={lineInProgress}
          />
        )}
      </div>
    </div>
  );
};

export default Canvas; 