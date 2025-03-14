'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import ColorControls from '@/app/(Workspace)/workspace/canvas/components/ui/ColorControls';
import ShapeControls from '@/app/(Workspace)/workspace/canvas/components/ui/ShapeControls';
import LayerControls from '@/app/(Workspace)/workspace/canvas/components/ui/LayerControls';
import ActionControls from '@/app/(Workspace)/workspace/canvas/components/ui/ActionControls';
import AlignmentControls from '@/app/(Workspace)/workspace/canvas/components/ui/AlignmentControls';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';
import TextControls from '@/app/(Workspace)/workspace/canvas/components/ui/TextControls';
import LineConnectorControls from '@/app/(Workspace)/workspace/canvas/components/ui/LineEndpointControls';

const SideControls = () => {
  // Get nodes from the canvas store
  const { nodes } = useCanvasStore();
  
  // Check if any nodes are selected
  const hasSelectedNodes = nodes.some(node => node.selected);
  
  // Only render the controls if at least one node is selected
  if (!hasSelectedNodes) {
    return null;
  }
  
  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 space-y-4">
      <Card className="flex flex-col items-left bg-background/80 backdrop-blur-sm p-2 space-y-4">

        {/* Text Controls */}
        <TextControls />

        {/* Color Controls */}
        <ColorControls />

        {/* Edge Controls */}
        <ShapeControls />

        {/* line connector controls */}
        <LineConnectorControls />
        {/* Layer Controls */}
        <LayerControls />

        {/* Alignment Controls */}
        <AlignmentControls />

        {/* Action Controls */}
        <ActionControls />
      </Card>
    </div>
  );
};

export default SideControls; 