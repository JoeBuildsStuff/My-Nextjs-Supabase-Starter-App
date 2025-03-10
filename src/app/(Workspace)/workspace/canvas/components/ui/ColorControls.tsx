'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Square, Slash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import { Card } from '@/components/ui/card';

const ColorControls = () => {
  const { 
    strokeColor, 
    fillColor, 
    defaultShade,
    setStrokeColor, 
    setFillColor,
    setDefaultShade
  } = useCanvasStore();
  
  // State for tracking selected color base and shade
  const [selectedStrokeBase, setSelectedStrokeBase] = useState<string>('');
  const [selectedStrokeShade, setSelectedStrokeShade] = useState<string>(defaultShade);
  const [selectedFillBase, setSelectedFillBase] = useState<string>('');
  const [selectedFillShade, setSelectedFillShade] = useState<string>(defaultShade);
  
  // Available shades
  const shades = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  
  // Base color options (without shade)
  const baseColorOptions = [
    { name: "none", hsl: "0 0% 0%", special: true },
    { name: "white", hsl: "0 0% 100%" },
    { name: "black", hsl: "0 0% 0%" },
    { name: "slate", hsl: "215 16% 47%" },
    { name: "gray", hsl: "220 9% 46%" },
    { name: "zinc", hsl: "240 4% 46%" },
    { name: "neutral", hsl: "0 0% 46%" },
    { name: "stone", hsl: "25 6% 46%" },
    { name: "red", hsl: "0 84% 60%" },
    { name: "orange", hsl: "25 95% 53%" },
    { name: "amber", hsl: "38 92% 50%" },
    { name: "yellow", hsl: "48 96% 53%" },
    { name: "lime", hsl: "84 81% 44%" },
    { name: "green", hsl: "142 71% 45%" },
    { name: "emerald", hsl: "152 69% 31%" },
    { name: "teal", hsl: "173 80% 40%" },
    { name: "cyan", hsl: "186 94% 41%" },
    { name: "sky", hsl: "199 89% 48%" },
    { name: "blue", hsl: "217 91% 60%" },
    { name: "indigo", hsl: "239 84% 67%" },
    { name: "violet", hsl: "250 83% 71%" },
    { name: "purple", hsl: "270 91% 65%" },
    { name: "fuchsia", hsl: "292 91% 69%" },
    { name: "pink", hsl: "330 81% 60%" },
    { name: "rose", hsl: "355 90% 67%" },
  ];

  // Special shades for black and white
  const blackShades: Record<string, string> = {
    '100': '0 0% 90%',  // Very light gray
    '200': '0 0% 80%',
    '300': '0 0% 70%',
    '400': '0 0% 60%',
    '500': '0 0% 50%',  // Medium gray
    '600': '0 0% 40%',
    '700': '0 0% 30%',
    '800': '0 0% 20%',
    '900': '0 0% 10%',  // Very dark gray
    '950': '0 0% 0%',   // Pure black
  };

  const whiteShades: Record<string, string> = {
    '100': '0 0% 100%', // Pure white
    '200': '0 0% 98%',
    '300': '0 0% 96%',
    '400': '0 0% 94%',
    '500': '0 0% 92%',
    '600': '0 0% 88%',
    '700': '0 0% 84%',
    '800': '0 0% 80%',
    '900': '0 0% 75%',
    '950': '0 0% 70%',  // Light gray
  };

  // Tailwind color shades with HSL values
  const colorShades: Record<string, Record<string, string>> = {
    slate: {
      '100': '210 40% 96.1%',
      '200': '214 32% 91.0%',
      '300': '213 27% 84.3%',
      '400': '215 20% 65.1%',
      '500': '215 16% 47.0%',
      '600': '215 19% 35.3%',
      '700': '215 25% 27.5%',
      '800': '217 33% 17.3%',
      '900': '222 47% 11.2%',
      '950': '229 84% 5%',
    },
    gray: {
      '100': '220 14% 96.1%',
      '200': '220 13% 91.0%',
      '300': '216 12% 83.9%',
      '400': '218 11% 65.1%',
      '500': '220 9% 46.1%',
      '600': '215 14% 34.1%',
      '700': '217 19% 27.1%',
      '800': '215 28% 17.3%',
      '900': '221 39% 11.0%',
      '950': '224 71% 4%',
    },
    zinc: {
      '100': '240 5% 96.1%',
      '200': '240 6% 90.0%',
      '300': '240 5% 84.0%',
      '400': '240 5% 65.1%',
      '500': '240 4% 46.1%',
      '600': '240 5% 34.0%',
      '700': '240 5% 26.0%',
      '800': '240 4% 16.0%',
      '900': '240 6% 10.0%',
      '950': '240 10% 4%',
    },
    neutral: {
      '100': '0 0% 96.1%',
      '200': '0 0% 90.0%',
      '300': '0 0% 83.1%',
      '400': '0 0% 64.7%',
      '500': '0 0% 45.9%',
      '600': '0 0% 32.2%',
      '700': '0 0% 25.1%',
      '800': '0 0% 14.9%',
      '900': '0 0% 9.0%',
      '950': '0 0% 4%',
    },
    stone: {
      '100': '60 5% 96.1%',
      '200': '20 6% 90.0%',
      '300': '24 6% 83.1%',
      '400': '24 5% 64.7%',
      '500': '25 6% 45.9%',
      '600': '33 5% 32.2%',
      '700': '30 6% 25.1%',
      '800': '12 6% 15.1%',
      '900': '24 10% 10.0%',
      '950': '20 14% 4%',
    },
    red: {
      '100': '0 86% 97.3%',
      '200': '0 93% 94.1%',
      '300': '0 96% 89.0%',
      '400': '0 91% 71.4%',
      '500': '0 84% 60.0%',
      '600': '0 72% 50.6%',
      '700': '0 74% 42.0%',
      '800': '0 70% 35.3%',
      '900': '0 63% 31.0%',
      '950': '0 80% 17%',
    },
    orange: {
      '100': '34 100% 97.1%',
      '200': '32 98% 83.5%',
      '300': '31 97% 72.2%',
      '400': '27 96% 61.0%',
      '500': '25 95% 53.1%',
      '600': '21 90% 48.0%',
      '700': '17 88% 40.0%',
      '800': '15 79% 33.7%',
      '900': '15 75% 28.4%',
      '950': '14 80% 14%',
    },
    amber: {
      '100': '48 96% 89.0%',
      '200': '48 97% 77.1%',
      '300': '46 97% 65.1%',
      '400': '43 96% 56.1%',
      '500': '38 92% 50.0%',
      '600': '32 95% 44.0%',
      '700': '26 90% 37.1%',
      '800': '23 83% 31.8%',
      '900': '22 78% 26.1%',
      '950': '21 80% 12%',
    },
    yellow: {
      '100': '55 92% 95.1%',
      '200': '53 98% 77.1%',
      '300': '50 98% 64.1%',
      '400': '48 96% 53.1%',
      '500': '48 96% 53.1%',
      '600': '45 93% 47.5%',
      '700': '35 92% 33.1%',
      '800': '32 81% 29.0%',
      '900': '28 73% 26.5%',
      '950': '28 80% 13%',
    },
    lime: {
      '100': '73 92% 93.9%',
      '200': '77 76% 85.1%',
      '300': '81 67% 74.9%',
      '400': '82 77% 61.2%',
      '500': '84 81% 44.1%',
      '600': '85 85% 35.3%',
      '700': '86 78% 26.9%',
      '800': '86 69% 22.7%',
      '900': '88 61% 20.2%',
      '950': '89 80% 10%',
    },
    green: {
      '100': '142 77% 94.9%',
      '200': '141 79% 85.1%',
      '300': '142 77% 73.3%',
      '400': '142 69% 58.0%',
      '500': '142 71% 45.1%',
      '600': '142 76% 36.3%',
      '700': '142 72% 29.0%',
      '800': '143 64% 24.3%',
      '900': '144 61% 20.2%',
      '950': '145 80% 10%',
    },
    emerald: {
      '100': '152 81% 95.9%',
      '200': '149 80% 90.0%',
      '300': '152 76% 80.4%',
      '400': '156 72% 67.1%',
      '500': '152 69% 31.0%',
      '600': '153 74% 26.9%',
      '700': '155 66% 23.1%',
      '800': '156 66% 19.2%',
      '900': '157 61% 15.9%',
      '950': '160 84% 7%',
    },
    teal: {
      '100': '166 76% 97.1%',
      '200': '168 84% 93.9%',
      '300': '171 77% 64.1%',
      '400': '172 66% 50.4%',
      '500': '173 80% 40.0%',
      '600': '175 84% 32.2%',
      '700': '175 77% 26.1%',
      '800': '176 69% 22.0%',
      '900': '176 61% 18.6%',
      '950': '180 85% 8%',
    },
    cyan: {
      '100': '183 100% 96.1%',
      '200': '185 96% 90.0%',
      '300': '186 94% 82.0%',
      '400': '186 93% 61.0%',
      '500': '186 94% 41.0%',
      '600': '186 91% 32.9%',
      '700': '186 91% 26.1%',
      '800': '186 91% 18.8%',
      '900': '186 91% 15.3%',
      '950': '187 92% 10%',
    },
    sky: {
      '100': '204 94% 94.1%',
      '200': '201 94% 86.1%',
      '300': '199 95% 74.3%',
      '400': '198 93% 60.0%',
      '500': '199 89% 48.0%',
      '600': '200 98% 39.4%',
      '700': '201 96% 32.2%',
      '800': '201 90% 27.5%',
      '900': '202 80% 24.0%',
      '950': '205 94% 13%',
    },
    blue: {
      '100': '214 100% 96.9%',
      '200': '213 97% 87.1%',
      '300': '212 96% 78.0%',
      '400': '213 94% 68.0%',
      '500': '217 91% 60.0%',
      '600': '221 83% 53.3%',
      '700': '224 76% 48.0%',
      '800': '226 71% 40.0%',
      '900': '224 64% 33.1%',
      '950': '226 83% 18%',
    },
    indigo: {
      '100': '226 100% 96.9%',
      '200': '228 96% 88.8%',
      '300': '230 94% 82.4%',
      '400': '234 89% 74.1%',
      '500': '239 84% 67.1%',
      '600': '243 75% 59.0%',
      '700': '245 58% 51.0%',
      '800': '244 55% 41.0%',
      '900': '242 47% 34.3%',
      '950': '244 75% 20%',
    },
    violet: {
      '100': '250 100% 97.6%',
      '200': '251 91% 95.5%',
      '300': '252 95% 93.2%',
      '400': '250 87% 83.1%',
      '500': '250 83% 71.0%',
      '600': '252 62% 54.9%',
      '700': '256 56% 46.5%',
      '800': '260 50% 38.0%',
      '900': '258 42% 32.0%',
      '950': '262 83% 16%',
    },
    purple: {
      '100': '270 100% 98.0%',
      '200': '269 100% 95.1%',
      '300': '269 97% 85.1%',
      '400': '270 95% 75.3%',
      '500': '270 91% 65.1%',
      '600': '271 81% 55.9%',
      '700': '272 72% 47.1%',
      '800': '273 67% 39.4%',
      '900': '274 66% 32.0%',
      '950': '275 80% 18%',
    },
    fuchsia: {
      '100': '287 100% 97.6%',
      '200': '288 96% 95.5%',
      '300': '291 93% 82.9%',
      '400': '292 91% 73.3%',
      '500': '292 91% 69.0%',
      '600': '293 84% 59.4%',
      '700': '295 72% 50.0%',
      '800': '295 70% 41.0%',
      '900': '297 64% 32.0%',
      '950': '297 90% 18%',
    },
    pink: {
      '100': '327 73% 97.1%',
      '200': '326 85% 90.0%',
      '300': '327 87% 81.8%',
      '400': '329 86% 70.2%',
      '500': '330 81% 60.0%',
      '600': '333 71% 50.6%',
      '700': '335 78% 42.0%',
      '800': '336 74% 35.3%',
      '900': '336 69% 30.4%',
      '950': '336 85% 18%',
    },
    rose: {
      '100': '356 100% 97.3%',
      '200': '353 96% 90.0%',
      '300': '353 95% 81.8%',
      '400': '351 95% 71.4%',
      '500': '355 90% 67.1%',
      '600': '356 73% 57.5%',
      '700': '356 75% 47.3%',
      '800': '355 76% 39.2%',
      '900': '355 75% 31.4%',
      '950': '355 90% 18%',
    },
  };

  // Handle color selection
  const handleStrokeColorChange = (colorBase: string) => {
    if (colorBase === 'none') {
      setStrokeColor(colorBase);
      setSelectedStrokeBase(colorBase);
      return;
    }
    
    if (colorBase === 'black') {
      // Use 950 (darkest) as default for black
      const shade = '950';
      const newColor = `black-${shade}`;
      setStrokeColor(newColor);
      setSelectedStrokeBase(colorBase);
      setSelectedStrokeShade(shade);
      return;
    }
    
    if (colorBase === 'white') {
      // Use 100 (lightest) as default for white
      const shade = '100';
      const newColor = `white-${shade}`;
      setStrokeColor(newColor);
      setSelectedStrokeBase(colorBase);
      setSelectedStrokeShade(shade);
      return;
    }
    
    const newColor = `${colorBase}-${selectedStrokeShade}`;
    setStrokeColor(newColor);
    setSelectedStrokeBase(colorBase);
  };

  const handleFillColorChange = (colorBase: string) => {
    if (colorBase === 'none') {
      setFillColor(colorBase);
      setSelectedFillBase(colorBase);
      return;
    }
    
    if (colorBase === 'black') {
      // Use 950 (darkest) as default for black
      const shade = '950';
      const newColor = `black-${shade}`;
      setFillColor(newColor);
      setSelectedFillBase(colorBase);
      setSelectedFillShade(shade);
      return;
    }
    
    if (colorBase === 'white') {
      // Use 100 (lightest) as default for white
      const shade = '100';
      const newColor = `white-${shade}`;
      setFillColor(newColor);
      setSelectedFillBase(colorBase);
      setSelectedFillShade(shade);
      return;
    }
    
    const newColor = `${colorBase}-${selectedFillShade}`;
    setFillColor(newColor);
    setSelectedFillBase(colorBase);
  };

  const handleStrokeShadeChange = (shade: string) => {
    if (selectedStrokeBase === 'none') {
      return;
    }
    
    if (selectedStrokeBase === 'black' || selectedStrokeBase === 'white') {
      const newColor = `${selectedStrokeBase}-${shade}`;
      setStrokeColor(newColor);
      setSelectedStrokeShade(shade);
      setDefaultShade(shade);
      return;
    }
    
    if (selectedStrokeBase) {
      const newColor = `${selectedStrokeBase}-${shade}`;
      setStrokeColor(newColor);
      setSelectedStrokeShade(shade);
      setDefaultShade(shade);
    }
  };

  const handleFillShadeChange = (shade: string) => {
    if (selectedFillBase === 'none') {
      return;
    }
    
    if (selectedFillBase === 'black' || selectedFillBase === 'white') {
      const newColor = `${selectedFillBase}-${shade}`;
      setFillColor(newColor);
      setSelectedFillShade(shade);
      setDefaultShade(shade);
      return;
    }
    
    if (selectedFillBase) {
      const newColor = `${selectedFillBase}-${shade}`;
      setFillColor(newColor);
      setSelectedFillShade(shade);
      setDefaultShade(shade);
    }
  };

  // Initialize selected base colors from current colors
  useEffect(() => {
    if (strokeColor) {
      const parts = strokeColor.split('-');
      if (parts.length === 2) {
        setSelectedStrokeBase(parts[0]);
        setSelectedStrokeShade(parts[1]);
      } else {
        setSelectedStrokeBase(strokeColor);
      }
    }
    
    if (fillColor) {
      const parts = fillColor.split('-');
      if (parts.length === 2) {
        setSelectedFillBase(parts[0]);
        setSelectedFillShade(parts[1]);
      } else {
        setSelectedFillBase(fillColor);
      }
    }
  }, []);

  // Update local shade state when defaultShade changes in the store
  useEffect(() => {
    setSelectedStrokeShade(defaultShade);
    setSelectedFillShade(defaultShade);
  }, [defaultShade]);

  // Get the current color objects
  const getCurrentColorHsl = (colorName: string): string => {
    if (colorName === 'none') return '0 0% 0%';
    
    const parts = colorName.split('-');
    if (parts.length === 2) {
      const [base, shade] = parts;
      
      if (base === 'white') {
        return whiteShades[shade] || '0 0% 100%';
      }
      
      if (base === 'black') {
        return blackShades[shade] || '0 0% 0%';
      }
      
      return colorShades[base]?.[shade] || '0 0% 0%';
    }
    
    // Handle basic colors
    if (colorName === 'white') return '0 0% 100%';
    if (colorName === 'black') return '0 0% 0%';
    
    // Find in base colors
    const baseColor = baseColorOptions.find(c => c.name === colorName);
    return baseColor?.hsl || '0 0% 0%';
  };

  // Render the color button in the trigger based on whether it's "none" or a regular color
  const renderColorButton = (colorName: string, isStroke: boolean) => {
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

    const hsl = getCurrentColorHsl(colorName);
    
    return (
      <Square 
        className="h-4 w-4" 
        style={{ 
          stroke: isStroke ? `hsl(${hsl})` : "hsl(var(--border))",
          fill: isStroke ? "transparent" : `hsl(${hsl})`,
          strokeWidth: isStroke ? "2px" : "1px"
        }} 
      />
    );
  };

  // Split shades into two rows
  const firstRowShades = shades.slice(0, 5); // 100-500
  const secondRowShades = shades.slice(5);   // 600-950

  // Render shade buttons
  const renderShadeButtons = (baseColor: string, selectedShade: string, handleShadeChange: (shade: string) => void) => {
    const isDisabled = baseColor === 'none';
    
    return (
      <div className="space-y-1">
        <div className="flex space-x-1">
          {firstRowShades.map((shade) => {
            let hsl;
            if (baseColor === 'black') {
              hsl = blackShades[shade];
            } else if (baseColor === 'white') {
              hsl = whiteShades[shade];
            } else {
              hsl = colorShades[baseColor]?.[shade] || '0 0% 0%';
            }
            
            return (
              <Button 
                key={`shade-${shade}-1`} 
                variant="ghost"
                className="h-6 w-6 p-0 rounded-sm"
                disabled={isDisabled}
                style={{
                  background: `hsl(${hsl})`,
                  opacity: isDisabled ? 0.5 : 1
                }}
                onClick={() => handleShadeChange(shade)}
              >
                {selectedShade === shade && !isDisabled && (
                  <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                )}
              </Button>
            );
          })}
        </div>
        <div className="flex space-x-1">
          {secondRowShades.map((shade) => {
            let hsl;
            if (baseColor === 'black') {
              hsl = blackShades[shade];
            } else if (baseColor === 'white') {
              hsl = whiteShades[shade];
            } else {
              hsl = colorShades[baseColor]?.[shade] || '0 0% 0%';
            }
            
            return (
              <Button 
                key={`shade-${shade}-2`} 
                variant="ghost"
                className="h-6 w-6 p-0 rounded-sm"
                disabled={isDisabled}
                style={{
                  background: `hsl(${hsl})`,
                  opacity: isDisabled ? 0.5 : 1
                }}
                onClick={() => handleShadeChange(shade)}
              >
                {selectedShade === shade && !isDisabled && (
                  <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render color buttons
  const renderColorButtons = (selectedBase: string, handleColorChange: (colorBase: string) => void) => {
    // Group colors into rows of 5
    const rows = [];
    for (let i = 0; i < baseColorOptions.length; i += 5) {
      rows.push(baseColorOptions.slice(i, i + 5));
    }
    
    return (
      <div className="space-y-1">
        {rows.map((row, rowIndex) => (
          <div key={`color-row-${rowIndex}`} className="flex space-x-1">
            {row.map((color) => (
              <Button 
                key={`color-${color.name}`} 
                variant="ghost" 
                className="h-6 w-6 p-0 rounded-sm relative"
                style={{ 
                  background: color.name === "none" ? 'transparent' : `hsl(${color.hsl})` 
                }}
                onClick={() => handleColorChange(color.name)}
              >
                {selectedBase === color.name && (
                  <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                )}
                {color.name === "none" && (
                  <>
                    <Square className="h-3 w-3 absolute" style={{ stroke: "hsl(var(--border))", fill: "transparent" }} />
                    <Slash className="h-3 w-3 absolute text-muted-foreground" />
                  </>
                )}
              </Button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Stroke color picker */}
      <div className="flex flex-row items-center justify-between w-full">
        <Label htmlFor="stroke-color" className="text-sm font-medium text-muted-foreground mr-2">Stroke</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              {renderColorButton(strokeColor, true)}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" sideOffset={15} align="start" className="w-auto p-2">
            <div className="space-y-4">
              {/* Color grid */}
              <Card className="p-2 border-none">
                <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
                {renderColorButtons(selectedStrokeBase, handleStrokeColorChange)}
              </Card>
              
              {/* Shade selector */}
              <Card className="p-2 border-none">
                <Label className="text-xs text-muted-foreground mb-2 block">Shade</Label>
                {renderShadeButtons(selectedStrokeBase, selectedStrokeShade, handleStrokeShadeChange)}
              </Card>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Fill color picker */}
      <div className="flex flex-row items-center justify-between w-full">
        <Label htmlFor="fill-color" className="text-sm font-medium text-muted-foreground mr-2">Fill</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              {renderColorButton(fillColor, false)}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" sideOffset={15} align="start" className="w-auto p-2">
            <div className="space-y-4">
              {/* Color grid */}
              <Card className="p-2 border-none">
                <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
                {renderColorButtons(selectedFillBase, handleFillColorChange)}
              </Card>
              
              {/* Shade selector */}
              <Card className="p-2 border-none">
                <Label className="text-xs text-muted-foreground mb-2 block">Shade</Label>
                {renderShadeButtons(selectedFillBase, selectedFillShade, handleFillShadeChange)}
              </Card>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ColorControls; 