import React from 'react';
import { Node, MarkerShape, FillStyle } from '../../lib/store/canvas-store';
import Marker from './Marker';

interface LineShapeProps {
  node: Node;
  isSelected: boolean;
  selectedEndpoint?: number;
}

const LineShape: React.FC<LineShapeProps> = ({ node, isSelected }) => {
  const { points, style, type, data } = node;

  // Extract marker settings from node data
  const startMarker = (data?.startMarker as MarkerShape) || 'none';
  const endMarker = (data?.endMarker as MarkerShape) || (type === 'arrow' ? 'triangle' : 'none');
  const markerFillStyle = (data?.markerFillStyle as FillStyle) || 'filled';
  const lineType = (data?.lineType as string) || 'straight';

  if (!points || points.length < 2) return null;

  // Create SVG path from points
  let pathData = '';
  
  if (lineType === 'elbow') {
    // For elbow connectors, use a path that connects all points
    pathData = points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${path} L ${point.x} ${point.y}`;
    }, '');
  } else {
    // For straight lines, just connect the first and last points
    pathData = `M ${points[0].x} ${points[0].y} L ${points[points.length-1].x} ${points[points.length-1].y}`;
  }

  // Calculate angles for markers
  let startAngle = 0;
  let endAngle = 0;

  if (lineType === 'elbow' && points.length > 2) {
    // For elbow connectors, use the angle of the first segment for start marker
    startAngle = Math.atan2(
      points[1].y - points[0].y,
      points[1].x - points[0].x
    ) * 180 / Math.PI;
    
    // And the angle of the last segment for end marker
    const lastIndex = points.length - 1;
    endAngle = Math.atan2(
      points[lastIndex].y - points[lastIndex-1].y,
      points[lastIndex].x - points[lastIndex-1].x
    ) * 180 / Math.PI;
  } else {
    // For straight lines, calculate the angle between endpoints
    startAngle = Math.atan2(
      points[points.length-1].y - points[0].y,
      points[points.length-1].x - points[0].x
    ) * 180 / Math.PI;
    
    endAngle = startAngle;
  }

  // Get color for markers
  const markerColor = (style?.borderColor as string) || 'black';

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
        stroke={markerColor}
        strokeWidth={(style?.borderWidth as number) || 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={(style?.borderStyle as string) === 'dashed' ? '5,5' : (style?.borderStyle as string) === 'dotted' ? '2,2' : 'none'}
      />
      
      {/* Start marker */}
      {startMarker !== 'none' && (
        <Marker
          shape={startMarker}
          fillStyle={markerFillStyle}
          isStart={true}
          color={markerColor}
          x={points[0].x}
          y={points[0].y}
          angle={startAngle}
        />
      )}
      
      {/* End marker */}
      {endMarker !== 'none' && (
        <Marker
          shape={endMarker}
          fillStyle={markerFillStyle}
          isStart={false}
          color={markerColor}
          x={points[points.length-1].x}
          y={points[points.length-1].y}
          angle={endAngle}
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