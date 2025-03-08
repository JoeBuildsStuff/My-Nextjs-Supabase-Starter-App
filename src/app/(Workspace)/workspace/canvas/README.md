# ReactFlow-like Canvas Implementation

This is an implementation of a ReactFlow-style interactive diagram and workflow tool based on the technical specification.

## Phase 1: Canvas Foundation

The initial implementation includes:

- Basic canvas with zoom/pan functionality
- Snap-to-grid functionality
- Viewport transformation
- Basic state management architecture using Zustand and Immer

### Features Implemented

1. **Canvas Component**:
   - Renders a canvas with proper event handling
   - Supports panning with mouse drag (when using hand tool, middle mouse button, or Alt+left mouse)
   - Supports zooming with mouse wheel
   - Renders a grid that scales with zoom level

2. **State Management**:
   - Uses Zustand for global state management
   - Uses Immer for immutable state updates
   - Implements selectors for optimized rerenders

3. **Tool Selection**:
   - Integrated with the existing toolbar UI
   - Supports different tools (select, hand, rectangle, etc.)

### Usage

The canvas can be used by importing the `Canvas` component:

```jsx
import Canvas from './components/Canvas';

// In your component
<Canvas className="w-full h-full" />
```

### Next Steps

- Implement node rendering system
- Create drag behavior for nodes
- Implement resize functionality
- Add node selection (single and multi)
- Create custom node templates system
- Implement z-index layering 