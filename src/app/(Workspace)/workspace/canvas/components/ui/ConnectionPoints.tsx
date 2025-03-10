'use client';

import React from 'react';
import { Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

export type ConnectionPointPosition = 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se';

interface ConnectionPointsProps {
  node: Node;
  onConnectionPointClick?: (nodeId: string, position: ConnectionPointPosition, x: number, y: number) => void;
}

const ConnectionPoints: React.FC<ConnectionPointsProps> = ({ node, onConnectionPointClick }) => {
  const handleSize = 8; // Smaller than resize handles
  const handleOffset = 5; // Closer to the shape than resize handles
  
  // Handle click on a connection point
  const handleClick = (e: React.MouseEvent, position: ConnectionPointPosition) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onConnectionPointClick) {
      // Calculate the absolute position of the connection point
      const pointX = node.position.x;
      const pointY = node.position.y;
      
      // Adjust based on position and dimensions
      let x = pointX;
      let y = pointY;
      
      if (node.dimensions) {
        switch (position) {
          case 'n':
            x += node.dimensions.width / 2;
            break;
          case 's':
            x += node.dimensions.width / 2;
            y += node.dimensions.height;
            break;
          case 'w':
            y += node.dimensions.height / 2;
            break;
          case 'e':
            x += node.dimensions.width;
            y += node.dimensions.height / 2;
            break;
          case 'nw':
            break;
          case 'ne':
            x += node.dimensions.width;
            break;
          case 'sw':
            y += node.dimensions.height;
            break;
          case 'se':
            x += node.dimensions.width;
            y += node.dimensions.height;
            break;
        }
      }
      
      onConnectionPointClick(node.id, position, x, y);
    }
  };
  
  // Common styles for all connection points
  const commonHandleStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${handleSize}px`,
    height: `${handleSize}px`,
    backgroundColor: 'hsl(var(--background))',
    border: '2px solid hsl(var(--primary))',
    borderRadius: '50%', // Make them circular
    zIndex: 100,
    pointerEvents: 'auto',
    touchAction: 'none',
    cursor: 'crosshair',
  };
  
  // Calculate positions for each handle with offset
  const handlePositions = {
    n: { top: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
    s: { bottom: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
    w: { left: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
    e: { right: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
    nw: { top: -handleSize / 2 - handleOffset, left: -handleSize / 2 - handleOffset },
    ne: { top: -handleSize / 2 - handleOffset, right: -handleSize / 2 - handleOffset },
    sw: { bottom: -handleSize / 2 - handleOffset, left: -handleSize / 2 - handleOffset },
    se: { bottom: -handleSize / 2 - handleOffset, right: -handleSize / 2 - handleOffset },
  };
  
  return (
    <>
      {/* Connection points */}
      {Object.entries(handlePositions).map(([position, style]) => (
        <div
          key={`connection-${position}`}
          style={{
            ...commonHandleStyle,
            ...style,
          }}
          onClick={(e) => handleClick(e, position as ConnectionPointPosition)}
          className="connection-point"
        />
      ))}
    </>
  );
};

export default ConnectionPoints; 