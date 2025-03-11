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
    deleteSelectedPoints
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
          return { nodeId: node.id, pointIndex: i };
        }
      }
    }
    
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
    
    // Then check regular nodes
    for (let i = displayNodes.length - 1; i >= 0; i--) {
      const node = displayNodes[i];
      const { position, dimensions, parentId } = node;
      
      if (parentId || node.data?.isGroup === true) continue;
      
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
        
        moveLinePoint(
          activePointData.nodeId,
          activePointData.pointIndex,
          x,
          y
        );
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
        
        updateLineDraw(x, y, isShiftPressed);
      }
    }
  };
  
  // Handle mouse up to end all interactions
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsMovingNode(false);
    setIsSelecting(false);
    setSelectionBox(null);
    setNodeStartPos({});
    setIsDraggingPoint(false);
    setActivePointData(null);
    
    if (isDrawingLine && lineInProgress) {
      setIsDrawingLine(false);
      finishLineDraw();
    }
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
        updateLineDraw(connectionPoint.x, connectionPoint.y, isShiftPressed);
        
        // Store the connection information before finishing the line
        const lineId = lineInProgress.id;
        const pointIndex = lineInProgress.points ? lineInProgress.points.length - 1 : 1;
        
        // Add the connection to the store
        useCanvasStore.setState(state => {
          state.connections.push({
            lineId,
            pointIndex,
            shapeId: nodeId,
            position
          });
          return state;
        });
        
        finishLineDraw();
      } else {
        // Start a new line from this connection point
        startLineDraw(connectionPoint.x, connectionPoint.y, activeTool as 'line' | 'arrow');
        setIsDrawingLine(true);
        
        // Store the connection information for the start point
        const lineId = useCanvasStore.getState().lineInProgress?.id;
        if (lineId) {
          useCanvasStore.setState(state => {
            state.connections.push({
              lineId,
              pointIndex: 0, // First point of the line
              shapeId: nodeId,
              position
            });
            return state;
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