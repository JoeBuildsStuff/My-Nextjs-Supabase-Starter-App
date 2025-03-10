'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Undo, Redo } from 'lucide-react';
import { useCanvasStore } from '../../lib/store/canvas-store';

const UndoRedoControls = () => {
  const { undo, redo } = useCanvasStore();

  // Handle undo with console logging
  const handleUndo = () => {
    console.log('Undo button clicked');
    undo();
  };

  // Handle redo with console logging
  const handleRedo = () => {
    console.log('Redo button clicked');
    redo();
  };

  // Add keyboard event listeners for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Z (or Ctrl+Z) for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        console.log('Keyboard shortcut detected: Cmd+Z (Undo)');
        e.preventDefault();
        undo();
      }
      
      // Check for Cmd+Shift+Z (or Ctrl+Shift+Z) for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        console.log('Keyboard shortcut detected: Cmd+Shift+Z (Redo)');
        e.preventDefault();
        redo();
      }
    };

    console.log('Setting up keyboard event listeners for undo/redo');
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      console.log('Cleaning up keyboard event listeners');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return (
    <div className="absolute bottom-4 right-4">
      <Card className="flex items-center bg-background/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={handleUndo}>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleRedo}>
          <Redo className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
};

export default UndoRedoControls; 