'use client';

import React, { useMemo } from 'react';
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

export type ConnectionPointPosition = 
  | 'n' | 's' | 'e' | 'w'  // Cardinal directions
  | 'nw' | 'ne' | 'sw' | 'se';  // Corners

interface ConnectionPointsProps {
  node: Node;
  onConnectionPointClick: (nodeId: string, position: ConnectionPointPosition) => void;
  hoveredPosition?: ConnectionPointPosition;
  onConnectionPointHover?: (position: ConnectionPointPosition | null) => void;
  showAll?: boolean; // Re-add the showAll prop
}

// Define a type for connection point style
type ConnectionPointStyle = Record<ConnectionPointPosition, React.CSSProperties>;

// Constants
const HANDLE_SIZE = 10; // Increased size for better clickability
// Define trigonometric constant at module level to avoid recalculation
const COS_45_DEG = 0.7071; // cos(45°) = sin(45°) = 0.7071

/**
 * Get base connection point positions for rectangular shapes
 */
const getRectanglePositions = (width: number, height: number): ConnectionPointStyle => ({
  // Cardinal points
  n: { top: 0, left: '50%', transform: 'translate(-50%, -50%)' },
  s: { top: height, left: '50%', transform: 'translate(-50%, -50%)' },
  w: { top: '50%', left: 0, transform: 'translate(-50%, -50%)' },
  e: { top: '50%', left: width, transform: 'translate(-50%, -50%)' },
  
  // Corner points
  nw: { top: 0, left: 0, transform: 'translate(-50%, -50%)' },
  ne: { top: 0, left: width, transform: 'translate(-50%, -50%)' },
  sw: { top: height, left: 0, transform: 'translate(-50%, -50%)' },
  se: { top: height, left: width, transform: 'translate(-50%, -50%)' },
});

/**
 * Get connection point positions for circle shapes
 */
const getCirclePositions = (width: number, height: number): ConnectionPointStyle => {
  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const diagonalOffset = radius * COS_45_DEG; // Using the constant defined at module level
  
  return {
    // Cardinal points (N, S, E, W)
    n: { top: centerY - radius, left: centerX, transform: 'translate(-50%, -50%)' },
    s: { top: centerY + radius, left: centerX, transform: 'translate(-50%, -50%)' },
    w: { top: centerY, left: centerX - radius, transform: 'translate(-50%, -50%)' },
    e: { top: centerY, left: centerX + radius, transform: 'translate(-50%, -50%)' },
    
    // Corner points positioned at 45° angles
    nw: { 
      top: centerY - diagonalOffset, 
      left: centerX - diagonalOffset,
      transform: 'translate(-50%, -50%)'
    },
    ne: { 
      top: centerY - diagonalOffset, 
      left: centerX + diagonalOffset,
      transform: 'translate(-50%, -50%)'
    },
    sw: { 
      top: centerY + diagonalOffset, 
      left: centerX - diagonalOffset,
      transform: 'translate(-50%, -50%)'
    },
    se: { 
      top: centerY + diagonalOffset, 
      left: centerX + diagonalOffset,
      transform: 'translate(-50%, -50%)'
    }
  };
};

/**
 * Get connection point positions for triangle shapes
 */
const getTrianglePositions = (width: number, height: number): ConnectionPointStyle => {
  // Calculate positions for a triangle with top point at center top
  // and base along the bottom

  return {
    // Top point
    n: { top: 0, left: width / 2, transform: 'translate(-50%, -50%)' },
    
    // Bottom corners
    sw: { top: height, left: 0, transform: 'translate(-50%, -50%)' },
    se: { top: height, left: width, transform: 'translate(-50%, -50%)' },
    
    // Middle of bottom edge
    s: { top: height, left: width / 2, transform: 'translate(-50%, -50%)' },
    
    // Middle of left and right edges
    w: { top: height / 2, left: width / 4, transform: 'translate(-50%, -50%)' },
    e: { top: height / 2, left: width * 3 / 4, transform: 'translate(-50%, -50%)' },
    
    // Hide the nw and ne points for triangles
    nw: { display: 'none' },
    ne: { display: 'none' }
  };
};

// Common styles for all connection points
const getCommonHandleStyle = (isHovered: boolean): React.CSSProperties => {
  const size = isHovered ? HANDLE_SIZE + 4 : HANDLE_SIZE;
  
  return {
    position: 'absolute',
    width: size,
    height: size,
    backgroundColor: isHovered ? 'hsl(var(--primary))' : 'hsl(var(--background))',
    border: isHovered ? '3px solid hsl(var(--background))' : '3px solid hsl(var(--primary))',
    borderRadius: '50%', // Make them circular
    zIndex: isHovered ? 1001 : 1000,
    pointerEvents: 'auto',
    touchAction: 'none',
    cursor: 'crosshair',
    // Ensure the center of the handle stays fixed regardless of size changes
    marginLeft: -(size / 2),
    marginTop: -(size / 2),
    transform: 'none', // Remove transform since we're using margins for positioning
  };
};

const ConnectionPoints: React.FC<ConnectionPointsProps> = ({ 
  node, 
  onConnectionPointClick, 
  hoveredPosition, 
  onConnectionPointHover,
  showAll = false // Default to false for backward compatibility
}) => {
  // Handle interaction with a connection point
  const handleInteraction = (e: React.MouseEvent, position: ConnectionPointPosition) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onConnectionPointClick && node.dimensions) {
      onConnectionPointClick(node.id, position);
    }
  };
  
  // Memoize handle positions calculation to prevent recalculation on every render
  const handlePositions = useMemo(() => {
    if (!node.dimensions) {
      return getRectanglePositions(0, 0);
    }
    
    const { width, height } = node.dimensions;
    
    switch (node.type) {
      case 'circle':
        return getCirclePositions(width, height);
      case 'diamond':
        return getRectanglePositions(width, height); // Use rectangle positions for diamond
      case 'triangle':
        return getTrianglePositions(width, height);
      default:
        return getRectanglePositions(width, height);
    }
  }, [node.dimensions, node.type]); // Only recalculate when dimensions or type changes
  
  // Memoize container style to prevent recalculation on every render
  const containerStyle = useMemo((): React.CSSProperties => 
    node.type === 'diamond' 
      ? { 
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
        } 
      : {
          position: 'absolute',
          width: '100%',
          height: '100%',
        }
  , [node.type]); // Only recalculate when node type changes
  
  // Determine if the node is being interacted with (for conditional rendering)
  const isNodeInteractive = hoveredPosition !== undefined || showAll;
  
  return (
    <LazyMotion features={domAnimation}>
      {/* Connection points container with rotation for diamond */}
      <div style={containerStyle}>
        {/* Connection points */}
        {Object.entries(handlePositions).map(([position, style]) => {
          const positionKey = position as ConnectionPointPosition;
          const isHovered = hoveredPosition === positionKey;
          
          // Improved conditional rendering - only render if:
          // 1. The point is hovered, OR
          // 2. showAll is true, OR
          // 3. The node is being interacted with (any point is hovered)
          if (!isHovered && !showAll && !isNodeInteractive) {
            return null;
          }
          
          // Create a modified style that works with our new positioning approach
          const modifiedStyle = { ...style };
          
          // Remove transform from the position style since we're handling it differently now
          if (modifiedStyle.transform && modifiedStyle.transform.includes('translate')) {
            delete modifiedStyle.transform;
          }
          
          return (
            <m.div
              key={`connection-${position}`}
              style={{
                ...getCommonHandleStyle(isHovered),
                ...modifiedStyle,
              }}
              onClick={(e: React.MouseEvent) => handleInteraction(e, positionKey)}
              onMouseDown={(e: React.MouseEvent) => handleInteraction(e, positionKey)}
              onMouseEnter={() => onConnectionPointHover?.(positionKey)}
              onMouseLeave={() => onConnectionPointHover?.(null)}
              className="connection-point"
              data-testid={`connection-point-${position}`}
              // Only apply animations to hovered points for better performance
              animate={isHovered ? {
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.7)',
                  '0 0 0 12px rgba(59, 130, 246, 0)',
                  '0 0 0 0 rgba(59, 130, 246, 0)'
                ]
              } : undefined}
              transition={isHovered ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : undefined}
            />
          );
        })}
      </div>
    </LazyMotion>
  );
};

export default ConnectionPoints; 