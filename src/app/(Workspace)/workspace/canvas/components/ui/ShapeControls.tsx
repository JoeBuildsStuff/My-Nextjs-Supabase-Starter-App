'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Square } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const ShapeControls = () => {
  const { borderRadius, setBorderRadius } = useCanvasStore();

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <Label className="text-sm font-medium text-muted-foreground">Edge</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Square className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-fit" sideOffset={15} align="start">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Border Radius</Label>
            <span className="text-sm text-muted-foreground">{borderRadius}px</span>
          </div>
          {/* Preset Toggle Group */}
          <ToggleGroup 
            className="w-full justify-between mb-4" 
            type="single" 
            value={borderRadius.toString()} 
            onValueChange={(value) => setBorderRadius(parseInt(value))}
          >
            <ToggleGroupItem value="0" aria-label="No radius">
              <div className="w-6 h-6 rounded-none bg-muted-foreground"></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="4" aria-label="Small radius">
              <div className="w-6 h-6 rounded-sm bg-muted-foreground"></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="8" aria-label="Medium radius">
              <div className="w-6 h-6 rounded-md bg-muted-foreground"></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="12" aria-label="Large radius">
              <div className="w-6 h-6 rounded-lg bg-muted-foreground"></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="9999" aria-label="Full radius">
              <div className="w-6 h-6 rounded-full bg-muted-foreground"></div>
            </ToggleGroupItem>
          </ToggleGroup>
          {/* Custom Slider */}
          <Slider
            value={[borderRadius]}
            onValueChange={([value]) => setBorderRadius(value)}
            max={50}
            step={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ShapeControls; 