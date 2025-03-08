'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';

import {
  Hand,
  MousePointer,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Pen,
  Type,
  Eraser,
  Share,
  Undo,
  Redo,
  Diamond,
  Cylinder,
  Menu,
  BookOpen,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Import our Canvas component and store
import Canvas from './components/Canvas';
import { useCanvasStore, ToolType } from '@/lib/store/canvas-store';

const DrawingCanvasUI = () => {
  // Use the canvas store instead of local state
  const { 
    activeTool, 
    setActiveTool, 
    transform,
    zoomIn,
    zoomOut,
    createShapeAtPosition
  } = useCanvasStore();
  
  // Map tool IDs to tool types
  const toolMap: Record<number, ToolType> = {
    0: 'hand',
    1: 'select',
    2: 'rectangle',
    3: 'diamond',
    4: 'circle',
    5: 'cylinder' as ToolType,
    6: 'arrow',
    7: 'line',
    8: 'pen',
    9: 'text',
    10: 'eraser'
  };
  
  // Convert zoom from 0-1 scale to percentage for display
  const zoomPercentage = Math.round(transform.zoom * 100);
  
  const tools = [
    // Navigation tools
    { id: 0, icon: <Hand className="" size={16} />, name: "Hand" },
    { id: 1, icon: <MousePointer className="" size={16} />, name: "Select"},
    { type: 'separator' },
    // Shape tools
    { id: 2, icon: <Square className="" size={16} />, name: "Rectangle"},
    { id: 3, icon: <Diamond className="" size={16} />, name: "Diamond"},
    { id: 4, icon: <Circle className="" size={16} />, name: "Circle"},
    { id: 5, icon: <Cylinder className="" size={16} />, name: "Cylinder"},
    { type: 'separator' },
    // Line tools
    { id: 6, icon: <ArrowRight className="" size={16} />, name: "Arrow"},
    { id: 7, icon: <Minus className="" size={16} />, name: "Line"},
    { id: 8, icon: <Pen className="" size={16} />, name: "Pen"},
    { type: 'separator' },
    // Content tools
    { id: 9, icon: <Type className="" size={16} />, name: "Text"},
    { id: 10, icon: <Eraser className="" size={16} />, name: "Eraser"}
  ];

  // Handle tool selection
  const handleToolSelect = (toolId: number) => {
    const toolType = toolMap[toolId];
    if (toolType) {
      setActiveTool(toolType);
      
      // If a shape tool is selected, create the shape below the toolbar
      if (['rectangle', 'diamond', 'circle', 'cylinder', 'arrow', 'line'].includes(toolType)) {
        // Calculate position below the toolbar
        // The toolbar is at top-4 (16px) and has a height of about 40px
        // We'll place the shape at a fixed position below the toolbar
        const toolbarHeight = 60; // Approximate height of toolbar + margin
        
        // Calculate the center of the screen horizontally
        const centerX = window.innerWidth / 2;
        
        // Calculate the position in canvas coordinates
        const canvasX = (centerX - transform.x) / transform.zoom;
        const canvasY = (toolbarHeight - transform.y) / transform.zoom;
        
        // Create the shape at the calculated position
        createShapeAtPosition(toolType, canvasX, canvasY);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Canvas takes up the full space */}
      <Canvas className="w-full h-full" />
      
      {/* Floating Controls - Top Left */}
      <div className="absolute top-4 left-4">
        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Floating Controls - Top Center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <Card className="flex items-center space-x-1 p-2 bg-background/80 backdrop-blur-sm">
          <TooltipProvider>
            {tools.map((tool, index) => (
              tool.type === 'separator' ? (
                <div key={`separator-${index}`} className="h-6 w-px bg-border mx-1" />
              ) : (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`relative ${activeTool === (tool.id !== undefined ? toolMap[tool.id] : '') ? 'bg-secondary' : ''}`}
                      onClick={() => tool.id !== undefined && handleToolSelect(tool.id)}
                    >
                      {tool.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={10}>
                    <p>{tool.name}</p>
                  </TooltipContent>
                </Tooltip>
              )
            ))}
          </TooltipProvider>
        </Card>
      </div>
      
      {/* Floating Controls - Top Right */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
          <Share className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
          <BookOpen className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Floating Controls - Bottom Left */}
      <div className="absolute bottom-4 left-4">
        <Card className="flex items-center bg-background/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="px-2">{zoomPercentage}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </Card>
      </div>
      
      {/* Floating Controls - Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <Card className="flex items-center bg-background/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default DrawingCanvasUI;