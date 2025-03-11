import React from 'react';
import { Node } from '../../lib/store/canvas-store';

interface LineInProgressProps {
  lineInProgress: Node;
}

const LineInProgress: React.FC<LineInProgressProps> = ({
  lineInProgress
}) => {
  const { position, dimensions, points, style, type } = lineInProgress;

  if (!points || points.length < 1 || !dimensions) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        pointerEvents: 'none',
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible'
        }}
      >
        {/* Main path */}
        <path 
          d={points.reduce((path, point, index) => {
            if (index === 0) {
              return `M ${point.x} ${point.y}`;
            }
            return `${path} L ${point.x} ${point.y}`;
          }, '')}
          fill="none"
          stroke={(style?.borderColor as string) || 'black'}
          strokeWidth={(style?.borderWidth as number) || 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={(style?.borderStyle as string) === 'dashed' ? '5,5' : (style?.borderStyle as string) === 'dotted' ? '2,2' : 'none'}
        />
        
        {/* Arrow head if needed */}
        {type === 'arrow' && points.length > 1 && (
          <polygon 
            points="0,0 -10,5 -10,-5"
            fill={(style?.borderColor as string) || 'black'}
            transform={`translate(${points[points.length-1].x}, ${points[points.length-1].y}) rotate(${Math.atan2(
              points[points.length-1].y - points[points.length-2].y,
              points[points.length-1].x - points[points.length-2].x
            ) * 180 / Math.PI})`}
          />
        )}
        
        {/* Control points */}
        {points.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={6}
            className="stroke-border stroke-[1.5] cursor-move fill-background"
          />
        ))}
      </svg>
    </div>
  );
};

export default LineInProgress; 