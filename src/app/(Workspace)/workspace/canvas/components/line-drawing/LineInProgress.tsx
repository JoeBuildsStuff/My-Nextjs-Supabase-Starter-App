import React from 'react';
import { Node, MarkerShape, FillStyle } from '../../lib/store/canvas-store';
import Marker from '../shapes/Marker';

interface LineInProgressProps {
  lineInProgress: Node;
}

const LineInProgress: React.FC<LineInProgressProps> = ({
  lineInProgress
}) => {
  const { position, dimensions, points, style, type, data } = lineInProgress;

  // Extract marker settings from node data
  const startMarker = (data?.startMarker as MarkerShape) || 'none';
  const endMarker = (data?.endMarker as MarkerShape) || (type === 'arrow' ? 'triangle' : 'none');
  const markerFillStyle = (data?.markerFillStyle as FillStyle) || 'filled';

  if (!points || points.length < 1 || !dimensions) return null;

  // Get color for markers
  const markerColor = (style?.borderColor as string) || 'black';

  // Calculate angles for markers if we have enough points
  let startAngle = 0;
  let endAngle = 0;

  if (points.length > 1) {
    startAngle = Math.atan2(
      points[1].y - points[0].y,
      points[1].x - points[0].x
    ) * 180 / Math.PI;

    endAngle = Math.atan2(
      points[points.length-1].y - points[points.length-2].y,
      points[points.length-1].x - points[points.length-2].x
    ) * 180 / Math.PI;
  }

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
          stroke={markerColor}
          strokeWidth={(style?.borderWidth as number) || 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={(style?.borderStyle as string) === 'dashed' ? '5,5' : (style?.borderStyle as string) === 'dotted' ? '2,2' : 'none'}
        />
        
        {/* Start marker */}
        {startMarker !== 'none' && points.length > 1 && (
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
        {endMarker !== 'none' && points.length > 1 && (
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