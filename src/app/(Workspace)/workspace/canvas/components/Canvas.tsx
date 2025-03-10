'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import ResizeHandles, { ResizeHandleDirection } from './ui/ResizeHandles';

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
    updateNodeDimensions
  } = useCanvasStore();
  
  // State for tracking mouse interactions
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingNode, setIsMovingNode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Add a state to force re-renders
  const [, setForceUpdate] = useState({});
  
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
  
  // Handle mouse down for panning, shape creation, or node interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand' || (e.button === 1) || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (['rectangle', 'circle', 'diamond', 'cylinder', 'arrow', 'line'].includes(activeTool)) {
      // Get the position relative to the canvas and adjusted for transform
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate the position in canvas coordinates
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Snap to grid if enabled
        const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
        const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
        
        // Create the shape at the calculated position
        createShapeAtPosition(activeTool, snappedX, snappedY);
      }
    } else if (activeTool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Check if we clicked on a node
        const clickedNode = findNodeAtPosition(x, y);
        if (clickedNode) {
          selectNode(clickedNode.id);
          setIsMovingNode(true);
          setActiveNodeId(clickedNode.id);
          setLastMousePos({ x: e.clientX, y: e.clientY });
          setNodeStartPos({
            x: clickedNode.position.x,
            y: clickedNode.position.y
          });
        } else {
          // Start selection box
          setIsSelecting(true);
          setSelectionBox({
            start: { x, y },
            end: { x, y }
          });
          deselectAllNodes();
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
    } else if (isMovingNode && activeNodeId) {
      const dx = (e.clientX - lastMousePos.x) / transform.zoom;
      const dy = (e.clientY - lastMousePos.y) / transform.zoom;
      
      // Update the node position
      updateNodePosition(
        activeNodeId,
        nodeStartPos.x + dx,
        nodeStartPos.y + dy
      );
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
    }
  };
  
  // Handle mouse up to end all interactions
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsMovingNode(false);
    setIsSelecting(false);
    setSelectionBox(null);
    setActiveNodeId(null);
  };
  
  // Helper function to find a node at a specific position
  const findNodeAtPosition = (x: number, y: number): Node | undefined => {
    // Check in reverse order (top-most node first)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const { position, dimensions } = node;
      
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
    if (!snapToGrid) return null;
    
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
    const { id, type, position, dimensions, style, selected } = node;
    
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
      pointerEvents: selected ? 'auto' : 'none', // Only make selected shapes interactive
    };
    
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
    
    // Log computed style for debugging
    if (selected) {
      console.log('Computed baseStyle for node:', id, baseStyle);
    }
    
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
        // For dashed and dotted lines, we need to use a different approach
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
        break;
        
      default:
        shapeElement = <div style={baseStyle} />;
        break;
    }
    
    // Return the container with the shape and resize handles
    return (
      <div key={id} style={containerStyle}>
        {shapeElement}
        {selected && dimensions && (
          <ResizeHandles 
            node={node} 
            onResize={handleResizeNode} 
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
    
    // Update node position and dimensions
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
      </div>
    </div>
  );
};

export default Canvas; 