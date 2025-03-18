'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Square, Slash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore } from '../../lib/store/canvas-store';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { baseColorOptions } from '../../lib/utils/tailwind-color-utils';
import { useTailwindColors } from '../../lib/utils/use-tailwind-colors';

// Define types
interface IconConfig {
  iconColor: string;
  iconStrokeWidth: number;
}

interface IconControlsProps {
  defaultConfig?: IconConfig;
  onChange?: (config: IconConfig) => void;
}

const IconControls: React.FC<IconControlsProps> = ({ 
  defaultConfig,
  onChange 
}) => {
  const { 
    strokeColor,
    strokeWidth,
    setStrokeColor,
    setStrokeWidth,
    updateColorsForTheme,
    pushToHistory,
    updateSelectedIconStyles
  } = useCanvasStore();
  
  // Use the tailwind colors hook for theme-aware color handling
  const {
    isDarkMode,
    strokeShades,
    defaultStrokeShade,
    getColorHsl,
    hasThemeChanged
  } = useTailwindColors();
  
  // Default configuration
  const defaultValues: IconConfig = {
    iconColor: strokeColor,
    iconStrokeWidth: strokeWidth,
    ...defaultConfig
  };
  
  // State
  const [config, setConfig] = useState<IconConfig>(defaultValues);
  const [selectedIconBase, setSelectedIconBase] = useState<string>('');
  const [selectedIconShade, setSelectedIconShade] = useState<string>(defaultStrokeShade);
  
  // Available stroke widths
  const strokeWidths = [1, 2, 3, 4, 6];
  
  // Update local state when store changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      iconColor: strokeColor,
      iconStrokeWidth: strokeWidth
    }));
  }, [strokeColor, strokeWidth]);
  
  // Update parent component when config changes
  useEffect(() => {
    onChange?.(config);
  }, [config, onChange]);
  
  // Initialize selected base colors from current colors and set default shades based on theme
  useEffect(() => {
    if (strokeColor) {
      const parts = strokeColor.split('-');
      if (parts.length === 2) {
        setSelectedIconBase(parts[0]);
        setSelectedIconShade(parts[1]);
      } else {
        setSelectedIconBase(strokeColor);
      }
    }
  }, []);
  
  // Update colors when theme changes
  useEffect(() => {
    if (hasThemeChanged) {
      // Only update if the current shade is not in the available range for the current theme
      if (selectedIconBase && selectedIconBase !== 'none') {
        if (!strokeShades.includes(selectedIconShade)) {
          setSelectedIconShade(defaultStrokeShade);
          setStrokeColor(`${selectedIconBase}-${defaultStrokeShade}`);
        }
      }
      
      // Use the centralized function to update all node colors
      updateColorsForTheme(isDarkMode);
      
      // Push to history
      pushToHistory();
    }
  }, [
    hasThemeChanged, 
    selectedIconBase, 
    selectedIconShade, 
    strokeShades, 
    defaultStrokeShade, 
    setStrokeColor, 
    updateColorsForTheme, 
    isDarkMode, 
    pushToHistory
  ]);

  // Handle color selection
  const handleIconColorChange = (colorBase: string) => {
    if (colorBase === 'none') {
      setStrokeColor(colorBase);
      setSelectedIconBase(colorBase);
      return;
    }
    
    if (colorBase === 'black' || colorBase === 'white') {
      // Use appropriate shade based on theme
      const shade = isDarkMode ? '300' : '800';
      const newColor = `${colorBase}-${shade}`;
      setStrokeColor(newColor);
      setSelectedIconBase(colorBase);
      setSelectedIconShade(shade);
      return;
    }
    
    // Use the default shade for the current theme
    const newColor = `${colorBase}-${defaultStrokeShade}`;
    setStrokeColor(newColor);
    setSelectedIconBase(colorBase);
    setSelectedIconShade(defaultStrokeShade);
    
    // Update selected icons
    updateSelectedIconStyles();
  };

  const handleIconShadeChange = (shade: string) => {
    if (selectedIconBase === 'none') {
      return;
    }
    
    const newColor = `${selectedIconBase}-${shade}`;
    setStrokeColor(newColor);
    setSelectedIconShade(shade);
    
    // Update selected icons
    updateSelectedIconStyles();
  };

  // Handle preset width click
  const handleStrokeWidthClick = (width: number) => {
    setStrokeWidth(width);
    
    // Update selected icons
    updateSelectedIconStyles();
  };

  // Render the color button in the trigger
  const renderColorButton = (colorName: string) => {
    if (colorName === "none") {
      return (
        <div className="relative h-4 w-4">
          <Square 
            className="h-4 w-4 absolute" 
            style={{ 
              stroke: "hsl(var(--border))",
              fill: "transparent",
              strokeWidth: "1px"
            }} 
          />
          <Slash 
            className="h-4 w-4 absolute text-muted-foreground" 
          />
        </div>
      );
    }

    const hsl = getColorHsl(colorName);
    
    // Use similar style as the line style toggle group items
    return (
      <div 
        className="w-4 h-4" 
        style={{ 
          border: `${strokeWidth}px solid hsl(${hsl})`,
          borderRadius: '2px',
          backgroundColor: 'transparent'
        }}
      />
    );
  };

  // Render shade buttons
  const renderShadeButtons = (baseColor: string, selectedShade: string) => {
    const isDisabled = baseColor === 'none';
    
    return (
      <div>
        <ToggleGroup type="single" className="justify-start" value={selectedShade} onValueChange={(value) => handleIconShadeChange(value)} disabled={isDisabled}>
          <div className="flex gap-1">
            {strokeShades.map((shade) => {
              const colorWithShade = baseColor === 'none' ? 'none' : `${baseColor}-${shade}`;
              const hsl = getColorHsl(colorWithShade);
              
              return (
                <ToggleGroupItem 
                  key={`shade-${shade}`} 
                  value={shade}
                  className="h-8 w-8 p-0 flex items-center justify-center rounded-sm"
                >
                  <div 
                    className="w-4 h-4 rounded-sm" 
                    style={{
                      background: `hsl(${hsl})`,
                      opacity: isDisabled ? 0.5 : 1,
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                </ToggleGroupItem>
              );
            })}
          </div>
        </ToggleGroup>
      </div>
    );
  };

  // Render color buttons
  const renderColorButtons = (selectedBase: string) => {
    // Group colors into rows of 5
    const rows = [];
    for (let i = 0; i < baseColorOptions.length; i += 5) {
      rows.push(baseColorOptions.slice(i, i + 5));
    }
    
    return (
      <div>
        <ToggleGroup type="single" className="justify-start" value={selectedBase} onValueChange={(value) => handleIconColorChange(value)}>
          <div className="flex flex-col gap-1">
            {rows.map((row, rowIndex) => (
              <div key={`color-row-${rowIndex}`} className="flex gap-1">
                {row.map((color) => (
                  <ToggleGroupItem 
                    key={`color-${color.name}`} 
                    value={color.name}
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-sm"
                  >
                    {color.name === "none" ? (
                      <div className="relative w-4 h-4">
                        <Square className="h-4 w-4 absolute" style={{ stroke: "hsl(var(--border))", fill: "transparent" }} />
                        <Slash className="h-4 w-4 absolute text-muted-foreground" />
                      </div>
                    ) : (
                      <div 
                        className="w-4 h-4 rounded-sm" 
                        style={{ 
                          background: `hsl(${color.hsl})`,
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                    )}
                  </ToggleGroupItem>
                ))}
              </div>
            ))}
          </div>
        </ToggleGroup>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Icon color picker */}
      <div className="flex flex-row items-center justify-between w-full">
        <Label htmlFor="icon-color" className="text-sm font-medium text-muted-foreground mr-2">Icon Color</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              {renderColorButton(strokeColor)}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" sideOffset={15} align="start" className="w-auto p-2">
            {/* Color grid */}
            <Card className="p-2 border-none">
              <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
              {renderColorButtons(selectedIconBase)}
            </Card>
            
            {/* Shade selector */}
            <Card className="p-2 border-none">
              <Label className="text-xs text-muted-foreground mb-2 block">Shade</Label>
              {renderShadeButtons(selectedIconBase, selectedIconShade)}
            </Card>
          
            {/* Stroke width */}
            <Card className="p-2 border-none">
              <Label className="text-xs text-muted-foreground mb-2 block">Width</Label>
              <ToggleGroup type="single" className="justify-start" value={strokeWidth.toString()} onValueChange={(value) => handleStrokeWidthClick(Number(value))}>
                <div className="flex gap-1">
                  {strokeWidths.map((width) => (
                    <ToggleGroupItem 
                      key={`width-${width}`}
                      value={width.toString()}
                      className="h-8 w-8 p-0 flex items-center justify-center"
                    >
                      <div 
                        className="w-4 h-4" 
                        style={{ 
                          border: `${width}px solid ${selectedIconBase === 'none' ? 'hsl(var(--muted-foreground))' : `hsl(${getColorHsl(strokeColor)})`}`,
                          borderRadius: '2px',
                          backgroundColor: 'transparent'
                        }}
                      />
                    </ToggleGroupItem>
                  ))}
                </div>
              </ToggleGroup>
            </Card>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default IconControls; 