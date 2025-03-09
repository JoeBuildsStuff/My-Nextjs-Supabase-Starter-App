'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Square, Slash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const ColorControls = () => {
  const { strokeColor, fillColor, setStrokeColor, setFillColor } = useCanvasStore();

  // Handle color selection
  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
  };

  const handleFillColorChange = (color: string) => {
    setFillColor(color);
  };

  // Color options with their HSL values
  const colorOptions = [
    { name: "none", hsl: "0 0% 0%", special: true },
    { name: "white", hsl: "0 0% 100%" },
    { name: "black", hsl: "0 0% 0%" },
    { name: "slate-500", hsl: "215 16% 47%" },
    { name: "gray-500", hsl: "220 9% 46%" },
    { name: "zinc-500", hsl: "240 4% 46%" },
    { name: "neutral-500", hsl: "0 0% 46%" },
    { name: "stone-500", hsl: "25 6% 46%" },
    { name: "red-500", hsl: "0 84% 60%" },
    { name: "orange-500", hsl: "25 95% 53%" },
    { name: "amber-500", hsl: "38 92% 50%" },
    { name: "yellow-500", hsl: "48 96% 53%" },
    { name: "lime-500", hsl: "84 81% 44%" },
    { name: "green-500", hsl: "142 71% 45%" },
    { name: "emerald-500", hsl: "152 69% 31%" },
    { name: "teal-500", hsl: "173 80% 40%" },
    { name: "cyan-500", hsl: "186 94% 41%" },
    { name: "sky-500", hsl: "199 89% 48%" },
    { name: "blue-500", hsl: "217 91% 60%" },
    { name: "indigo-500", hsl: "239 84% 67%" },
    { name: "violet-500", hsl: "250 83% 71%" },
    { name: "purple-500", hsl: "270 91% 65%" },
    { name: "fuchsia-500", hsl: "292 91% 69%" },
    { name: "pink-500", hsl: "330 81% 60%" },
    { name: "rose-500", hsl: "355 90% 67%" },
  ];

  // Find the current color objects
  const currentStrokeColor = colorOptions.find(c => c.name === strokeColor) || colorOptions[0];
  const currentFillColor = colorOptions.find(c => c.name === fillColor) || colorOptions[0];

  // Render the color button in the trigger based on whether it's "none" or a regular color
  const renderColorButton = (colorObj: typeof colorOptions[0], isStroke: boolean) => {
    if (colorObj.name === "none") {
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

    return (
      <Square 
        className="h-4 w-4" 
        style={{ 
          stroke: isStroke ? `hsl(${colorObj.hsl})` : "hsl(var(--border))",
          fill: isStroke ? "transparent" : `hsl(${colorObj.hsl})`,
          strokeWidth: isStroke ? "2px" : "1px"
        }} 
      />
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
              {renderColorButton(currentStrokeColor, true)}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" sideOffset={15} align="start" className="grid grid-cols-8 gap-1 p-2 w-64">
            {colorOptions.map((color) => (
              <Button 
                key={`stroke-${color.name}`} 
                variant="ghost" 
                className="h-6 w-6 p-0 rounded-md relative"
                style={{ 
                  border: strokeColor === color.name ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  background: color.name === "none" ? 'transparent' : `hsl(${color.hsl})` 
                }}
                onClick={() => handleStrokeColorChange(color.name)}
              >
                {color.name === "none" && (
                  <>
                    <Square className="h-4 w-4 absolute" style={{ stroke: "hsl(var(--border))", fill: "transparent" }} />
                    <Slash className="h-4 w-4 absolute text-muted-foreground" />
                  </>
                )}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Fill color picker */}
      <div className="flex flex-row items-center justify-between w-full">
        <Label htmlFor="fill-color" className="text-sm font-medium text-muted-foreground mr-2">Fill</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              {renderColorButton(currentFillColor, false)}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" sideOffset={15} align="start" className="grid grid-cols-8 gap-1 p-2 w-64">
            {colorOptions.map((color) => (
              <Button 
                key={`fill-${color.name}`} 
                variant="ghost" 
                className="h-6 w-6 p-0 rounded-md relative"
                style={{ 
                  border: fillColor === color.name ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  background: color.name === "none" ? 'transparent' : `hsl(${color.hsl})` 
                }}
                onClick={() => handleFillColorChange(color.name)}
              >
                {color.name === "none" && (
                  <>
                    <Square className="h-4 w-4 absolute" style={{ stroke: "hsl(var(--border))", fill: "transparent" }} />
                    <Slash className="h-4 w-4 absolute text-muted-foreground" />
                  </>
                )}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ColorControls; 