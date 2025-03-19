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
import { isElbowLine } from '../../lib/utils/elbow-line-utils';

const SideControls = () => {
  // Get nodes from the canvas store
  const { nodes } = useCanvasStore();
  
  // Check if any nodes are selected
  const hasSelectedNodes = nodes.some(node => node.selected);
  
  // Only render the controls if at least one node is selected
  if (!hasSelectedNodes) {
    return null;
  }
  
  // Get the selected node types
  const selectedNodes = nodes.filter(node => node.selected);
  const selectedNodeTypes = selectedNodes.map(node => node.type);
  
  // Check what types of nodes are selected
  const hasTextNode = selectedNodeTypes.includes('text');
  const hasLineNode = selectedNodeTypes.includes('line') || selectedNodeTypes.includes('arrow');
  const hasShapeNode = selectedNodeTypes.some(type => !['line', 'arrow'].includes(type));
  
  // Check if any selected node is an elbow line
  const hasSelectedElbowLine = selectedNodes.some(node => isElbowLine(node));
  
  // Show ShapeControls for regular shapes or elbow lines
  const shouldShowShapeControls = hasShapeNode || hasSelectedElbowLine;
  
  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 space-y-4">
      <Card className="flex flex-col items-left bg-background/80 backdrop-blur-sm p-2 space-y-4">

        {/* Text Controls - only show if text node selected */}
        {hasTextNode && (
          <TextControls />
        )}

        {/* Color Controls */}
        <ColorControls />

        {/* Edge Controls - only for shapes and elbow lines */}
        {shouldShowShapeControls && (
          <ShapeControls />
        )}

        {/* line connector controls - only for lines */}
        {hasLineNode && (
          <LineConnectorControls />
        )}

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