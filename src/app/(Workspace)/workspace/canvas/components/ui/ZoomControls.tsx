'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const ZoomControls = () => {
  const { transform, zoomIn, zoomOut } = useCanvasStore();
  
  // Convert zoom from 0-1 scale to percentage for display
  const zoomPercentage = Math.round(transform.zoom * 100);

  return (
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
  );
};

export default ZoomControls; 