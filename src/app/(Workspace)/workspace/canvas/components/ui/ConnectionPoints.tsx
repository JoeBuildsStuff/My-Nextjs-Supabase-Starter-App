'use client';

import React from 'react';
import { Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

export type ConnectionPointPosition = 
  | 'n' | 's' | 'e' | 'w'  // Cardinal directions
  | 'nw' | 'ne' | 'sw' | 'se';  // Corners

interface ConnectionPointsProps {
  node: Node;
  onConnectionPointClick: (nodeId: string, position: ConnectionPointPosition) => void;
}

const ConnectionPoints: React.FC<ConnectionPointsProps> = ({ node, onConnectionPointClick }) => {
  const handleSize = 10; // Increased size for better clickability
  const handleOffset = 5; // Closer to the shape than resize handles
  
  // Handle interaction with a connection point
  const handleInteraction = (e: React.MouseEvent, position: ConnectionPointPosition) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onConnectionPointClick && node.dimensions) {
      onConnectionPointClick(node.id, position);
    }
  };
  
  // Common styles for all connection points
  const commonHandleStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${handleSize}px`,
    height: `${handleSize}px`,
    backgroundColor: 'hsl(var(--background))',
    border: '3px solid hsl(var(--primary))',
    borderRadius: '50%', // Make them circular
    zIndex: 1000, // Increased z-index to ensure they're on top
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
          onClick={(e) => handleInteraction(e, position as ConnectionPointPosition)}
          onMouseDown={(e) => handleInteraction(e, position as ConnectionPointPosition)}
          className="connection-point"
          data-testid={`connection-point-${position}`}
        />
      ))}
    </>
  );
};

export default ConnectionPoints; 