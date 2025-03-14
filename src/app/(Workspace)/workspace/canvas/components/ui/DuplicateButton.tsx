'use client';

import React, { useState, useMemo, useRef } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Node, useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import { calculateConnectionPointPosition } from '@/app/(Workspace)/workspace/canvas/lib/utils/connection-utils';
import { nodeRegistry } from '@/app/(Workspace)/workspace/canvas/components/NodeRegistry';

interface DuplicateButtonProps {
  node: Node;
}

// Define the directions and their properties
type Direction = 'n' | 'e' | 's' | 'w';

interface DirectionConfig {
  icon: React.ReactNode;
  position: (dimensions: { width: number; height: number }) => { x: number; y: number };
  hoverArea: (dimensions: { width: number; height: number }) => { 
    left: number; 
    top: number; 
    width: number; 
    height: number;
  };
  duplicateOffset: (dimensions: { width: number; height: number }) => { 
    x: number; 
    y: number;
  };
  sourcePosition: Direction;
  targetPosition: Direction;
}

const DuplicateButton: React.FC<DuplicateButtonProps> = ({ node }) => {
  const [hoveredDirection, setHoveredDirection] = useState<Direction | null>(null);
  const addNode = useCanvasStore((state) => state.addNode);
  const createConnection = useCanvasStore((state) => state.createConnection);
  
  // Use refs to track hover state without causing re-renders
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef<boolean>(false);

  // Memoize the direction configs to avoid recreating on every render
  const directionConfigs = useMemo<Record<Direction, DirectionConfig>>(() => ({
    n: {
      icon: <ChevronUp className="h-4 w-4" />,
      position: (dim) => ({ 
        x: dim.width / 2 - 12, 
        y: -30 
      }),
      hoverArea: (dim) => ({ 
        left: dim.width / 4, 
        top: -40, 
        width: dim.width / 2, 
        height: 50 
      }),
      duplicateOffset: (dim) => ({ 
        x: 0, 
        y: -dim.height - 120 
      }),
      sourcePosition: 'n',
      targetPosition: 's'
    },
    e: {
      icon: <ChevronRight className="h-4 w-4" />,
      position: (dim) => ({ 
        x: dim.width + 15, 
        y: dim.height / 2 - 12 
      }),
      hoverArea: (dim) => ({ 
        left: dim.width - 10, 
        top: 0, 
        width: 50, 
        height: dim.height 
      }),
      duplicateOffset: (dim) => ({ 
        x: dim.width + 120, 
        y: 0 
      }),
      sourcePosition: 'e',
      targetPosition: 'w'
    },
    s: {
      icon: <ChevronDown className="h-4 w-4" />,
      position: (dim) => ({ 
        x: dim.width / 2 - 12, 
        y: dim.height + 15 
      }),
      hoverArea: (dim) => ({ 
        left: dim.width / 4, 
        top: dim.height - 10, 
        width: dim.width / 2, 
        height: 50 
      }),
      duplicateOffset: (dim) => ({ 
        x: 0, 
        y: dim.height + 120 
      }),
      sourcePosition: 's',
      targetPosition: 'n'
    },
    w: {
      icon: <ChevronLeft className="h-4 w-4" />,
      position: (dim) => ({ 
        x: -30, 
        y: dim.height / 2 - 12 
      }),
      hoverArea: (dim) => ({ 
        left: -40, 
        top: 0, 
        width: 50, 
        height: dim.height 
      }),
      duplicateOffset: (dim) => ({ 
        x: -dim.width - 120, 
        y: 0 
      }),
      sourcePosition: 'w',
      targetPosition: 'e'
    }
  }), []);

  // Optimized hover handlers using refs
  const handleHoverStart = (direction: Direction) => {
    isHoveringRef.current = true;
    
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    
    // Set a small delay to prevent flickering on quick mouse movements
    hoverTimerRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        setHoveredDirection(direction);
      }
    }, 50);
  };
  
  const handleHoverEnd = () => {
    isHoveringRef.current = false;
    
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    
    // Set a small delay before hiding to prevent flickering
    hoverTimerRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setHoveredDirection(null);
      }
    }, 100);
  };

  // Handle duplication in the specified direction
  const handleDuplicate = (e: React.MouseEvent, direction: Direction) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!node.dimensions) return;
    
    // Create a duplicate node
    const duplicatedNode = createDuplicateNode(direction);
    
    // If duplication was successful and we have the duplicated node
    if (duplicatedNode) {
      // Create a line connecting the original and duplicate shapes
      createConnectingLine(node, duplicatedNode, direction);
    }
  };

  // Create a duplicate node in the specified direction
  const createDuplicateNode = (direction: Direction): Node | undefined => {
    if (!node.dimensions) return undefined;
    
    // Get the configuration for this direction
    const config = directionConfigs[direction];
    
    // Calculate the offset for the duplicate
    const offset = config.duplicateOffset(node.dimensions);
    
    // Create a new ID for the duplicate
    const duplicateId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a duplicate with the new position
    const duplicate: Node = {
      ...node,
      id: duplicateId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y
      },
      selected: true
    };
    
    // Add the duplicate to the canvas
    addNode(duplicate);
    
    // Deselect all nodes and select only the duplicate
    useCanvasStore.getState().selectNode(duplicateId);
    
    return duplicate;
  };

  // Function to create a connecting line between two shapes
  const createConnectingLine = (sourceNode: Node, targetNode: Node, direction: Direction) => {
    // Get the configuration for this direction
    const config = directionConfigs[direction];
    
    // Calculate connection points
    const sourcePoint = calculateConnectionPointPosition(sourceNode, config.sourcePosition);
    const targetPoint = calculateConnectionPointPosition(targetNode, config.targetPosition);
    
    // Create a unique ID for the line
    const lineId = `line-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the line node using NodeRegistry with default settings
    const baseNode = nodeRegistry.createNode('line', { x: sourcePoint.x, y: sourcePoint.y }, lineId);
    
    // Create the line node with the correct points
    const lineNode: Node = {
      ...baseNode,
      points: [
        { x: 0, y: 0 }, // First point at origin (relative to position)
        { x: targetPoint.x - sourcePoint.x, y: targetPoint.y - sourcePoint.y } // Second point relative to first
      ]
    };
    
    // Add the line to the canvas
    addNode(lineNode);
    
    // Create connections for both endpoints
    createConnection({
      sourceNodeId: lineId,
      sourcePointIndex: 0,
      targetNodeId: sourceNode.id,
      targetPosition: config.sourcePosition
    });
    
    createConnection({
      sourceNodeId: lineId,
      sourcePointIndex: 1,
      targetNodeId: targetNode.id,
      targetPosition: config.targetPosition
    });
  };

  // Common styles for the button
  const getButtonStyle = (direction: Direction): React.CSSProperties => {
    if (!node.dimensions) return {};
    
    const config = directionConfigs[direction];
    const position = config.position(node.dimensions);
    
    return {
      position: 'absolute',
      left: position.x,
      top: position.y,
      zIndex: 1000,
      opacity: hoveredDirection === direction ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out',
      pointerEvents: hoveredDirection === direction ? 'auto' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: 'hsl(var(--background) / 0.8)',
      backdropFilter: 'blur(4px)',
      cursor: 'pointer',
    };
  };

  // Create hover areas for each direction
  const getHoverAreaStyle = (direction: Direction): React.CSSProperties => {
    if (!node.dimensions) return {};
    
    const config = directionConfigs[direction];
    const area = config.hoverArea(node.dimensions);
    
    return {
      position: 'absolute',
      left: area.left,
      top: area.top,
      width: area.width,
      height: area.height,
      zIndex: 999,
      cursor: 'pointer',
    };
  };

  // Only render if we have dimensions
  if (!node.dimensions) return null;

  return (
    <LazyMotion features={domAnimation}>
      {/* Render hover areas and buttons for each direction */}
      {Object.entries(directionConfigs).map(([dir, config]) => {
        const direction = dir as Direction;
        return (
          <React.Fragment key={direction}>
            {/* Hover detection area */}
            <div
              style={getHoverAreaStyle(direction)}
              onMouseEnter={() => handleHoverStart(direction)}
              onMouseLeave={handleHoverEnd}
            />
            
            {/* Button that appears on hover */}
            <m.div
              style={getButtonStyle(direction)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleDuplicate(e, direction)}
            >
              {config.icon}
            </m.div>
          </React.Fragment>
        );
      })}
    </LazyMotion>
  );
};

export default DuplicateButton; 