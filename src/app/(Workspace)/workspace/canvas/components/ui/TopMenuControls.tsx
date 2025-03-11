'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Share, BookOpen, Presentation, PencilRuler } from 'lucide-react';
import { useCanvasStore } from '../../lib/store/canvas-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TopMenuControlsProps {
  position: 'left' | 'right';
  presentationModeOnly?: boolean;
}

const TopMenuControls = ({ position, presentationModeOnly = false }: TopMenuControlsProps) => {
  const { presentationMode, togglePresentationMode } = useCanvasStore();

  const handleTogglePresentationMode = () => {
    togglePresentationMode();
  };

  return (
    <div className={`absolute top-4 ${position === 'left' ? 'left-4' : 'right-4'} ${position === 'right' ? 'flex space-x-2' : ''}`}>
      {position === 'left' ? (
<Popover>
<PopoverTrigger asChild>
  <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
  <Menu className="w-5 h-5" />
  </Button>
</PopoverTrigger>
<PopoverContent side="bottom" align="start" sideOffset={10} className="w-fit">
  <p>I don&apos;t do anything... yet</p>
</PopoverContent>
</Popover>
      ) : (
        <>
          {!presentationMode && !presentationModeOnly && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
                    <Share className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" sideOffset={10} className="w-fit">
                  <p>I don&apos;t do anything... yet</p>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" sideOffset={10} className="w-fit">
                  <p>I don&apos;t do anything... yet</p>
                </PopoverContent>
              </Popover>
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