'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronRight, Copy, Delete } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuShortcut 
} from '@/components/ui/dropdown-menu';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const ActionControls = () => {
  const { duplicateSelectedNodes, deleteSelectedNodes } = useCanvasStore();

  // Add keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Command/Control + D is pressed for duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault(); // Prevent browser's default behavior
        duplicateSelectedNodes();
      }
      
      // Check if Delete or Backspace is pressed for delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedNodes();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duplicateSelectedNodes, deleteSelectedNodes]);

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <Label className="text-sm font-medium text-muted-foreground">Actions</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon"><ChevronRight className="w-4 h-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" sideOffset={15} align="start" className="w-fit">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={duplicateSelectedNodes}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteSelectedNodes}>
              <Delete className="mr-2 h-4 w-4" />
              <span>Delete</span>
              <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ActionControls; 