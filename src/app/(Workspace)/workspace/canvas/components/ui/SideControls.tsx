'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import ColorControls from '@/app/(Workspace)/workspace/canvas/components/ui/ColorControls';
import ShapeControls from '@/app/(Workspace)/workspace/canvas/components/ui/ShapeControls';
import LayerControls from '@/app/(Workspace)/workspace/canvas/components/ui/LayerControls';
import ActionControls from '@/app/(Workspace)/workspace/canvas/components/ui/ActionControls';
import AlignmentControls from '@/app/(Workspace)/workspace/canvas/components/ui/AlignmentControls';

const SideControls = () => {
  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 space-y-4">
      <Card className="flex flex-col items-left bg-background/80 backdrop-blur-sm p-2 space-y-4">
        {/* Color Controls */}
        <ColorControls />

        {/* Edge Controls */}
        <ShapeControls />

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