'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, Node } from '@/lib/store/canvas-store';

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
    updateNodeDimensions
  } = useCanvasStore();
  
  // State for tracking mouse interactions
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingNode, setIsMovingNode] = useState(false);
  const [isResizingNode, setIsResizingNode] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState({ x: 0, y: 0 });
  const [nodeStartDimensions, setNodeStartDimensions] = useState({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
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
      // Handle selection logic
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - transform.x) / transform.zoom;
        const y = (e.clientY - rect.top - transform.y) / transform.zoom;
        
        // Check if we clicked on a node
        const clickedNode = findNodeAtPosition(x, y);
        if (clickedNode) {
          selectNode(clickedNode.id);
          
          // Check if we're clicking on a resize handle
          const resizeHandle = getResizeHandle(clickedNode, x, y);
          if (resizeHandle) {
            // Start resizing
            setIsResizingNode(true);
            setActiveNodeId(clickedNode.id);
            setResizeDirection(resizeHandle);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            setNodeStartDimensions({
              width: clickedNode.dimensions?.width || 0,
              height: clickedNode.dimensions?.height || 0
            });
            setNodeStartPos({
              x: clickedNode.position.x,
              y: clickedNode.position.y
            });
          } else {
            // Start moving
            setIsMovingNode(true);
            setActiveNodeId(clickedNode.id);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            setNodeStartPos({
              x: clickedNode.position.x,
              y: clickedNode.position.y
            });
          }
        }
      }
    }
  };
  
  // Handle mouse move for panning or node interaction
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
    } else if (isResizingNode && activeNodeId && resizeDirection) {
      const dx = (e.clientX - lastMousePos.x) / transform.zoom;
      const dy = (e.clientY - lastMousePos.y) / transform.zoom;
      
      // Calculate new dimensions based on resize direction
      let newWidth = nodeStartDimensions.width;
      let newHeight = nodeStartDimensions.height;
      let newX = nodeStartPos.x;
      let newY = nodeStartPos.y;
      
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(20, nodeStartDimensions.width + dx);
      }
      if (resizeDirection.includes('w')) {
        const widthChange = Math.min(nodeStartDimensions.width - 20, dx);
        newWidth = nodeStartDimensions.width - widthChange;
        newX = nodeStartPos.x + widthChange;
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(20, nodeStartDimensions.height + dy);
      }
      if (resizeDirection.includes('n')) {
        const heightChange = Math.min(nodeStartDimensions.height - 20, dy);
        newHeight = nodeStartDimensions.height - heightChange;
        newY = nodeStartPos.y + heightChange;
      }
      
      // Update node position if it changed
      if (newX !== nodeStartPos.x || newY !== nodeStartPos.y) {
        updateNodePosition(activeNodeId, newX, newY);
      }
      
      // Update node dimensions
      updateNodeDimensions(activeNodeId, newWidth, newHeight);
    }
  };
  
  // Handle mouse up to stop interactions
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    if (isMovingNode) {
      setIsMovingNode(false);
      setActiveNodeId(null);
    }
    if (isResizingNode) {
      setIsResizingNode(false);
      setActiveNodeId(null);
      setResizeDirection(null);
    }
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
  
  // Helper function to check if a point is on a resize handle
  const getResizeHandle = (node: Node, x: number, y: number): string | null => {
    const { position, dimensions } = node;
    if (!dimensions) return null;
    
    const handleSize = 8 / transform.zoom; // Size of the resize handle
    const halfHandleSize = handleSize / 2;
    
    // Check each corner and edge
    if (Math.abs(x - position.x) <= handleSize && Math.abs(y - position.y) <= handleSize) {
      return 'nw'; // Northwest
    }
    if (Math.abs(x - (position.x + dimensions.width)) <= handleSize && Math.abs(y - position.y) <= handleSize) {
      return 'ne'; // Northeast
    }
    if (Math.abs(x - position.x) <= handleSize && Math.abs(y - (position.y + dimensions.height)) <= handleSize) {
      return 'sw'; // Southwest
    }
    if (Math.abs(x - (position.x + dimensions.width)) <= handleSize && Math.abs(y - (position.y + dimensions.height)) <= handleSize) {
      return 'se'; // Southeast
    }
    
    // Check edges
    if (Math.abs(x - position.x) <= handleSize && y > position.y + halfHandleSize && y < position.y + dimensions.height - halfHandleSize) {
      return 'w'; // West
    }
    if (Math.abs(x - (position.x + dimensions.width)) <= handleSize && y > position.y + halfHandleSize && y < position.y + dimensions.height - halfHandleSize) {
      return 'e'; // East
    }
    if (Math.abs(y - position.y) <= handleSize && x > position.x + halfHandleSize && x < position.x + dimensions.width - halfHandleSize) {
      return 'n'; // North
    }
    if (Math.abs(y - (position.y + dimensions.height)) <= handleSize && x > position.x + halfHandleSize && x < position.x + dimensions.width - halfHandleSize) {
      return 's'; // South
    }
    
    return null;
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
    
    // Base styles for all nodes
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      backgroundColor: (style?.backgroundColor as string) || 'white',
      border: `${(style?.borderWidth as number) || 2}px solid ${(style?.borderColor as string) || 'black'}`,
      boxSizing: 'border-box',
      cursor: 'move',
      ...(selected ? { boxShadow: '0 0 0 2px blue' } : {})
    };
    
    // Render different shapes based on type
    let shapeElement;
    switch (type) {
      case 'rectangle':
        shapeElement = <div key={id} style={baseStyle} />;
        break;
        
      case 'circle':
        shapeElement = (
          <div 
            key={id} 
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
            key={id} 
            style={{ 
              ...baseStyle,
              transform: 'rotate(45deg)',
              transformOrigin: 'center'
            }} 
          />
        );
        break;
        
      case 'cylinder':
        shapeElement = (
          <div 
            key={id} 
            style={{ 
              ...baseStyle,
              borderRadius: '50% 50% 0 0 / 20% 20% 0 0',
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
              borderRadius: '0 0 50% 50% / 0 0 20% 20%',
            }} />
          </div>
        );
        break;
        
      case 'arrow':
      case 'line':
        shapeElement = (
          <div 
            key={id} 
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
        break;
        
      default:
        shapeElement = <div key={id} style={baseStyle} />;
    }
    
    // If selected, add resize handles
    if (selected && !['arrow', 'line'].includes(type)) {
      const handleSize = 8;
      const handleStyle: React.CSSProperties = {
        position: 'absolute',
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        backgroundColor: 'white',
        border: '1px solid blue',
        borderRadius: '50%',
      };
      
      return (
        <div key={id} style={{ position: 'absolute', left: 0, top: 0 }}>
          {shapeElement}
          
          {/* Resize handles */}
          <div style={{ ...handleStyle, left: `${position.x - handleSize / 2}px`, top: `${position.y - handleSize / 2}px`, cursor: 'nwse-resize' }} />
          <div style={{ ...handleStyle, left: `${position.x + dimensions.width - handleSize / 2}px`, top: `${position.y - handleSize / 2}px`, cursor: 'nesw-resize' }} />
          <div style={{ ...handleStyle, left: `${position.x - handleSize / 2}px`, top: `${position.y + dimensions.height - handleSize / 2}px`, cursor: 'nesw-resize' }} />
          <div style={{ ...handleStyle, left: `${position.x + dimensions.width - handleSize / 2}px`, top: `${position.y + dimensions.height - handleSize / 2}px`, cursor: 'nwse-resize' }} />
          
          {/* Edge handles */}
          <div style={{ ...handleStyle, left: `${position.x - handleSize / 2}px`, top: `${position.y + dimensions.height / 2 - handleSize / 2}px`, cursor: 'ew-resize' }} />
          <div style={{ ...handleStyle, left: `${position.x + dimensions.width - handleSize / 2}px`, top: `${position.y + dimensions.height / 2 - handleSize / 2}px`, cursor: 'ew-resize' }} />
          <div style={{ ...handleStyle, left: `${position.x + dimensions.width / 2 - handleSize / 2}px`, top: `${position.y - handleSize / 2}px`, cursor: 'ns-resize' }} />
          <div style={{ ...handleStyle, left: `${position.x + dimensions.width / 2 - handleSize / 2}px`, top: `${position.y + dimensions.height - handleSize / 2}px`, cursor: 'ns-resize' }} />
        </div>
      );
    }
    
    return shapeElement;
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