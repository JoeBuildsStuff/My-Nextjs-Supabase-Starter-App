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
    
    if (onConnectionPointClick && node.dimensions) {
      const width = node.dimensions.width;
      const height = node.dimensions.height;
      
      // Base position (top-left corner of the shape)
      let x = node.position.x;
      let y = node.position.y;
      
      // Adjust based on shape type and position
      if (node.type === 'circle') {
        const radius = Math.min(width, height) / 2;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Position all points directly on the circle's edge
        switch (position) {
          case 'n':
            x = centerX;
            y = centerY - radius;
            break;
          case 's':
            x = centerX;
            y = centerY + radius;
            break;
          case 'w':
            x = centerX - radius;
            y = centerY;
            break;
          case 'e':
            x = centerX + radius;
            y = centerY;
            break;
          case 'nw':
            // Position at 45° angle on the circle's edge
            x = centerX - radius * 0.7071; // cos(45°) = 0.7071
            y = centerY - radius * 0.7071;
            break;
          case 'ne':
            x = centerX + radius * 0.7071;
            y = centerY - radius * 0.7071;
            break;
          case 'sw':
            x = centerX - radius * 0.7071;
            y = centerY + radius * 0.7071;
            break;
          case 'se':
            x = centerX + radius * 0.7071;
            y = centerY + radius * 0.7071;
            break;
        }
      } else if (node.type === 'diamond') {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Position points at the four vertices of the diamond
        switch (position) {
          case 'n':
            x = centerX;
            y = y - handleOffset; // Top vertex, moved further out
            break;
          case 's':
            x = centerX;
            y = y + height + handleOffset; // Bottom vertex, moved further out
            break;
          case 'w':
            x = x - handleOffset;
            y = centerY; // Left vertex, moved further out
            break;
          case 'e':
            x = x + width + handleOffset;
            y = centerY; // Right vertex, moved further out
            break;
          // Add corner points for diamonds at 45-degree angles
          case 'nw':
            // Position at 45° angle between north and west points, moved further out
            x = x + width / 4 - handleOffset;
            y = y + height / 4 - handleOffset;
            break;
          case 'ne':
            // Position at 45° angle between north and east points, moved further out
            x = x + width * 3/4 + handleOffset;
            y = y + height / 4 - handleOffset;
            break;
          case 'sw':
            // Position at 45° angle between south and west points, moved further out
            x = x + width / 4 - handleOffset;
            y = y + height * 3/4 + handleOffset;
            break;
          case 'se':
            // Position at 45° angle between south and east points, moved further out
            x = x + width * 3/4 + handleOffset;
            y = y + height * 3/4 + handleOffset;
            break;
        }
      } else if (node.type === 'triangle') {
        const centerX = x + width / 2;
        
        switch (position) {
          case 'n':
            x = centerX;
            y = y;
            break;
          case 's':
            x = centerX;
            y = y + height;
            break;
          case 'sw':
            x = x + width * 0.25;
            y = y + height;
            break;
          case 'se':
            x = x + width * 0.75;
            y = y + height;
            break;
          case 'w':
            x = x + width * 0.25;
            y = y + height / 2;
            break;
          case 'e':
            x = x + width * 0.75;
            y = y + height / 2;
            break;
          // nw and ne are hidden for triangles
        }
      } else {
        // Default rectangle behavior
        switch (position) {
          case 'n':
            x += width / 2;
            break;
          case 's':
            x += width / 2;
            y += height;
            break;
          case 'w':
            y += height / 2;
            break;
          case 'e':
            x += width;
            y += height / 2;
            break;
          case 'nw':
            break;
          case 'ne':
            x += width;
            break;
          case 'sw':
            y += height;
            break;
          case 'se':
            x += width;
            y += height;
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
    border: '1px solid hsl(var(--foreground)/0.25)',
    borderRadius: '50%', // Make them circular
    zIndex: 100,
    pointerEvents: 'auto',
    touchAction: 'none',
    cursor: 'crosshair',
  };
  
  // Get shape-specific handle positions
  const getHandlePositions = () => {
    const basePositions = {
      n: { top: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
      s: { bottom: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
      w: { left: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
      e: { right: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
      nw: { top: -handleSize / 2 - handleOffset, left: -handleSize / 2 - handleOffset },
      ne: { top: -handleSize / 2 - handleOffset, right: -handleSize / 2 - handleOffset },
      sw: { bottom: -handleSize / 2 - handleOffset, left: -handleSize / 2 - handleOffset },
      se: { bottom: -handleSize / 2 - handleOffset, right: -handleSize / 2 - handleOffset },
    };
    
    // Adjust positions based on shape type
    if (node.type === 'circle') {
      // For circles, position all points directly on the circle's edge
      const radius = Math.min(node.dimensions?.width || 0, node.dimensions?.height || 0) / 2;
      const diagonalOffset = radius * 0.7071; // cos(45°) = sin(45°) = 0.7071
      
      return {
        // Cardinal points (N, S, E, W)
        n: { top: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
        s: { bottom: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
        w: { left: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
        e: { right: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
        
        // Corner points (NW, NE, SW, SE) - positioned directly on the circle's edge at 45° angles
        nw: { 
          top: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)`, 
          left: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)` 
        },
        ne: { 
          top: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)`, 
          right: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)` 
        },
        sw: { 
          bottom: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)`, 
          left: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)` 
        },
        se: { 
          bottom: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)`, 
          right: `calc(50% - ${diagonalOffset}px - ${handleSize / 2}px - ${handleOffset}px)` 
        }
      };
    } else if (node.type === 'diamond') {
      // For diamonds, place connection points at the vertices and corners
      // Increase the offset to position handles further away from the diamond
      const diamondOffset = 25; // Set to exactly 25 for diamonds
      
      return {
        // Place points at the four vertices of the diamond, but further out
        n: { top: -handleSize / 2 - diamondOffset, left: '50%', transform: 'translateX(-50%)' },
        s: { bottom: -handleSize / 2 - diamondOffset, left: '50%', transform: 'translateX(-50%)' },
        w: { left: -handleSize / 2 - diamondOffset, top: '50%', transform: 'translateY(-50%)' },
        e: { right: -handleSize / 2 - diamondOffset, top: '50%', transform: 'translateY(-50%)' },
        
        // Add corner points for diamonds at 45-degree angles, positioned further out
        nw: { 
          top: '25%', 
          left: '25%', 
          transform: 'translate(-250%, -250%)' // Increased offset from the corner
        },
        ne: { 
          top: '25%', 
          right: '25%', 
          transform: 'translate(250%, -250%)' // Increased offset from the corner
        },
        sw: { 
          bottom: '25%', 
          left: '25%', 
          transform: 'translate(-250%, 250%)' // Increased offset from the corner
        },
        se: { 
          bottom: '25%', 
          right: '25%', 
          transform: 'translate(250%, 250%)' // Increased offset from the corner
        }
      };
    } else if (node.type === 'triangle') {
      // For triangles, adjust points to be on the triangle's edges
      return {
        // Top point of triangle
        n: { top: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
        // Bottom left and right
        sw: { bottom: -handleSize / 2 - handleOffset, left: '25%', transform: 'translateX(-50%)' },
        s: { bottom: -handleSize / 2 - handleOffset, left: '50%', transform: 'translateX(-50%)' },
        se: { bottom: -handleSize / 2 - handleOffset, right: '25%', transform: 'translateX(50%)' },
        // Middle of left and right sides
        w: { left: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
        e: { right: -handleSize / 2 - handleOffset, top: '50%', transform: 'translateY(-50%)' },
        // We'll hide these points for triangles
        nw: { display: 'none' },
        ne: { display: 'none' },
      };
    }
    
    return basePositions;
  };
  
  const handlePositions = getHandlePositions();
  
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