import React from 'react';
import { Node } from '../../lib/store/canvas-store';
import ResizeHandles, { ResizeHandleDirection } from '../ui/ResizeHandles';
import ConnectionPoints, { ConnectionPointPosition } from '../ui/ConnectionPoints';
import LineShape from './LineShape';
import LineResizeHandles from '../ui/LineResizeHandles';

interface ShapeRendererProps {
  node: Node;
  isSelected?: boolean;
  activeTool: string;
  onSelect: (id: string) => void;
  onResize: (nodeId: string, direction: ResizeHandleDirection, dx: number, dy: number) => void;
  onConnectionPointClick: (nodeId: string, position: ConnectionPointPosition) => void;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  node,
  isSelected = false,
  activeTool,
  onSelect,
  onResize,
  onConnectionPointClick
}) => {
  const { id, type, position, dimensions, style, data } = node;

  if (!dimensions) return null;

  // Determine if we should show connection points
  const showConnectionPoints = ['arrow', 'line'].includes(activeTool) && 
                             !data?.isGroup && 
                             !node.points;

  // Always enable pointer events for the container when line/arrow tool is active
  const pointerEventsValue = isSelected || ['arrow', 'line'].includes(activeTool) ? 'auto' : 'none';

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    pointerEvents: pointerEventsValue,
    zIndex: isSelected ? 10 : 1, // Ensure selected nodes are on top
  };

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

  const renderShape = () => {
    switch (type) {
      case 'rectangle':
        return <div style={baseStyle} />;

      case 'circle':
        return <div style={{ ...baseStyle, borderRadius: '50%' }} />;

      case 'diamond':
        return (
          <div 
            style={{ 
              ...baseStyle,
              transform: 'rotate(45deg)',
              transformOrigin: 'center'
            }} 
          />
        );

      case 'cylinder':
        const cylinderTopRadius = '50% 50% 0 0 / 20% 20% 0 0';
        const customRadius = (style?.borderRadius as string) || '0px';
        const radiusValue = parseInt((customRadius.match(/\d+/) || ['0'])[0], 10);
        const cylinderBottomRadius = `0 0 ${radiusValue * 2}% ${radiusValue * 2}% / 0 0 ${radiusValue}% ${radiusValue}%`;
        
        return (
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

      case 'triangle':
        return (
          <svg 
            width={dimensions.width} 
            height={dimensions.height} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <polygon 
              points={`${dimensions.width/2},0 0,${dimensions.height} ${dimensions.width},${dimensions.height}`}
              fill={style?.backgroundColor as string || 'transparent'}
              stroke={style?.borderColor as string || 'black'}
              strokeWidth={style?.borderWidth as number || 2}
              strokeLinejoin="round"
              strokeDasharray={style?.borderStyle === 'dashed' ? '5,5' : style?.borderStyle === 'dotted' ? '2,2' : 'none'}
            />
          </svg>
        );

      case 'arrow':
      case 'line':
        if (node.points && node.points.length > 1) {
          return <LineShape node={node} isSelected={isSelected} />;
        }
        return null;

      default:
        return <div style={baseStyle} />;
    }
  };

  // Handle connection point click
  const handleConnectionPointClick = (nodeId: string, position: ConnectionPointPosition) => {
    onConnectionPointClick(nodeId, position);
  };

  return (
    <div 
      style={containerStyle}
      className={`node ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (activeTool === 'select') {
          onSelect(id);
        }
      }}
    >
      {renderShape()}
      {isSelected && dimensions && (
        <>
          {['line', 'arrow'].includes(type) && node.points && node.points.length >= 2 ? (
            <LineResizeHandles 
              node={node} 
              onResize={onResize} 
            />
          ) : (
            <ResizeHandles 
              node={node} 
              onResize={onResize} 
            />
          )}
        </>
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

export default ShapeRenderer; 