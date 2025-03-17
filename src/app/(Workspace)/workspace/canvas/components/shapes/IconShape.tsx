'use client';

import React from 'react';
import { Node } from '../../lib/store/canvas-store';
import { iconMap } from '../../lib/icons';

interface IconShapeProps {
  node: Node;
}

const IconShape: React.FC<IconShapeProps> = ({ node }) => {
  const { style, data, dimensions } = node;
  
  // Get the icon name from the node data
  const iconName = data?.iconName as string;
  
  // Get the icon color from the style or use a default
  const iconColor = (style?.iconColor as string) || 'black';
  
  // Get the stroke width from the data first, then style, or use a default
  const getStrokeWidth = () => {
    if (data?.iconStrokeWidth !== undefined) {
      return typeof data.iconStrokeWidth === 'number' ? data.iconStrokeWidth : parseFloat(data.iconStrokeWidth as string);
    }
    
    if (style?.iconStrokeWidth !== undefined) {
      return typeof style.iconStrokeWidth === 'number' ? style.iconStrokeWidth : parseFloat(style.iconStrokeWidth as string);
    }
    
    return 2; // Default stroke width
  };
  
  // We still need to get the stroke width
  const strokeWidth = getStrokeWidth();
  
  // Calculate the size to fit within the node dimensions
  // Use the node dimensions directly to ensure the icon fills the shape
  const size = Math.min(dimensions?.width || 48, dimensions?.height || 48);
  
  // Get the icon component from the map
  const IconComponent = iconName ? iconMap[iconName] : null;
  
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}
    >
      {IconComponent ? (
        <IconComponent 
          size={size} 
          color={iconColor} 
          strokeWidth={strokeWidth}
        />
      ) : (
        <div style={{ color: 'red', fontSize: '12px', textAlign: 'center' }}>
          {iconName ? `Icon "${iconName}" not found` : 'No icon selected'}
        </div>
      )}
    </div>
  );
};

// Add display name
IconShape.displayName = 'IconShape';

export default IconShape; 