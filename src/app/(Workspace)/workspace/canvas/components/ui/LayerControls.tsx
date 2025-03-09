'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Layers, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const LayerControls = () => {
  const { 
    moveSelectedToFront, 
    moveSelectedToBack, 
    moveSelectedForward, 
    moveSelectedBackward 
  } = useCanvasStore();

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <Label className="text-sm font-medium text-muted-foreground">Order</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Layers className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-fit h-fit p-1 m-0" sideOffset={15} align="start">
          <div className="w-fit">
            <Button variant="ghost" size="icon" onClick={moveSelectedToFront}>
              <ChevronsUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={moveSelectedForward}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={moveSelectedBackward}>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={moveSelectedToBack}>
              <ChevronsDown className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LayerControls; 