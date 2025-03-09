'use client';

import React from 'react';
import { Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

export type ResizeHandleDirection = 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se';

interface ResizeHandlesProps {
  node: Node;
  onResize: (nodeId: string, direction: ResizeHandleDirection, dx: number, dy: number) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ node, onResize }) => {
  const handleSize = 12; // Slightly larger handles for better usability
  const handleOffset = 10; // Distance from the shape edge to the handle center
  
  // Handle mouse down on a resize handle
  const handleMouseDown = (e: React.MouseEvent, direction: ResizeHandleDirection) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior
    
    // Starting position
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Function to handle mouse move
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault(); // Prevent any default behavior
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      onResize(node.id, direction, dx, dy);
    };
    
    // Function to handle mouse up
    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault(); // Prevent any default behavior
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Common styles for all resize handles
  const commonHandleStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${handleSize}px`,
    height: `${handleSize}px`,
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '50%',
    zIndex: 100, // Higher z-index to ensure visibility
    pointerEvents: 'auto', // Make sure handles are clickable
    touchAction: 'none', // Prevent touch actions for better mobile experience
  };
  
  // Calculate positions for each handle with offset
  const handlePositions = {
    n: { top: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    s: { bottom: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    w: { left: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
    e: { right: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
    nw: { top: -handleSize / 2 - handleOffset, left: -handleSize / 2 - handleOffset, cursor: 'nwse-resize' },
    ne: { top: -handleSize / 2 - handleOffset, right: -handleSize / 2 - handleOffset, cursor: 'nesw-resize' },
    sw: { bottom: -handleSize / 2 - handleOffset, left: -handleSize / 2 - handleOffset, cursor: 'nesw-resize' },
    se: { bottom: -handleSize / 2 - handleOffset, right: -handleSize / 2 - handleOffset, cursor: 'nwse-resize' },
  };
  
  // Draw the bounding box
  const boundingBoxStyle: React.CSSProperties = {
    position: 'absolute',
    top: -handleOffset,
    left: -handleOffset,
    right: -handleOffset,
    bottom: -handleOffset,
    border: '1px solid hsl(var(--border))',
    pointerEvents: 'none', // Don't interfere with mouse events
    zIndex: 90,
  };
  
  return (
    <>
      {/* Bounding box */}
      <div style={boundingBoxStyle} />
      
      {/* Resize handles */}
      {Object.entries(handlePositions).map(([direction, position]) => (
        <div
          key={direction}
          style={{
            ...commonHandleStyle,
            ...position,
          }}
          onMouseDown={(e) => handleMouseDown(e, direction as ResizeHandleDirection)}
          className="resize-handle"
        />
      ))}
    </>
  );
};

export default ResizeHandles; 