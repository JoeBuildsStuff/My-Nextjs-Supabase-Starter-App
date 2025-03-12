import React from 'react';
import { Node } from '../../lib/store/canvas-store';

interface LineShapeProps {
  node: Node;
  isSelected: boolean;
  selectedEndpoint?: number;
}

const LineShape: React.FC<LineShapeProps> = ({ node, isSelected }) => {
  const { points, style, type } = node;

  if (!points || points.length < 2) return null;

  // Create SVG path from points
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  return (
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
      <path 
        d={pathData}
        fill="none"
        stroke={(style?.borderColor as string) || 'black'}
        strokeWidth={(style?.borderWidth as number) || 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={(style?.borderStyle as string) === 'dashed' ? '5,5' : (style?.borderStyle as string) === 'dotted' ? '2,2' : 'none'}
      />
      
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
      
      {/* Control points for selected lines */}
      {isSelected && points.map((point, index) => {
        // Determine if this point is an endpoint (first or last point)
        const isEndpoint = index === 0 || index === points.length - 1;
        
        // Use different styling for endpoints vs. middle points
        const radius = 6;
        const fillColor = 'hsl(var(--background))';
        const strokeColor = 'hsl(var(--border))';
        const strokeWidth = 1.5;
        
        return (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className={`cursor-move ${isEndpoint ? 'endpoint' : ''}`}
          />
        );
      })}
    </svg>
  );
};

export default LineShape; 