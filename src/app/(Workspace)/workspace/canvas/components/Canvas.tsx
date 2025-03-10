'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import ResizeHandles, { ResizeHandleDirection } from './ui/ResizeHandles';
import ConnectionPoints, { ConnectionPointPosition } from './ui/ConnectionPoints';

interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({ 
  width,
  height,
  className = '' 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { 
    transform, 
    activeTool, 
    gridSize, 
    snapToGrid,
    panCanvas,
    nodes,
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
  
  // Add a state to force re-renders
  const [, setForceUpdate] = useState({});
  
  // Add state to track if we're currently drawing a line by dragging
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  
  // Add state for tracking line point dragging
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [activePointData, setActivePointData] = useState<{
    nodeId: string;
    pointIndex: number;
    startX: number;
    startY: number;
  } | null>(null);
  
  // Force a re-render when nodes change
  useEffect(() => {
    console.log('Nodes changed, forcing re-render');
    setForceUpdate({});
  }, [nodes]);
  
  // Set dimensions after component mounts on client side
  useEffect(() => {
    // If width and height are provided, use them
    // Otherwise use the parent container's dimensions or default values
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
    console.log('Canvas useEffect for history initialization');
    console.log('Current nodes:', nodes.length, 'History length:', useCanvasStore.getState().history.length);
    
    // Initialize history with empty state if it's empty
    if (useCanvasStore.getState().history.length === 0) {
      console.log('Initializing history with empty state');
      
      // First, add an empty state
      useCanvasStore.setState(state => {
        state.history = [{
          nodes: [],
          edges: []
        }];
        state.historyIndex = 0;
        return state;
      });
      
      // Then, if we have nodes, add the current state
      if (nodes.length > 0) {
        console.log('Adding current state with nodes to history');
        useCanvasStore.setState(state => {
          state.history.push({
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
          });
          state.historyIndex = 1;
          return state;
        });
      }
      
      console.log('History initialized:', useCanvasStore.getState().history.length, 
                 'Index:', useCanvasStore.getState().historyIndex);
    }
  }, [nodes]);
  
  // Add event listeners for keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      } else if (e.key === 'Escape') {
        // Cancel line drawing if in progress
        if (lineInProgress) {
          cancelLineDraw();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected points
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
    // Only check selected nodes with points
    const selectedNodes = nodes.filter(node => 
      node.selected && 
      node.points && 
      node.points.length > 0 &&
      (node.type === 'line' || node.type === 'arrow')
    );
    
    if (selectedNodes.length === 0) return null;
    
    // Check each point of each selected node
    for (const node of selectedNodes) {
      if (!node.points) continue;
      
      for (let i = 0; i < node.points.length; i++) {
        const point = node.points[i];
        const pointX = node.position.x + point.x;
        const pointY = node.position.y + point.y;
        
        // Check if the point is within 10px of the cursor (adjusted for zoom)
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
    // Only check selected nodes with points
    const lineNodes = nodes.filter(node => 
      node.points && 
      node.points.length > 1 &&
      (node.type === 'line' || node.type === 'arrow')
    );
    
    if (lineNodes.length === 0) return null;
    
    let closestSegment: { nodeId: string; segmentIndex: number; distance: number } | null = null;
    
    // Check each line segment of each line node
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
        
        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
        
        // If this is the closest segment so far, update closestSegment
        if (closestSegment === null || distance < closestSegment.distance) {
          closestSegment = {
            nodeId: node.id,
            segmentIndex: i,
            distance
          };
        }
      }
    }
    
    // Only return if the distance is within a reasonable threshold (10px adjusted for zoom)
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
    // Calculate the squared length of the line segment
    const lengthSquared = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    
    // If the line segment is actually a point, just return the distance to that point
    if (lengthSquared === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
    
    // Calculate the projection of the point onto the line
    const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
    
    // Calculate the closest point on the line segment
    const projectionX = x1 + t * (x2 - x1);
    const projectionY = y1 + t * (y2 - y1);
    
    // Return the distance to the closest point
    return Math.sqrt((x - projectionX) * (x - projectionX) + (y - projectionY) * (y - projectionY));
  };
  
  // Handle mouse down for panning, shape creation, or node interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand' || (e.button === 1) || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (['rectangle', 'circle', 'diamond', 'cylinder'].includes(activeTool)) {
      console.log('Creating new shape:', activeTool);
      // Get the position relative to the canvas and adjusted for transform
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate the position in canvas coordinates
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Snap to grid if enabled
        const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
        const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
        
        console.log('Creating shape at position:', snappedX, snappedY);
        // Create the shape at the calculated position
        createShapeAtPosition(activeTool, snappedX, snappedY);
      }
    } else if (['arrow', 'line'].includes(activeTool)) {
      // Start drawing a line or continue an existing one
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate the position in canvas coordinates
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Snap to grid if enabled
        const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
        const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
        
        // If we already have a line in progress, add a new point
        if (lineInProgress) {
          // Update the last point position and add a new point
          updateLineDraw(x, y, isShiftPressed);
          addPointToLine();
        } else {
          // Start drawing a new line
          console.log('Starting line draw at position:', snappedX, snappedY);
          startLineDraw(snappedX, snappedY, activeTool as 'line' | 'arrow');
          setIsDrawingLine(true);
        }
      }
    } else if (activeTool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Check if we clicked on a line point
        const pointData = findPointAtPosition(x, y);
        if (pointData) {
          // Select the point
          selectLinePoint(pointData.nodeId, pointData.pointIndex, e.shiftKey);
          
          // Start dragging the point
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
        
        // Check if Alt key is pressed and we're clicking near a line segment
        if (e.altKey) {
          const segmentData = findClosestLineSegment(x, y);
          if (segmentData) {
            // Add a new point to the line
            addPointToExistingLine(segmentData.nodeId, segmentData.segmentIndex, x, y);
            
            // Select the node
            selectNode(segmentData.nodeId);
            
            e.stopPropagation();
            return;
          }
        }
        
        // Check if we clicked on a node
        const clickedNode = findNodeAtPosition(x, y);
        if (clickedNode) {
          // If the clicked node is not already selected, select only this node
          if (!clickedNode.selected) {
            selectNode(clickedNode.id);
            // Deselect any selected points
            deselectLinePoints();
          }
          
          setIsMovingNode(true);
          setActiveNodeId(clickedNode.id);
          setLastMousePos({ x: e.clientX, y: e.clientY });
          
          // Store starting positions for all selected nodes
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
          // Start selection box
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
        
        // Move the point
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
      
      // Get all selected nodes
      const selectedNodes = nodes.filter(node => node.selected);
      
      // Move all selected nodes together
      selectedNodes.forEach(node => {
        // Store the initial position for each node if not already stored
        if (!nodeStartPos[node.id]) {
          nodeStartPos[node.id] = { x: node.position.x, y: node.position.y };
        }
        
        // Update each selected node's position
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
        
        // Find all nodes within the selection box
        const selectedNodeIds = nodes
          .filter(node => isNodeInSelectionBox(node, { ...selectionBox, end: { x, y } }))
          .map(node => node.id);
        
        selectMultipleNodes(selectedNodeIds);
      }
    } else if (lineInProgress) {
      // Update the line being drawn
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate the position in canvas coordinates
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Update the line, passing the shift key state
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
    
    // If we're drawing a line by dragging, finish it on mouse up
    if (isDrawingLine && lineInProgress) {
      setIsDrawingLine(false);
      finishLineDraw();
    }
  };
  
  // Handle double click to finish line drawing
  const handleDoubleClick = (e: React.MouseEvent) => {
    // If we're drawing a line, finish it
    if (lineInProgress && !isDrawingLine) {
      // First update the line to the current mouse position
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Update the last point position
        updateLineDraw(x, y, isShiftPressed);
        
        // Then finish the line
        finishLineDraw();
      } else {
        finishLineDraw();
      }
      
      // Prevent the event from bubbling up
      e.stopPropagation();
    }
  };
  
  // Helper function to find a node at a specific position
  const findNodeAtPosition = (x: number, y: number): Node | undefined => {
    // First, check if the point is within any group
    // We check groups first to ensure we always select the group rather than its children
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const { position, dimensions } = node;
      
      // Only check group nodes
      if (node.data?.isGroup === true && dimensions) {
        // Check if the point is within the group's bounds
        if (
          x >= position.x && 
          x <= position.x + dimensions.width && 
          y >= position.y && 
          y <= position.y + dimensions.height
        ) {
          return node; // Return the group node
        }
      }
    }
    
    // If not within any group, check regular nodes
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const { position, dimensions, parentId } = node;
      
      // Skip child nodes that are part of a group
      if (parentId) continue;
      
      // Skip group nodes (already checked above)
      if (node.data?.isGroup === true) continue;
      
      if (!dimensions) continue;
      
      // Check if the point is within the node's bounds
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
  
  // Clean up event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);
  
  // Render grid based on zoom level and grid size
  const renderGrid = () => {
    // Don't render grid if snap to grid is disabled or if in presentation mode
    if (!snapToGrid || presentationMode) return null;
    
    const scaledGridSize = gridSize * transform.zoom;
    
    return (
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
          backgroundImage: 'radial-gradient(circle, hsl(var(--secondary)) 1px, transparent 1px)',
          backgroundPosition: `${transform.x % scaledGridSize}px ${transform.y % scaledGridSize}px`,
        }}
      />
    );
  };
  
  // Render a node based on its type
  const renderNode = (node: Node) => {
    const { id, type, position, dimensions, style, selected, parentId } = node;
    
    // Skip rendering child nodes directly - they'll be rendered with their parent group
    if (parentId && !node.data?.isGroup) return null;
    
    if (!dimensions) return null;
    
    // Log node style for debugging
    if (selected) {
      console.log('Rendering selected node:', id, 'with style:', style);
    }
    
    // Create a container for the shape and resize handles
    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      pointerEvents: selected || ['arrow', 'line'].includes(activeTool) ? 'auto' : 'none', // Make shapes interactive when selected or when line tool is active
    };
    
    // Check if this is a group node
    const isGroup = node.data?.isGroup === true;
    
    // Base styles for all nodes, now relative to the container
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      backgroundColor: (style?.backgroundColor as string) || 'white',
      border: `${(style?.borderWidth as number) || 2}px ${(style?.borderStyle as string) || 'solid'} ${(style?.borderColor as string) || 'black'}`,
      borderRadius: (style?.borderRadius as string) || '0px',
      boxSizing: 'border-box',
      cursor: 'move',
    };
    
    // For group nodes, make the container transparent
    if (isGroup) {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.border = 'none';
    }
    
    // Log computed style for debugging
    if (selected) {
      console.log('Computed baseStyle for node:', id, baseStyle);
    }
    
    // If it's a group, find and render its children
    let childNodes = null;
    if (isGroup) {
      const children = nodes.filter(n => n.parentId === id);
      
      // Add a container for all child nodes with pointer events enabled
      childNodes = (
        <div 
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Don't interfere with group selection
          }}
        >
          {children.map(childNode => {
            // Create a child container with position relative to the group
            const childContainerStyle: React.CSSProperties = {
              position: 'absolute',
              left: `${childNode.position.x}px`,
              top: `${childNode.position.y}px`,
              width: `${childNode.dimensions?.width || 0}px`,
              height: `${childNode.dimensions?.height || 0}px`,
              pointerEvents: 'none', // Don't interfere with group selection
            };
            
            // Render the child based on its type
            let childElement;
            
            switch (childNode.type) {
              case 'rectangle':
                childElement = (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: (childNode.style?.backgroundColor as string) || 'white',
                      border: `${(childNode.style?.borderWidth as number) || 2}px ${(childNode.style?.borderStyle as string) || 'solid'} ${(childNode.style?.borderColor as string) || 'black'}`,
                      borderRadius: (childNode.style?.borderRadius as string) || '0px',
                      boxSizing: 'border-box',
                    }}
                  />
                );
                break;
                
              case 'circle':
                childElement = (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: (childNode.style?.backgroundColor as string) || 'white',
                      border: `${(childNode.style?.borderWidth as number) || 2}px ${(childNode.style?.borderStyle as string) || 'solid'} ${(childNode.style?.borderColor as string) || 'black'}`,
                      borderRadius: '50%',
                      boxSizing: 'border-box',
                    }}
                  />
                );
                break;
                
              case 'diamond':
                childElement = (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: (childNode.style?.backgroundColor as string) || 'white',
                      border: `${(childNode.style?.borderWidth as number) || 2}px ${(childNode.style?.borderStyle as string) || 'solid'} ${(childNode.style?.borderColor as string) || 'black'}`,
                      borderRadius: (childNode.style?.borderRadius as string) || '0px',
                      boxSizing: 'border-box',
                      transform: 'rotate(45deg)',
                      transformOrigin: 'center',
                    }}
                  />
                );
                break;
                
              case 'triangle':
                const triangleWidth = childNode.dimensions?.width || 100;
                const triangleHeight = childNode.dimensions?.height || 100;
                const triangleBgColor = childNode.style?.backgroundColor as string || 'transparent';
                const triangleBorderColor = childNode.style?.borderColor as string || 'black';
                const triangleBorderWidth = (childNode.style?.borderWidth as number) || 2;
                const triangleBorderStyle = childNode.style?.borderStyle as string || 'solid';
                
                childElement = (
                  <svg 
                    width={triangleWidth} 
                    height={triangleHeight} 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    <polygon 
                      points={`${triangleWidth/2},0 0,${triangleHeight} ${triangleWidth},${triangleHeight}`}
                      fill={triangleBgColor}
                      stroke={triangleBorderColor}
                      strokeWidth={triangleBorderWidth}
                      strokeLinejoin="round"
                      strokeDasharray={triangleBorderStyle === 'dashed' ? '5,5' : triangleBorderStyle === 'dotted' ? '2,2' : 'none'}
                    />
                  </svg>
                );
                break;
                
              case 'arrow':
              case 'line':
                const borderStyle = (childNode.style?.borderStyle as string) || 'solid';
                
                if (borderStyle === 'solid') {
                  childElement = (
                    <div 
                      style={{ 
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: `${(childNode.style?.borderWidth as number) || 2}px`,
                        border: 'none',
                        backgroundColor: (childNode.style?.borderColor as string) || 'black',
                      }} 
                    >
                      {childNode.type === 'arrow' && (
                        <div style={{
                          position: 'absolute',
                          right: '-10px',
                          top: '-8px',
                          width: '0',
                          height: '0',
                          borderTop: '10px solid transparent',
                          borderBottom: '10px solid transparent',
                          borderLeft: `15px solid ${(childNode.style?.borderColor as string) || 'black'}`,
                        }} />
                      )}
                    </div>
                  );
                } else {
                  childElement = (
                    <div 
                      style={{ 
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '0',
                        border: 'none',
                        borderTop: `${(childNode.style?.borderWidth as number) || 2}px ${borderStyle} ${(childNode.style?.borderColor as string) || 'black'}`,
                        backgroundColor: 'transparent',
                      }} 
                    >
                      {childNode.type === 'arrow' && (
                        <div style={{
                          position: 'absolute',
                          right: '-10px',
                          top: `-${(childNode.style?.borderWidth as number) / 2 + 8}px`,
                          width: '0',
                          height: '0',
                          borderTop: '10px solid transparent',
                          borderBottom: '10px solid transparent',
                          borderLeft: `15px solid ${(childNode.style?.borderColor as string) || 'black'}`,
                        }} />
                      )}
                    </div>
                  );
                }
                break;
                
              default:
                childElement = (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: (childNode.style?.backgroundColor as string) || 'white',
                      border: `${(childNode.style?.borderWidth as number) || 2}px ${(childNode.style?.borderStyle as string) || 'solid'} ${(childNode.style?.borderColor as string) || 'black'}`,
                      borderRadius: (childNode.style?.borderRadius as string) || '0px',
                      boxSizing: 'border-box',
                    }}
                  />
                );
                break;
            }
            
            return (
              <div key={childNode.id} style={childContainerStyle}>
                {childElement}
              </div>
            );
          })}
        </div>
      );
    }
    
    // Determine if we should show connection points
    const showConnectionPoints = ['arrow', 'line'].includes(activeTool) && 
                                !isGroup && 
                                !node.points; // Don't show connection points on line/arrow nodes
    
    // Handle connection point click
    const handleConnectionPointClick = (nodeId: string, position: ConnectionPointPosition, x: number, y: number) => {
      console.log('Connection point clicked:', nodeId, position, x, y);
      
      // If we're already drawing a line, we can connect to this point
      if (lineInProgress) {
        // For now, just finish the line at this point
        updateLineDraw(x, y, isShiftPressed);
        finishLineDraw();
      } else {
        // Start drawing a new line from this point
        startLineDraw(x, y, activeTool as 'line' | 'arrow');
      }
    };
    
    // Render different shapes based on type
    let shapeElement;
    switch (type) {
      case 'rectangle':
        shapeElement = <div style={baseStyle} />;
        break;
        
      case 'triangle':
        // Get the dimensions and style properties
        const triangleWidth = dimensions?.width || 100;
        const triangleHeight = dimensions?.height || 100;
        const triangleBgColor = style?.backgroundColor as string || 'transparent';
        const triangleBorderColor = style?.borderColor as string || 'black';
        const triangleBorderWidth = (style?.borderWidth as number) || 2;
        const triangleBorderStyle = style?.borderStyle as string || 'solid';
        
        // Create SVG triangle with visible borders
        shapeElement = (
          <svg 
            width={triangleWidth} 
            height={triangleHeight} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <polygon 
              points={`${triangleWidth/2},0 0,${triangleHeight} ${triangleWidth},${triangleHeight}`}
              fill={triangleBgColor}
              stroke={triangleBorderColor}
              strokeWidth={triangleBorderWidth}
              strokeLinejoin="round"
              strokeDasharray={triangleBorderStyle === 'dashed' ? '5,5' : triangleBorderStyle === 'dotted' ? '2,2' : 'none'}
            />
          </svg>
        );
        break;
        
      case 'circle':
        shapeElement = (
          <div 
            style={{ 
              ...baseStyle, 
              borderRadius: '50%' 
            }} 
          />
        );
        break;
        
      case 'diamond':
        shapeElement = (
          <div 
            style={{ 
              ...baseStyle,
              transform: 'rotate(45deg)',
              transformOrigin: 'center'
            }} 
          />
        );
        break;
        
      case 'cylinder':
        // For cylinder, we need to preserve the top border radius but allow the bottom to be customized
        const cylinderTopRadius = '50% 50% 0 0 / 20% 20% 0 0';
        const customRadius = (style?.borderRadius as string) || '0px';
        // Extract the pixel value from the borderRadius string (e.g., "10px" -> 10)
        const radiusValue = parseInt((customRadius.match(/\d+/) || ['0'])[0], 10);
        // Create a custom bottom radius that scales with the user's setting
        const cylinderBottomRadius = `0 0 ${radiusValue * 2}% ${radiusValue * 2}% / 0 0 ${radiusValue}% ${radiusValue}%`;
        
        shapeElement = (
          <div 
            style={{ 
              ...baseStyle,
              borderRadius: cylinderTopRadius,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '20%',
              borderTop: `${(style?.borderWidth as number) || 2}px solid ${(style?.borderColor as string) || 'black'}`,
              borderRadius: cylinderBottomRadius,
            }} />
          </div>
        );
        break;
        
      case 'arrow':
      case 'line':
        // Check if this node has points for multi-point lines
        if (node.points && node.points.length > 1) {
          // For multi-point lines, we need to render an SVG
          const borderStyle = (style?.borderStyle as string) || 'solid';
          const borderWidth = (style?.borderWidth as number) || 2;
          const borderColor = (style?.borderColor as string) || 'black';
          
          // Create SVG path from points
          let pathData = `M ${node.points[0].x} ${node.points[0].y}`;
          for (let i = 1; i < node.points.length; i++) {
            pathData += ` L ${node.points[i].x} ${node.points[i].y}`;
          }
          
          shapeElement = (
            <svg 
              width="100%" 
              height="100%" 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                overflow: 'visible'
              }}
            >
              <path 
                d={pathData}
                fill="none"
                stroke={borderColor}
                strokeWidth={borderWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={borderStyle === 'dashed' ? '5,5' : borderStyle === 'dotted' ? '2,2' : 'none'}
              />
              {type === 'arrow' && node.points.length > 1 && (
                <marker
                  id={`arrowhead-${node.id}`}
                  markerWidth="10"
                  markerHeight="7"
                  refX="0"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon 
                    points="0 0, 10 3.5, 0 7" 
                    fill={borderColor} 
                  />
                </marker>
              )}
              {type === 'arrow' && node.points.length > 1 && (
                // Add the arrowhead
                <polygon 
                  points="0,0 -10,5 -10,-5"
                  fill={borderColor}
                  transform={`translate(${node.points[node.points.length-1].x}, ${node.points[node.points.length-1].y}) rotate(${Math.atan2(
                    node.points[node.points.length-1].y - node.points[node.points.length-2].y,
                    node.points[node.points.length-1].x - node.points[node.points.length-2].x
                  ) * 180 / Math.PI})`}
                />
              )}
              
              {/* Add control points if selected */}
              {selected && node.points.map((point, index) => {
                const isSelected = selectedPointIndices?.includes(index) || false;
                return (
                  <circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    className={`stroke-border stroke-[1.5] cursor-move ${isSelected ? 'fill-primary' : 'fill-background'}`}
                  />
                );
              })}
            </svg>
          );
        } else {
          // For simple lines without points, use the existing implementation
          const borderStyle = (style?.borderStyle as string) || 'solid';
          
          if (borderStyle === 'solid') {
            shapeElement = (
              <div 
                style={{ 
                  ...baseStyle,
                  height: `${(style?.borderWidth as number) || 2}px`,
                  border: 'none',
                  backgroundColor: (style?.borderColor as string) || 'black',
                  transform: type === 'arrow' ? 'none' : 'none',
                }} 
              >
                {type === 'arrow' && (
                  <div style={{
                    position: 'absolute',
                    right: '-10px',
                    top: '-8px',
                    width: '0',
                    height: '0',
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderLeft: `15px solid ${(style?.borderColor as string) || 'black'}`,
                  }} />
                )}
              </div>
            );
          } else {
            // For dashed and dotted lines, use a div with border-top
            shapeElement = (
              <div 
                style={{ 
                  ...baseStyle,
                  height: '0',
                  border: 'none',
                  borderTop: `${(style?.borderWidth as number) || 2}px ${borderStyle} ${(style?.borderColor as string) || 'black'}`,
                  backgroundColor: 'transparent',
                }} 
              >
                {type === 'arrow' && (
                  <div style={{
                    position: 'absolute',
                    right: '-10px',
                    top: `-${(style?.borderWidth as number) / 2 + 8}px`,
                    width: '0',
                    height: '0',
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderLeft: `15px solid ${(style?.borderColor as string) || 'black'}`,
                  }} />
                )}
              </div>
            );
          }
        }
        break;
        
      default:
        shapeElement = <div style={baseStyle} />;
        break;
    }
    
    // Return the container with the shape and resize handles
    return (
      <div 
        key={id}
        style={containerStyle}
        className={`node ${selected ? 'selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (activeTool === 'select') {
            selectNode(id);
          }
        }}
      >
        {/* For selected groups, render a selection indicator as an overlay */}
        {isGroup && selected && (
          <div 
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              border: '2px dashed #3b82f6', // Blue dashed border
              borderRadius: '4px',
              pointerEvents: 'none', // Don't interfere with interactions
              boxSizing: 'border-box', // Ensure the border doesn't affect dimensions
              zIndex: 1, // Place above the content but below resize handles
            }}
          />
        )}
        {shapeElement}
        {isGroup && childNodes}
        {selected && dimensions && (
          <ResizeHandles 
            node={node} 
            onResize={handleResizeNode} 
          />
        )}
        {showConnectionPoints && dimensions && (
          <ConnectionPoints 
            node={node}
            onConnectionPointClick={handleConnectionPointClick}
          />
        )}
      </div>
    );
  };
  
  // Handle resizing of nodes
  const handleResizeNode = (nodeId: string, direction: ResizeHandleDirection, dx: number, dy: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.dimensions) return;
    
    // Adjust dx and dy for zoom level
    const adjustedDx = dx / transform.zoom;
    const adjustedDy = dy / transform.zoom;
    
    let newWidth = node.dimensions.width;
    let newHeight = node.dimensions.height;
    let newX = node.position.x;
    let newY = node.position.y;
    
    // Adjust dimensions and position based on resize direction
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
    
    // Apply snap to grid if enabled
    if (snapToGrid) {
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // Check if this is a group node
    const isGroup = node.data?.isGroup === true;
    
    if (isGroup) {
      // Get all child nodes
      const childNodes = nodes.filter(n => n.parentId === nodeId);
      
      // Calculate the width and height ratios
      const widthRatio = newWidth / node.dimensions.width;
      const heightRatio = newHeight / node.dimensions.height;
      
      // Update each child node
      childNodes.forEach(childNode => {
        if (!childNode.dimensions) return;
        
        // Calculate new position
        // For resizing from right/bottom, we scale the position
        // For resizing from left/top, we need to account for the translation
        const newChildX = childNode.position.x * widthRatio;
        const newChildY = childNode.position.y * heightRatio;
        
        // Scale the dimensions
        const newChildWidth = childNode.dimensions.width * widthRatio;
        const newChildHeight = childNode.dimensions.height * heightRatio;
        
        // Update the child node
        updateNodePosition(childNode.id, newChildX, newChildY);
        updateNodeDimensions(childNode.id, newChildWidth, newChildHeight);
      });
    }
    
    // Update the node's position and dimensions
    updateNodePosition(nodeId, newX, newY);
    updateNodeDimensions(nodeId, newWidth, newHeight);
  };
  
  return (
    <div 
      ref={canvasRef}
      className={`relative overflow-hidden bg-background ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Grid */}
      {renderGrid()}
      
      {/* Selection Box */}
      {isSelecting && selectionBox && (
        <div
          className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none"
          style={{
            left: `${Math.min(selectionBox.start.x, selectionBox.end.x) * transform.zoom + transform.x}px`,
            top: `${Math.min(selectionBox.start.y, selectionBox.end.y) * transform.zoom + transform.y}px`,
            width: `${Math.abs(selectionBox.end.x - selectionBox.start.x) * transform.zoom}px`,
            height: `${Math.abs(selectionBox.end.y - selectionBox.start.y) * transform.zoom}px`,
          }}
        />
      )}
      
      {/* Canvas Content */}
      <div 
        className="absolute"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Render all nodes */}
        {nodes.map(renderNode)}
        
        {/* Render line in progress */}
        {lineInProgress && (
          <div 
            style={{
              position: 'absolute',
              left: `${lineInProgress.position.x}px`,
              top: `${lineInProgress.position.y}px`,
              width: `${lineInProgress.dimensions?.width || 0}px`,
              height: `${lineInProgress.dimensions?.height || 0}px`,
              pointerEvents: 'none',
            }}
          >
            {lineInProgress.points && lineInProgress.points.length > 1 && (
              <svg 
                width="100%" 
                height="100%" 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  overflow: 'visible'
                }}
              >
                {/* Main path */}
                <path 
                  d={lineInProgress.points.reduce((path, point, index) => {
                    if (index === 0) {
                      return `M ${point.x} ${point.y}`;
                    } else {
                      return `${path} L ${point.x} ${point.y}`;
                    }
                  }, '')}
                  fill="none"
                  stroke={(lineInProgress.style?.borderColor as string) || 'black'}
                  strokeWidth={(lineInProgress.style?.borderWidth as number) || 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={(lineInProgress.style?.borderStyle as string) === 'dashed' ? '5,5' : (lineInProgress.style?.borderStyle as string) === 'dotted' ? '2,2' : 'none'}
                />
                
                {/* Arrow head if needed */}
                {lineInProgress.type === 'arrow' && lineInProgress.points.length > 1 && (
                  <polygon 
                    points="0,0 -10,5 -10,-5"
                    fill={(lineInProgress.style?.borderColor as string) || 'black'}
                    transform={`translate(${lineInProgress.points[lineInProgress.points.length-1].x}, ${lineInProgress.points[lineInProgress.points.length-1].y}) rotate(${Math.atan2(
                      lineInProgress.points[lineInProgress.points.length-1].y - lineInProgress.points[lineInProgress.points.length-2].y,
                      lineInProgress.points[lineInProgress.points.length-1].x - lineInProgress.points[lineInProgress.points.length-2].x
                    ) * 180 / Math.PI})`}
                  />
                )}
                
                {/* Control points to show the user they can continue adding points */}
                {lineInProgress.points.map((point, index) => (
                  <circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    className="stroke-border stroke-[1.5] cursor-move fill-background"
                  />
                ))}
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas; 