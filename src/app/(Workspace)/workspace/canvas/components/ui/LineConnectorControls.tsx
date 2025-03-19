'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Minus, 
  Circle,
  Triangle,
  CornerUpRight,
  MoveUpRight 
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore } from '../../lib/store/canvas-store';

// Define types
type LineType = 'straight' | 'elbow';
type FillStyle = 'filled' | 'outlined';
type MarkerShape = 'none' | 'triangle' | 'circle' | 'square' | 'diamond';

interface LineConnectorConfig {
  lineType: LineType;
  fillStyle: FillStyle;
  startMarker: MarkerShape;
  endMarker: MarkerShape;
}

interface LineConnectorProps {
  defaultConfig?: LineConnectorConfig;
  onChange?: (config: LineConnectorConfig) => void;
}

// Marker component for consistent rendering
const Marker: React.FC<{ 
  shape: MarkerShape; 
  fillStyle: FillStyle; 
  isStart: boolean;
  className?: string;
}> = ({ shape, fillStyle, isStart, className = '' }) => {
  if (shape === 'none') return null;
  
  const isFilled = fillStyle === 'filled';
  const fillClass = isFilled ? 'fill-foreground' : '';
  const marginClass = isStart ? '-mr-1' : '-ml-1';
  
  const renderShape = () => {
    switch (shape) {
      case 'triangle':
        return (
          <Triangle 
            className={`w-2 h-2 ${isStart ? '-rotate-90' : 'rotate-90'} ${marginClass} ${fillClass} ${className}`} 
          />
        );
      case 'circle':
        return (
          <Circle 
            className={`w-2 h-2 ${marginClass} ${fillClass} ${className}`} 
          />
        );
      case 'square':
        return (
          <div 
            className={`w-2 h-2 ${marginClass} ${isFilled ? 'bg-foreground' : 'border border-foreground'} ${className}`} 
          />
        );
      case 'diamond':
        return (
          <div 
            className={`w-2 h-2 ${marginClass} rotate-45 ${isFilled ? 'bg-foreground' : 'border border-foreground'} ${className}`} 
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
          <Minus className="w-3 h-3" />
        </>
      ) : (
        <>
          <Minus className="w-3 h-3" />
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
const LineConnectorControls: React.FC<LineConnectorProps> = ({ 
  defaultConfig,
  onChange 
}) => {
  // Get selected nodes from the canvas store
  const nodes = useCanvasStore(state => state.nodes);
  
  // Find the first selected line node
  const selectedLineNode = nodes.find(node => 
    node.selected && (node.type === 'line' || node.type === 'arrow')
  );
  
  // Extract current configuration from the node data or use defaults
  const currentConfig = selectedLineNode ? {
    lineType: (selectedLineNode.data?.lineType as LineType) || 'straight',
    fillStyle: (selectedLineNode.data?.fillStyle as FillStyle) || 'filled',
    startMarker: (selectedLineNode.data?.startMarker as MarkerShape) || 'none',
    endMarker: (selectedLineNode.data?.endMarker as MarkerShape) || 
      (selectedLineNode.type === 'arrow' ? 'triangle' : 'none')
  } : {
    lineType: 'straight' as LineType,
    fillStyle: 'filled' as FillStyle,
    startMarker: 'none' as MarkerShape,
    endMarker: 'none' as MarkerShape
  };
  
  // Default configuration
  const defaultValues: LineConnectorConfig = {
    ...currentConfig,
    ...defaultConfig
  };
  
  // State
  const [config, setConfig] = useState<LineConnectorConfig>(defaultValues);
  
  // Update node data when config changes
  useEffect(() => {
    if (selectedLineNode) {
      // Create a new nodes array with the updated node
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedLineNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              startMarker: config.startMarker,
              endMarker: config.endMarker,
              fillStyle: config.fillStyle,
              lineType: config.lineType
            }
          };
        }
        return node;
      });
      
      // Update the nodes in the store
      useCanvasStore.setState({ nodes: updatedNodes });
      
      // Call the onChange prop if provided
      onChange?.(config);
    }
  }, [config, selectedLineNode, nodes, onChange]);
  
  // Update specific config property
  const updateConfig = <K extends keyof LineConnectorConfig>(
    key: K, 
    value: LineConnectorConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // If no line is selected, don't render the component
  if (!selectedLineNode) {
    return null;
  }
  
  // Line type options
  const lineTypeOptions = [
    { value: 'straight', label: 'Straight Line', icon: <MoveUpRight className="w-4 h-4" /> },
    { value: 'elbow', label: 'Elbow Connector', icon: <CornerUpRight className="w-4 h-4" /> },
  ];
  
  // Fill style options
  const fillStyleOptions = [
    { value: 'filled', label: 'Filled', icon: <Circle className="w-4 h-4 fill-foreground" /> },
    { value: 'outlined', label: 'Outlined', icon: <Circle className="w-4 h-4" /> },
  ];
  
  // Create marker options
  const createMarkerOptions = (isStart: boolean) => [
    { value: 'none', label: 'None', icon: <Minus className="w-4 h-4" /> },
    { 
      value: 'triangle', 
      label: 'Triangle', 
      icon: <Marker shape="triangle" fillStyle={config.fillStyle} isStart={isStart} /> 
    },
    { 
      value: 'circle', 
      label: 'Circle', 
      icon: <Marker shape="circle" fillStyle={config.fillStyle} isStart={isStart} /> 
    },
    { 
      value: 'square', 
      label: 'Square', 
      icon: <Marker shape="square" fillStyle={config.fillStyle} isStart={isStart} /> 
    },
    { 
      value: 'diamond', 
      label: 'Diamond', 
      icon: <Marker shape="diamond" fillStyle={config.fillStyle} isStart={isStart} /> 
    },
  ];
  
  // Preview of current configuration
  const renderPreview = () => (
    <div className="flex items-center">
      <Marker shape={config.startMarker} fillStyle={config.fillStyle} isStart={true} />
      {config.lineType === 'straight' ? 
        <Minus className="w-4 h-4" /> : 
        <CornerUpRight className="w-4 h-4" />
      }
      <Marker shape={config.endMarker} fillStyle={config.fillStyle} isStart={false} />
    </div>
  );

  
  
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

export default LineConnectorControls;

// Example usage:
// <LineConnectorControls 
//   defaultConfig={{ 
//     lineType: 'straight',
//     fillStyle: 'filled', 
//     startMarker: 'triangle', 
//     endMarker: 'circle'
//   }}
//   onChange={(config) => console.log('Line config updated:', config)}
// /> 