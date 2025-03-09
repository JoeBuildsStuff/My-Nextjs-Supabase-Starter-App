'use client';

import React from 'react';
import Canvas from './components/Canvas';
// import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import Toolbar from './components/ui/Toolbar';
import SideControls from './components/ui/SideControls';
import ZoomControls from './components/ui/ZoomControls';
import UndoRedoControls from './components/ui/UndoRedoControls';
import TopMenuControls from './components/ui/TopMenuControls';

const DrawingCanvasUI = () => {
  // Use the canvas store
  // const { transform } = useCanvasStore();
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Canvas takes up the full space */}
      <Canvas className="w-full h-full" />
      
      {/* Floating Controls - Top Left */}
      <TopMenuControls position="left" />
      
      {/* Floating Controls - Top Center */}
      <Toolbar />
      
      {/* Floating Controls - Top Right */}
      <TopMenuControls position="right" />

      {/* Floating Controls - Center Left */}
      <SideControls />
      
      {/* Floating Controls - Bottom Left */}
      <ZoomControls />
      
      {/* Floating Controls - Bottom Right */}
      <UndoRedoControls />
    </div>
  );
};

export default DrawingCanvasUI;