'use client';

import React from 'react';
import { Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

export type ConnectionPointPosition = 
  | 'n' | 's' | 'e' | 'w'  // Cardinal directions
  | 'nw' | 'ne' | 'sw' | 'se';  // Corners

interface ConnectionPointsProps {
  node: Node;
  onConnectionPointClick: (nodeId: string, position: ConnectionPointPosition) => void;
  hoveredPosition?: ConnectionPointPosition;
  onConnectionPointHover?: (position: ConnectionPointPosition | null) => void;
  showAll?: boolean;
}

// Define a type for connection point style
type ConnectionPointStyle = Record<ConnectionPointPosition, React.CSSProperties>;

// Constants
const HANDLE_SIZE = 10; // Increased size for better clickability
const HANDLE_OFFSET = 5; // Closer to the shape than resize handles
const DIAMOND_OFFSET = 25; // Special offset for diamond shapes

/**
 * Get base connection point positions for rectangular shapes
 */
const getRectanglePositions = (): ConnectionPointStyle => ({
  n: { top: -HANDLE_SIZE / 2 - HANDLE_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  s: { bottom: -HANDLE_SIZE / 2 - HANDLE_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  w: { left: -HANDLE_SIZE / 2 - HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' },
  e: { right: -HANDLE_SIZE / 2 - HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' },
  nw: { top: -HANDLE_SIZE / 2 - HANDLE_OFFSET, left: -HANDLE_SIZE / 2 - HANDLE_OFFSET },
  ne: { top: -HANDLE_SIZE / 2 - HANDLE_OFFSET, right: -HANDLE_SIZE / 2 - HANDLE_OFFSET },
  sw: { bottom: -HANDLE_SIZE / 2 - HANDLE_OFFSET, left: -HANDLE_SIZE / 2 - HANDLE_OFFSET },
  se: { bottom: -HANDLE_SIZE / 2 - HANDLE_OFFSET, right: -HANDLE_SIZE / 2 - HANDLE_OFFSET },
});

/**
 * Get connection point positions for circle shapes
 */
const getCirclePositions = (width: number, height: number): ConnectionPointStyle => {
  const radius = Math.min(width, height) / 2;
  const diagonalOffset = radius * 0.7071; // cos(45°) = sin(45°) = 0.7071
  const halfHandleSize = HANDLE_SIZE / 2;
  
  return {
    // Cardinal points (N, S, E, W)
    n: { top: -halfHandleSize - HANDLE_OFFSET, left: '50%', transform: 'translateX(-50%)' },
    s: { bottom: -halfHandleSize - HANDLE_OFFSET, left: '50%', transform: 'translateX(-50%)' },
    w: { left: -halfHandleSize - HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' },
    e: { right: -halfHandleSize - HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' },
    
    // Corner points positioned at 45° angles
    nw: { 
      top: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)`, 
      left: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)` 
    },
    ne: { 
      top: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)`, 
      right: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)` 
    },
    sw: { 
      bottom: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)`, 
      left: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)` 
    },
    se: { 
      bottom: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)`, 
      right: `calc(50% - ${diagonalOffset}px - ${halfHandleSize}px - ${HANDLE_OFFSET}px)` 
    }
  };
};

/**
 * Get connection point positions for diamond shapes
 */
const getDiamondPositions = (): ConnectionPointStyle => ({
  // Cardinal points
  n: { top: -HANDLE_SIZE / 2 - DIAMOND_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  s: { bottom: -HANDLE_SIZE / 2 - DIAMOND_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  w: { left: -HANDLE_SIZE / 2 - DIAMOND_OFFSET, top: '50%', transform: 'translateY(-50%)' },
  e: { right: -HANDLE_SIZE / 2 - DIAMOND_OFFSET, top: '50%', transform: 'translateY(-50%)' },
  
  // Corner points
  nw: { top: '25%', left: '25%', transform: 'translate(-250%, -250%)' },
  ne: { top: '25%', right: '25%', transform: 'translate(250%, -250%)' },
  sw: { bottom: '25%', left: '25%', transform: 'translate(-250%, 250%)' },
  se: { bottom: '25%', right: '25%', transform: 'translate(250%, 250%)' }
});

/**
 * Get connection point positions for triangle shapes
 */
const getTrianglePositions = (): ConnectionPointStyle => ({
  // Top point
  n: { top: -HANDLE_SIZE / 2 - HANDLE_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  // Bottom points
  sw: { bottom: -HANDLE_SIZE / 2 - HANDLE_OFFSET, left: '25%', transform: 'translateX(-50%)' },
  s: { bottom: -HANDLE_SIZE / 2 - HANDLE_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  se: { bottom: -HANDLE_SIZE / 2 - HANDLE_OFFSET, right: '25%', transform: 'translateX(50%)' },
  // Side points
  w: { left: -HANDLE_SIZE / 2 - HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' },
  e: { right: -HANDLE_SIZE / 2 - HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' },
  // Hidden points
  nw: { display: 'none' },
  ne: { display: 'none' }
});

// Common styles for all connection points
const getCommonHandleStyle = (isHovered: boolean): React.CSSProperties => ({
  position: 'absolute',
  width: isHovered ? HANDLE_SIZE + 4 : HANDLE_SIZE,
  height: isHovered ? HANDLE_SIZE + 4 : HANDLE_SIZE,
  backgroundColor: isHovered ? 'hsl(var(--primary))' : 'hsl(var(--background))',
  border: isHovered ? '3px solid hsl(var(--background))' : '3px solid hsl(var(--primary))',
  borderRadius: '50%', // Make them circular
  zIndex: isHovered ? 1001 : 1000,
  pointerEvents: 'auto',
  touchAction: 'none',
  cursor: 'crosshair',
  transition: 'all 0.1s ease-in-out',
  animation: isHovered ? 'pulse 1.5s infinite' : 'none'
});

const ConnectionPoints: React.FC<ConnectionPointsProps> = ({ 
  node, 
  onConnectionPointClick, 
  hoveredPosition, 
  onConnectionPointHover, 
  showAll = false 
}) => {
  // Handle interaction with a connection point
  const handleInteraction = (e: React.MouseEvent, position: ConnectionPointPosition) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onConnectionPointClick && node.dimensions) {
      onConnectionPointClick(node.id, position);
    }
  };
  
  // Get shape-specific handle positions
  const getHandlePositions = (): ConnectionPointStyle => {
    if (!node.dimensions) {
      return getRectanglePositions();
    }
    
    const { width, height } = node.dimensions;
    
    switch (node.type) {
      case 'circle':
        return getCirclePositions(width, height);
      case 'diamond':
        return getDiamondPositions();
      case 'triangle':
        return getTrianglePositions();
      default:
        return getRectanglePositions();
    }
  };
  
  const handlePositions = getHandlePositions();
  
  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            transform: scale(1.3);
            box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        @keyframes glow {
          0% {
            box-shadow: 0 0 5px 2px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 15px 5px rgba(59, 130, 246, 0.8);
          }
          100% {
            box-shadow: 0 0 5px 2px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
      
      {/* Connection points */}
      {Object.entries(handlePositions).map(([position, style]) => {
        const isHovered = hoveredPosition === position;
        
        // Only show connection points if showAll is true or the shape is hovered
        if (!showAll && !isHovered) return null;
        
        return (
          <div
            key={`connection-${position}`}
            style={{
              ...getCommonHandleStyle(isHovered),
              ...style,
            }}
            onClick={(e) => handleInteraction(e, position as ConnectionPointPosition)}
            onMouseDown={(e) => handleInteraction(e, position as ConnectionPointPosition)}
            onMouseEnter={() => onConnectionPointHover?.(position as ConnectionPointPosition | null)}
            onMouseLeave={() => onConnectionPointHover?.(null)}
            className="connection-point"
            data-testid={`connection-point-${position}`}
          />
        );
      })}
    </>
  );
};

export default ConnectionPoints; 