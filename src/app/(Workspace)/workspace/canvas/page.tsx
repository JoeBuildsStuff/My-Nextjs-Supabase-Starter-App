'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  ZoomOut,
  Layers,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
  SquareRoundCorner,
  ChevronRight,
  Copy,
  Delete,
} from 'lucide-react';

// Import Slider component
import { Slider } from '@/components/ui/slider';

// Import our Canvas component and store
import Canvas from './components/Canvas';
import { useCanvasStore, ToolType } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';

const DrawingCanvasUI = () => {
  // Use the canvas store instead of local state
  const { 
    activeTool, 
    setActiveTool, 
    transform,
    zoomIn,
    zoomOut,
    createShapeAtPosition,
    strokeColor,
    fillColor,
    setStrokeColor,
    setFillColor,
    moveSelectedToFront,
    moveSelectedToBack,
    moveSelectedForward,
    moveSelectedBackward,
    borderRadius,
    setBorderRadius,
    duplicateSelectedNodes,
    deleteSelectedNodes
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

  // Handle color selection
  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
  };

  const handleFillColorChange = (color: string) => {
    setFillColor(color);
  };

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

      {/* Floating Controls - Center Left */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2">
        <Card className="flex flex-col items-left bg-background/80 backdrop-blur-sm p-2 space-y-4">
          {/* Color Controls */}
          <div className="space-y-2">
            {/* Stroke color picker */}
            <div className="flex flex-row items-center justify-between w-full">
              <Label htmlFor="stroke-color" className="text-sm font-medium text-muted-foreground mr-2">Stroke</Label>
              <ToggleGroup type="single" value={strokeColor} onValueChange={handleStrokeColorChange}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Square className={`h-4 w-4 stroke-${strokeColor}`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="right" sideOffset={15} align="start" className="grid grid-cols-8">
                    <ToggleGroupItem value="white" aria-label="Toggle white">
                      <Square className="h-4 w-4 stroke-white" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="black" aria-label="Toggle black">
                      <Square className="h-4 w-4 stroke-black dark:fill-secondary" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="slate-500" aria-label="Toggle slate">
                      <Square className="h-4 w-4 stroke-slate-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="gray-500" aria-label="Toggle gray">
                      <Square className="h-4 w-4 stroke-gray-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="zinc-500" aria-label="Toggle zinc">
                      <Square className="h-4 w-4 stroke-zinc-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="neutral-500" aria-label="Toggle neutral">
                      <Square className="h-4 w-4 stroke-neutral-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="stone-500" aria-label="Toggle stone">
                      <Square className="h-4 w-4 stroke-stone-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="pink-500" aria-label="Toggle pink">
                      <Square className="h-4 w-4 stroke-pink-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="rose-500" aria-label="Toggle rose">
                      <Square className="h-4 w-4 stroke-rose-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="red-500" aria-label="Toggle red">
                      <Square className="h-4 w-4 stroke-red-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="orange-500" aria-label="Toggle orange">
                      <Square className="h-4 w-4 stroke-orange-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="amber-500" aria-label="Toggle amber">
                      <Square className="h-4 w-4 stroke-amber-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="yellow-500" aria-label="Toggle yellow">
                      <Square className="h-4 w-4 stroke-yellow-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="lime-500" aria-label="Toggle lime">
                      <Square className="h-4 w-4 stroke-lime-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="green-500" aria-label="Toggle green">
                      <Square className="h-4 w-4 stroke-green-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="emerald-500" aria-label="Toggle emerald">
                      <Square className="h-4 w-4 stroke-emerald-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="teal-500" aria-label="Toggle teal">
                      <Square className="h-4 w-4 stroke-teal-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="cyan-500" aria-label="Toggle cyan">
                      <Square className="h-4 w-4 stroke-cyan-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="sky-500" aria-label="Toggle sky">
                      <Square className="h-4 w-4 stroke-sky-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="blue-500" aria-label="Toggle blue">
                      <Square className="h-4 w-4 stroke-blue-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="indigo-500" aria-label="Toggle indigo">
                      <Square className="h-4 w-4 stroke-indigo-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="violet-500" aria-label="Toggle violet">
                      <Square className="h-4 w-4 stroke-violet-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="purple-500" aria-label="Toggle purple">
                      <Square className="h-4 w-4 stroke-purple-500" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fuchsia-500" aria-label="Toggle fuchsia">
                      <Square className="h-4 w-4 stroke-fuchsia-500" />
                    </ToggleGroupItem>

                  </PopoverContent>
                </Popover>
              </ToggleGroup>
            </div>

            {/* Fill color picker */}
            <div className="flex flex-row items-center justify-between w-full">
              <Label htmlFor="fill-color" className="text-sm font-medium text-muted-foreground mr-2">Fill</Label>
              <ToggleGroup type="single" value={fillColor} onValueChange={handleFillColorChange}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Square className={`h-4 w-4 fill-${fillColor} stroke-0`} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="right" sideOffset={15} align="start" className="grid grid-cols-8">
                    <ToggleGroupItem value="white" aria-label="Toggle white">
                      <Square className="h-4 w-4 fill-white " />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="black" aria-label="Toggle black">
                      <Square className="h-4 w-4 fill-black stroke-0 dark:stroke-white/35 dark:stroke-1" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="slate-500" aria-label="Toggle slate">
                      <Square className="h-4 w-4 fill-slate-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="gray-500" aria-label="Toggle gray">
                      <Square className="h-4 w-4 fill-gray-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="zinc-500" aria-label="Toggle zinc">
                      <Square className="h-4 w-4 fill-zinc-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="neutral-500" aria-label="Toggle neutral">
                      <Square className="h-4 w-4 fill-neutral-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="stone-500" aria-label="Toggle stone">
                      <Square className="h-4 w-4 fill-stone-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="pink-500" aria-label="Toggle pink">
                      <Square className="h-4 w-4 fill-pink-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="rose-500" aria-label="Toggle rose">
                      <Square className="h-4 w-4 fill-rose-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="red-500" aria-label="Toggle red">
                      <Square className="h-4 w-4 fill-red-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="orange-500" aria-label="Toggle orange">
                      <Square className="h-4 w-4 fill-orange-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="amber-500" aria-label="Toggle amber">
                      <Square className="h-4 w-4 fill-amber-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="yellow-500" aria-label="Toggle yellow">
                      <Square className="h-4 w-4 fill-yellow-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="lime-500" aria-label="Toggle lime">
                      <Square className="h-4 w-4 fill-lime-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="green-500" aria-label="Toggle green">
                      <Square className="h-4 w-4 fill-green-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="emerald-500" aria-label="Toggle emerald">
                      <Square className="h-4 w-4 fill-emerald-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="teal-500" aria-label="Toggle teal">
                      <Square className="h-4 w-4 fill-teal-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="cyan-500" aria-label="Toggle cyan">
                      <Square className="h-4 w-4 fill-cyan-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="sky-500" aria-label="Toggle sky">
                      <Square className="h-4 w-4 fill-sky-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="blue-500" aria-label="Toggle blue">
                      <Square className="h-4 w-4 fill-blue-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="indigo-500" aria-label="Toggle indigo">
                      <Square className="h-4 w-4 fill-indigo-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="violet-500" aria-label="Toggle violet">
                      <Square className="h-4 w-4 fill-violet-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="purple-500" aria-label="Toggle purple">
                      <Square className="h-4 w-4 fill-purple-500 stroke-0" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fuchsia-500" aria-label="Toggle fuchsia">
                      <Square className="h-4 w-4 fill-fuchsia-500 stroke-0" />
                    </ToggleGroupItem>

                  </PopoverContent>
                </Popover>
              </ToggleGroup>
            </div>

            {/* Edge Controls */}
          <div className="flex flex-row items-center justify-between w-full">
              <Label className="text-sm font-medium text-muted-foreground">Edge</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <SquareRoundCorner className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-fit" sideOffset={15} align="start">

                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Border Radius</Label>
                    <span className="text-sm text-muted-foreground">{borderRadius}px</span>
                  </div>
                  {/* Preset Toggle Group */}
                    <ToggleGroup className="w-full justify-between mb-4" type="single" value={borderRadius.toString()} onValueChange={(value) => setBorderRadius(parseInt(value))}>
                      <ToggleGroupItem value="0" aria-label="No radius">
                        <div className="w-4 h-4 rounded-none bg-muted-foreground"></div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="4" aria-label="Small radius">
                        <div className="w-4 h-4 rounded-sm bg-muted-foreground"></div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="8" aria-label="Medium radius">
                        <div className="w-4 h-4 rounded-md bg-muted-foreground"></div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="16" aria-label="Large radius">
                        <div className="w-4 h-4 rounded-lg bg-muted-foreground"></div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="9999" aria-label="Full radius">
                        <div className="w-4 h-4 rounded-full bg-muted-foreground"></div>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  {/* Custom Slider */}
                  <Slider
                    value={[borderRadius]}
                    onValueChange={([value]) => setBorderRadius(value)}
                    max={50}
                    step={1}
                    className=""
                  />
              </PopoverContent>
            </Popover>
          </div>

          {/* Layer Controls */}
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

                      {/* Action Controls */}
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
          </div>
        </Card>
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