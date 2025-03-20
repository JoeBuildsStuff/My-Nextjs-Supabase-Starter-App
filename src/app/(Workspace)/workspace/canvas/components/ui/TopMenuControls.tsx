'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Presentation, PencilRuler, HelpCircle, Grip } from 'lucide-react';
import { useCanvasStore } from '../../lib/store/canvas-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { ExportButton } from './ExportButton';
import { ImportButton } from './ImportButton';
import { InstructionsComponent } from './InstructionsComponent';

interface TopMenuControlsProps {
  position: 'left' | 'right';
  presentationModeOnly?: boolean;
}

const TopMenuControls = ({ position, presentationModeOnly = false }: TopMenuControlsProps) => {
  const { presentationMode, togglePresentationMode } = useCanvasStore();

  const handleTogglePresentationMode = () => {
    togglePresentationMode();
  };

  const { snapToGrid, gridSize, setSnapToGrid, setGridSize } = useCanvasStore();

  const handleToggleSnapToGrid = (checked: boolean) => {
    setSnapToGrid(checked);
  };

  const handleGridSizeChange = (value: number[]) => {
    setGridSize(value[0]);
  };

  return (
    <div className={`absolute top-4 ${position === 'left' ? 'left-4' : 'right-4'} ${position === 'right' ? 'flex space-x-2' : ''}`}>
      {position === 'left' ? (
 <DropdownMenu> 
 <DropdownMenuTrigger asChild>
   <Button variant="outline" size="icon">
     <Menu className="h-4 w-4" />
     <span className="sr-only">Grid Controls</span>
   </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-fit">
   <DropdownMenuLabel>Grid Settings (⌘G)</DropdownMenuLabel>
   <DropdownMenuSeparator />

   <div className="p-4 space-y-6">
     {/* Grid Toggle */}
     <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
         <Grip className="h-4 w-4 text-muted-foreground" />
         <p className="text-sm">Snap to Grid</p>
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help mr-8" />
             </TooltipTrigger>
             <TooltipContent className="max-w-xs">
               <div className="space-y-1">
                 <h4 className="font-medium">About Grid Feature</h4>
                 <ul className="text-sm space-y-1">
                   <li>• Grid helps align elements precisely</li>
                   <li>• Smaller grid size offers finer control</li>
                   <li>• Hold Shift to temporarily disable snapping</li>
                   <li>• Double-click grid toggle to reset to defaults</li>
                   <li>• Use ⌘G / Ctrl+G to toggle grid</li>
                 </ul>
               </div>
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
       </div>
       <Switch 
         checked={snapToGrid} 
         onCheckedChange={handleToggleSnapToGrid} 
         aria-label="Toggle grid" 
       />
     </div>

     {/* Grid Size Slider - Only shown when grid is enabled */}
     <AnimatePresence>
       {snapToGrid && (
         <motion.div
           className="space-y-2"
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: "auto" }}
           exit={{ opacity: 0, height: 0 }}
           transition={{ duration: 0.2 }}
         >
           <div className="flex items-center justify-between">
           <p className="text-sm">Grid Size</p>
             <span className="text-sm font-medium">{gridSize}px</span>
           </div>
           <Slider
             min={5}
             max={50}
             step={5}
             value={[gridSize]}
             onValueChange={handleGridSizeChange}
             aria-label="Grid size"
           />

         </motion.div>
       )}
     </AnimatePresence>
   </div>
 </DropdownMenuContent>
</DropdownMenu>
      ) : (
        <>
          {!presentationMode && !presentationModeOnly && (
            <>
              <ExportButton />
              <ImportButton />
              <InstructionsComponent />
            </>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-background/80 backdrop-blur-sm"
                  onClick={handleTogglePresentationMode}
                >
                  {presentationMode ? (
                    <PencilRuler className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Presentation className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{presentationMode ? "Exit presentation mode" : "Enter presentation mode"}</p>
                <p className="text-xs text-muted-foreground">Shortcut: F5 or Ctrl+P</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
};

export default TopMenuControls; 