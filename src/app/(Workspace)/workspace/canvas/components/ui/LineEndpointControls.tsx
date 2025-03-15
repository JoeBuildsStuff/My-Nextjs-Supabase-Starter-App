'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Minus, 
  Circle,
  Triangle,
  CornerUpRight,
  MoveUpRight,
  Square,
  Diamond
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore, MarkerShape, FillStyle } from '../../lib/store/canvas-store';
import { updateAllLineConnections } from '../../lib/utils/connection-utils';
import { useTailwindColors } from '../../lib/utils/use-tailwind-colors';

// Define types
type LineType = 'straight' | 'elbow';

interface LineEndpointConfig {
  lineType: LineType;
  fillStyle: FillStyle;
  startMarker: MarkerShape;
  endMarker: MarkerShape;
}

interface LineEndpointProps {
  defaultConfig?: LineEndpointConfig;
  onChange?: (config: LineEndpointConfig) => void;
}

// Marker component for consistent rendering
const Marker: React.FC<{ 
  shape: MarkerShape; 
  fillStyle: FillStyle; 
  isStart: boolean;
  className?: string;
  fillColor?: string;
  strokeColor?: string;
}> = ({ shape, fillStyle, isStart, className = '', fillColor, strokeColor }) => {
  if (shape === 'none') return null;
  
  const isFilled = fillStyle === 'filled';
  const fillValue = isFilled && fillColor ? fillColor : 'none';
  const marginClass = isStart ? '-mr-1' : '-ml-1';
  
  const renderShape = () => {
    switch (shape) {
      case 'triangle':
        return (
          <Triangle 
            className={`${isStart ? '-rotate-90' : 'rotate-90'} ${marginClass} ${className}`} 
            style={{
              width: '12px', 
              height: '12px',
              fill: fillValue,
              stroke: strokeColor
            }}
          />
        );
      case 'circle':
        return (
          <Circle 
            className={`${marginClass} ${className}`} 
            style={{
              width: '12px', 
              height: '12px',
              fill: fillValue,
              stroke: strokeColor
            }}
          />
        );
      case 'square':
        return (
          <Square 
            className={`${marginClass} ${className}`} 
            style={{
              width: '12px', 
              height: '12px',
              fill: fillValue,
              stroke: strokeColor
            }}
          />
        );
      case 'diamond':
        return (
          <Diamond 
            className={`${marginClass} ${className}`} 
            style={{
              width: '14px', 
              height: '14px',
              fill: fillValue,
              stroke: strokeColor
            }}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="flex items-center">
      {isStart ? (
        <>
          {renderShape()}
          <Minus className="w-3 h-3" style={{ stroke: strokeColor }} />
        </>
      ) : (
        <>
          <Minus className="w-3 h-3" style={{ stroke: strokeColor }} />
          {renderShape()}
        </>
      )}
    </div>
  );
};

// Toggle section component for DRY code
const ToggleSection: React.FC<{
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
  }>;
  onChange: (value: string) => void;
  className?: string;
}> = ({ label, value, options, onChange, className = '' }) => (
  <div className={`flex flex-col ${className}`}>
    <div className="flex items-center justify-between">
      <Label className="text-xs text-muted-foreground mb-2 block">{label}</Label>
    </div>
    <ToggleGroup 
      className="w-full justify-start gap-2" 
      type="single" 
      value={value} 
      onValueChange={(value) => value && onChange(value)}
    >
      {options.map(option => (
        <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
          {option.icon}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);

// Main component
const LineEndpointControls: React.FC<LineEndpointProps> = ({ 
  defaultConfig,
  onChange 
}) => {
  // Get marker settings from canvas store
  const { 
    startMarker, 
    endMarker, 
    markerFillStyle,
    setStartMarker,
    setEndMarker,
    setMarkerFillStyle,
    updateSelectedLineMarkers,
    strokeColor,
    fillColor,
    updateColorsForTheme
  } = useCanvasStore();
  
  // Use the tailwind colors hook for theme-aware color handling
  const {
    getColorHsl,
    hasThemeChanged,
    isDarkMode
  } = useTailwindColors();
  
  // Default configuration
  const defaultValues: LineEndpointConfig = {
    lineType: 'straight',
    fillStyle: markerFillStyle,
    startMarker: startMarker,
    endMarker: endMarker,
    ...defaultConfig
  };
  
  // State
  const [config, setConfig] = useState<LineEndpointConfig>(defaultValues);

  // Get stroke and fill colors in HSL format
  const strokeHsl = getColorHsl(strokeColor);
  const fillHsl = getColorHsl(fillColor);
  
  // Update local state when store changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      fillStyle: markerFillStyle,
      startMarker: startMarker,
      endMarker: endMarker
    }));
  }, [markerFillStyle, startMarker, endMarker, strokeColor, fillColor]);
  
  // Update parent component when config changes
  useEffect(() => {
    onChange?.(config);
  }, [config, onChange]);
  
  // Update line markers when theme changes
  useEffect(() => {
    if (hasThemeChanged) {
      // Use the centralized function to update all node colors
      updateColorsForTheme(isDarkMode);
    }
  }, [hasThemeChanged, updateColorsForTheme, isDarkMode]);
  
  // Update selected lines
  const updateConfig = <K extends keyof LineEndpointConfig>(
    key: K, 
    value: LineEndpointConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Update store based on property
    if (key === 'startMarker') {
      setStartMarker(value as MarkerShape);
    } else if (key === 'endMarker') {
      setEndMarker(value as MarkerShape);
    } else if (key === 'fillStyle') {
      setMarkerFillStyle(value as FillStyle);
    }
    
    // Update selected lines
    updateSelectedLineMarkers();
    
    // Update connections for all selected lines
    const allNodes = useCanvasStore.getState().nodes;
    const connections = useCanvasStore.getState().connections;
    
    // Only process line/arrow nodes that are selected
    const selectedLines = allNodes
      .filter(node => node.selected && (node.type === 'line' || node.type === 'arrow'))
      .map(node => node.id);
    
    if (selectedLines.length > 0) {
      // For each selected line, update its connections
      selectedLines.forEach((lineId: string) => {
        const lineNode = allNodes.find(n => n.id === lineId);
        if (lineNode) {
          // Use the imported utility function to update connections
          const updatedLine = updateAllLineConnections(lineNode, connections, allNodes);
          
          // Update the node in the store
          useCanvasStore.getState().updateNodePosition(
            updatedLine.id, 
            updatedLine.position.x, 
            updatedLine.position.y
          );
          
          if (updatedLine.dimensions) {
            useCanvasStore.getState().updateNodeDimensions(
              updatedLine.id, 
              updatedLine.dimensions.width, 
              updatedLine.dimensions.height
            );
          }
        }
      });
    }
  };
  
  // Line type options
  const lineTypeOptions = [
    { 
      value: 'straight', 
      label: 'Straight Line', 
      icon: <MoveUpRight className="w-4 h-4" style={{ stroke: `hsl(${strokeHsl})` }} /> 
    },
    { 
      value: 'elbow', 
      label: 'Elbow Connector', 
      icon: <CornerUpRight className="w-4 h-4" style={{ stroke: `hsl(${strokeHsl})` }} /> 
    },
  ];
  
  // Fill style options
  const fillStyleOptions = [
    { 
      value: 'filled', 
      label: 'Filled', 
      icon: <Circle className="w-4 h-4" style={{ fill: `hsl(${fillHsl})`, stroke: `hsl(${strokeHsl})` }} /> 
    },
    { 
      value: 'outlined', 
      label: 'Outlined', 
      icon: <Circle className="w-4 h-4" style={{ fill: 'none', stroke: `hsl(${strokeHsl})` }} /> 
    },
  ];
  
  // Create marker options with proper colors
  const createMarkerOptions = (isStart: boolean) => {
    const fillValue = config.fillStyle === 'filled' ? `hsl(${fillHsl})` : 'none';
    const strokeValue = `hsl(${strokeHsl})`;
    
    return [
      { 
        value: 'none', 
        label: 'None', 
        icon: <Minus className="w-4 h-4" style={{ stroke: strokeValue }} /> 
      },
      { 
        value: 'triangle', 
        label: 'Triangle', 
        icon: <Marker 
          shape="triangle" 
          fillStyle={config.fillStyle} 
          isStart={isStart}
          fillColor={fillValue}
          strokeColor={strokeValue}
        /> 
      },
      { 
        value: 'circle', 
        label: 'Circle', 
        icon: <Marker 
          shape="circle" 
          fillStyle={config.fillStyle} 
          isStart={isStart}
          fillColor={fillValue}
          strokeColor={strokeValue}
        /> 
      },
      { 
        value: 'square', 
        label: 'Square', 
        icon: <Marker 
          shape="square" 
          fillStyle={config.fillStyle} 
          isStart={isStart}
          fillColor={fillValue}
          strokeColor={strokeValue}
        /> 
      },
      { 
        value: 'diamond', 
        label: 'Diamond', 
        icon: <Marker 
          shape="diamond" 
          fillStyle={config.fillStyle} 
          isStart={isStart}
          fillColor={fillValue}
          strokeColor={strokeValue}
        /> 
      },
    ];
  };
  
  const MarkerComponent = ({ type, position, style }: { type: MarkerShape, position: 'start' | 'end', style: React.CSSProperties }) => {
    // Map marker types to their components
    const components = {
      triangle: Triangle,
      circle: Circle,
      square: Square,
      diamond: Diamond
    };
    
    // Get the correct component based on type
    const Component = components[type as keyof typeof components];
    
    // If no marker type is specified, return null
    if (!Component) return null;
    
    // Calculate rotation based on position
    const rotation = position === 'start' ? '-rotate-90' : position === 'end' ? 'rotate-90' : '';
    
    // Calculate margin based on position
    const margin = position === 'start' ? '-mr-1' : position === 'end' ? '-ml-1' : '';
    
    return (
      <Component 
        className={`${rotation} ${margin}`} 
        style={{ ...style, width: '12px', height: '12px' }} 
      />
    );
  };
  
  const renderPreview = () => {
    const fillValue = config.fillStyle === 'filled' ? `hsl(${fillHsl})` : 'none';
    const strokeValue = `hsl(${strokeHsl})`;
    
    const markerStyle = {
      stroke: strokeValue,
      fill: fillValue
    };
    
    return (
      <div className="flex items-center">
        <MarkerComponent 
          type={config.startMarker} 
          position="start" 
          style={markerStyle} 
        />
        <Minus className="" style={{ stroke: strokeValue }} />
        <MarkerComponent 
          type={config.endMarker} 
          position="end" 
          style={markerStyle} 
        />
      </div>
    );
  };
  
  return (
    <div className="flex flex-row items-center justify-between w-full">
      <Label className="text-sm font-medium text-muted-foreground">Line</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            {renderPreview()}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-fit space-y-4" sideOffset={15} align="start">
          <ToggleSection 
            label="Type" 
            value={config.lineType} 
            options={lineTypeOptions} 
            onChange={(value) => updateConfig('lineType', value as LineType)}
            className="mb-4"
          />
          
          <ToggleSection 
            label="Fill" 
            value={config.fillStyle} 
            options={fillStyleOptions} 
            onChange={(value) => updateConfig('fillStyle', value as FillStyle)}
            className="mb-4"
          />
          
          <ToggleSection 
            label="Start" 
            value={config.startMarker} 
            options={createMarkerOptions(true)} 
            onChange={(value) => updateConfig('startMarker', value as MarkerShape)}
            className="mb-4"
          />
          
          <ToggleSection 
            label="End" 
            value={config.endMarker} 
            options={createMarkerOptions(false)} 
            onChange={(value) => updateConfig('endMarker', value as MarkerShape)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LineEndpointControls;