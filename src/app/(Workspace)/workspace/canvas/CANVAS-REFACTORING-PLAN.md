# Canvas.tsx Refactoring Plan

## Current Issues

Canvas.tsx currently has approximately 2200+ lines of code with multiple responsibilities:
- Event handling (mouse, keyboard, touch)
- Rendering logic
- Selection management
- Connection point handling
- Line drawing and manipulation
- Drag and drop operations
- Grid and alignment guides
- State synchronization

This large file is difficult to maintain, test, and extend. The goal of this refactoring is to break it down into smaller, focused components with clear responsibilities.

## Refactoring Approach

We'll use the following approach:
1. Extract custom hooks for stateful logic
2. Create specialized components for rendering
3. Implement a cleaner event handling system
4. Establish clear boundaries between components

## Detailed Refactoring Plan

### Phase 1: Extract Custom Hooks

| Hook | Responsibility | Files to Create |
|------|----------------|----------------|
| `useCanvasEvents` | Handle mouse and keyboard events | `hooks/useCanvasEvents.ts` |
| `useCanvasTransform` | Manage pan and zoom operations | `hooks/useCanvasTransform.ts` |
| `useSelectionBox` | Handle selection box creation and updates | `hooks/useSelectionBox.ts` |
| `useNodeDragging` | Manage node dragging operations | `hooks/useNodeDragging.ts` |
| `useLineDrawing` | Handle drawing and modifying lines | `hooks/useLineDrawing.ts` |
| `useAlignmentGuides` | Calculate and manage alignment guides | `hooks/useAlignmentGuides.ts` |
| `useCanvasShortcuts` | Handle keyboard shortcuts | `hooks/useCanvasShortcuts.ts` |
| `useConnectionPoints` | Handle connection point interactions | `hooks/useConnectionPoints.ts` |

Example implementation of `useCanvasEvents.ts`:

```tsx
import { useRef, useState, useCallback } from 'react';
import { useCanvasStore } from '../lib/store/canvas-store';

export const useCanvasEvents = (canvasRef: React.RefObject<HTMLDivElement>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  // ... other state
  
  const { activeTool, transform, /* other store values */ } = useCanvasStore();
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Mouse down logic
    // ...
  }, [/* dependencies */]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Mouse move logic
    // ...
  }, [/* dependencies */]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Mouse up logic
    // ...
  }, [/* dependencies */]);
  
  // ... other event handlers
  
  return {
    isDragging,
    isSelecting,
    // ... other state
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // ... other handlers
  };
};
```

### Phase 2: Create Specialized Components

| Component | Responsibility | Files to Create |
|-----------|----------------|----------------|
| `CanvasContainer` | Main container and event binding | `components/CanvasContainer.tsx` |
| `CanvasNodes` | Render all nodes on the canvas | `components/CanvasNodes.tsx` |
| `CanvasBackground` | Render grid and background | `components/CanvasBackground.tsx` |
| `CanvasControls` | Render manipulation controls | `components/CanvasControls.tsx` |
| `LineDrawingLayer` | Handle active line drawing | `components/LineDrawingLayer.tsx` |
| `SelectionLayer` | Handle selection visualization | `components/SelectionLayer.tsx` |
| `AlignmentGuideLayer` | Render alignment guides | `components/AlignmentGuideLayer.tsx` |
| `ConnectionPointsLayer` | Render connection points | `components/ConnectionPointsLayer.tsx` |

Example implementation of the new main Canvas component:

```tsx
'use client';

import React, { useRef } from 'react';
import { useCanvasStore } from '../lib/store/canvas-store';
import { useCanvasEvents } from '../hooks/useCanvasEvents';
import { useCanvasTransform } from '../hooks/useCanvasTransform';
import CanvasBackground from './CanvasBackground';
import CanvasNodes from './CanvasNodes';
import LineDrawingLayer from './LineDrawingLayer';
import SelectionLayer from './SelectionLayer';
import AlignmentGuideLayer from './AlignmentGuideLayer';
import ConnectionPointsLayer from './ConnectionPointsLayer';

interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
  nodes?: Node[];
  onNodesChange?: (nodes: Node[]) => void;
  canvasId?: string;
}

const Canvas: React.FC<CanvasProps> = ({ 
  width,
  height,
  className = '',
  nodes = [],
  onNodesChange,
  canvasId
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Custom hooks
  const { transform } = useCanvasTransform(canvasRef, width, height);
  const { 
    isDragging, 
    isSelecting,
    selectionBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // ... other values and handlers
  } = useCanvasEvents(canvasRef);
  
  // Get values from store that we need for rendering
  const { presentationMode } = useCanvasStore();
  
  // Render
  return (
    <div 
      ref={canvasRef}
      className={`canvas ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      // ... other event handlers
    >
      <CanvasBackground />
      
      <CanvasNodes 
        nodes={nodes.length > 0 ? nodes : storeNodes} 
        onNodesChange={onNodesChange}
      />
      
      <LineDrawingLayer />
      
      {isSelecting && selectionBox && (
        <SelectionLayer selectionBox={selectionBox} />
      )}
      
      <AlignmentGuideLayer />
      
      {!presentationMode && (
        <ConnectionPointsLayer />
      )}
    </div>
  );
};

export default Canvas;
```

### Phase 3: Reorganize Event Handling

Create a unified event handling system that:

1. Centralizes common event logic
2. Creates specialized event handlers based on the active tool
3. Implements a proper event propagation strategy

```tsx
// hooks/useToolEvents.ts
export const useToolEvents = (activeTool: ToolType) => {
  // Return the appropriate event handlers based on the active tool
  switch (activeTool) {
    case 'select':
      return useSelectionToolEvents();
    case 'hand':
      return usePanToolEvents();
    case 'rectangle':
    case 'circle':
    case 'diamond':
    case 'triangle':
    case 'cylinder':
      return useShapeToolEvents(activeTool);
    case 'line':
    case 'arrow':
      return useLineToolEvents(activeTool);
    // ... other tools
    default:
      return useDefaultToolEvents();
  }
};
```

### Phase 4: Implement New Component Structure

1. Create the new component and hook files
2. Gradually move code from Canvas.tsx to the new files
3. Update imports and dependencies
4. Ensure tests pass after each refactoring step

## Testing Strategy

For each refactored component and hook:

1. Create unit tests for isolated functionality
2. Verify that the component behavior matches the original
3. Test edge cases specific to the component's responsibility
4. Ensure proper integration with other components

## Implementation Plan

| Week | Tasks | Expected Output |
|------|-------|----------------|
| Week 1 | Extract custom hooks for events and transformations | `useCanvasEvents.ts`, `useCanvasTransform.ts` |
| Week 1 | Create basic component structure | Component files with minimal implementations |
| Week 2 | Implement background and nodes components | `CanvasBackground.tsx`, `CanvasNodes.tsx` |
| Week 2 | Implement selection and line drawing layers | `SelectionLayer.tsx`, `LineDrawingLayer.tsx` |
| Week 3 | Implement alignment and connection point layers | `AlignmentGuideLayer.tsx`, `ConnectionPointsLayer.tsx` |
| Week 3 | Integrate components into main Canvas | Updated `Canvas.tsx` |
| Week 4 | Full testing and performance optimization | Test files, performance improvements |

## Migration Strategy

To minimize disruption while refactoring:

1. Keep the original Canvas.tsx functional during refactoring
2. Implement and test new components in parallel
3. Gradually replace functionality in Canvas.tsx with calls to new components
4. Use feature flags to toggle between old and new implementations
5. Once verified, remove the old implementation

## Expected Benefits

This refactoring will provide:

1. **Improved maintainability**: Smaller, focused components are easier to understand and maintain
2. **Better testability**: Isolated functionality can be tested more effectively
3. **Enhanced performance**: More granular re-rendering and better memoization
4. **Easier extensibility**: Clear boundaries make it easier to add new features
5. **Better developer experience**: Simpler mental model and code navigation

## Potential Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Regression bugs | Comprehensive test suite, gradual migration |
| Performance degradation | Performance profiling before and after changes |
| API inconsistencies | Clear documentation of component interfaces |
| Extended timeline | Prioritize components by complexity and impact |

## Conclusion

This refactoring plan provides a structured approach to breaking down the monolithic Canvas.tsx component into smaller, more manageable pieces. By following this plan, we can improve code quality while maintaining functionality and minimizing disruption to ongoing development.

The end result will be a more maintainable and extensible canvas implementation that's easier to test, debug, and enhance with new features. 