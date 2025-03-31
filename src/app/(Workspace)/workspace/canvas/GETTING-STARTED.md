# Getting Started with the Canvas Module

This guide will help you understand how to use the Canvas module in your project, as well as how to customize and extend it for your specific needs.

## Quick Start

To start using the Canvas component:

1. Navigate to the Canvas page at `/workspace/canvas`
2. Use the toolbar at the top to select drawing tools
3. Click anywhere on the canvas to place shapes
4. Use the selection tool to move, resize, and edit elements
5. Connect shapes using line and arrow tools
6. Save your work by exporting to JSON

## Canvas Controls

### Navigation
- **Pan**: Use the hand tool, or hold spacebar while dragging
- **Zoom**: Use the zoom controls in the bottom left, or scroll with Ctrl/Cmd + mouse wheel
- **Reset View**: Double-click the home icon in the zoom controls

### Selection
- **Select Single**: Click on an element with the select tool
- **Select Multiple**: Hold Shift while clicking, or drag a selection box
- **Select All**: Press Ctrl/Cmd + A

### Editing
- **Move**: Drag selected elements
- **Resize**: Drag the resize handles of selected shapes
- **Delete**: Press Delete or Backspace
- **Duplicate**: Press Ctrl/Cmd + D, or use the duplicate button
- **Undo/Redo**: Press Ctrl/Cmd + Z / Ctrl/Cmd + Shift + Z, or use the buttons

## Working with Shapes

### Creating Shapes
1. Select a shape tool from the toolbar (Rectangle, Circle, Diamond, etc.)
2. Click on the canvas to place the shape
3. Use the style controls to customize its appearance

### Styling Shapes
1. Select a shape
2. Use the side panel to adjust:
   - Fill color
   - Stroke color and width
   - Border radius
   - Line style (solid, dashed, dotted)

### Text Elements
1. Select the text tool
2. Click on the canvas to place a text box
3. Type your text
4. Use the text controls to adjust:
   - Font size
   - Text alignment
   - Font weight
   - Text color

## Working with Lines and Connections

### Creating Lines
1. Select the line or arrow tool
2. Click and drag to create a simple line
3. For multi-segment lines, click to add points and double-click to finish

### Connecting Shapes
1. Select the line or arrow tool
2. Hover over a shape to see connection points
3. Click on a connection point to start the line
4. Drag to another shape
5. Click on a connection point of the target shape to complete the connection

### Editing Lines
1. Select a line
2. Drag the line's points to adjust its path
3. Double-click on a line segment to add new points
4. Select individual points and press Delete to remove them
5. Use the line controls to customize:
   - Line type (straight or elbow)
   - Start and end markers
   - Marker fill style
   - Animation

## Advanced Features

### Alignment
1. Select multiple shapes
2. Use the alignment controls to align or distribute them:
   - Align left, center, right
   - Align top, middle, bottom
   - Distribute horizontally or vertically

### Grouping
1. Select multiple shapes
2. Press Ctrl/Cmd + G or use the group button to group them
3. Grouped elements move and resize together
4. Press Ctrl/Cmd + Shift + G to ungroup

### Presentation Mode
1. Press F5 or Ctrl/Cmd + P to enter presentation mode
2. The UI controls will be hidden for a clean view
3. Press ESC to exit presentation mode

### Import and Export
1. Copy your canvas to the clipboard with Ctrl/Cmd + C
2. Paste a previously copied canvas with Ctrl/Cmd + V
3. The canvas is copied as a JSON object that can be shared and imported

## Using the Canvas Programmatically

### Basic Integration

```tsx
import Canvas from '@/app/(Workspace)/workspace/canvas/components/Canvas';

const MyComponent = () => {
  return (
    <div className="w-full h-full">
      <Canvas />
    </div>
  );
};
```

### Custom Initial Nodes

```tsx
import Canvas from '@/app/(Workspace)/workspace/canvas/components/Canvas';
import { Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const MyComponent = () => {
  // Define custom nodes
  const customNodes: Node[] = [
    {
      id: '1',
      type: 'rectangle',
      position: { x: 100, y: 100 },
      dimensions: { width: 120, height: 80 },
      data: { text: 'Hello World' },
      style: {
        fillColor: 'blue-500',
        strokeColor: 'blue-700',
        strokeWidth: 2
      }
    },
    // ... more nodes
  ];

  return (
    <div className="w-full h-full">
      <Canvas nodes={customNodes} />
    </div>
  );
};
```

### Listening to Canvas Changes

```tsx
import Canvas from '@/app/(Workspace)/workspace/canvas/components/Canvas';
import { Node } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const MyComponent = () => {
  const handleNodesChange = (nodes: Node[]) => {
    console.log('Canvas nodes updated:', nodes);
    // Save to your state/database, etc.
  };

  return (
    <div className="w-full h-full">
      <Canvas onNodesChange={handleNodesChange} />
    </div>
  );
};
```

## Creating Custom Node Types

1. First, extend the NodeRegistry in `/components/NodeRegistry.tsx`:

```tsx
// Import your custom renderer
import CustomNodeRenderer from './shapes/CustomNodeRenderer';

// Add to the node registry
nodeRegistry.register('custom-shape', {
  create: ({ x, y, data = {} }) => ({
    id: generateId(),
    type: 'custom-shape',
    position: { x, y },
    dimensions: { width: 150, height: 100 },
    data,
    style: {
      fillColor: 'indigo-500',
      strokeColor: 'indigo-700',
      strokeWidth: 2
    }
  }),
  render: props => <CustomNodeRenderer {...props} />
});
```

2. Create your custom renderer component:

```tsx
// shapes/CustomNodeRenderer.tsx
import React from 'react';
import { Node } from '../lib/store/canvas-store';

interface CustomNodeRendererProps {
  node: Node;
}

const CustomNodeRenderer: React.FC<CustomNodeRendererProps> = ({ node }) => {
  const { dimensions, style, data } = node;
  const { width = 150, height = 100 } = dimensions || {};
  
  return (
    <div
      className="custom-node"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: style?.fillColor,
        border: `${style?.strokeWidth}px ${style?.strokeStyle} ${style?.strokeColor}`,
        borderRadius: `${style?.borderRadius}px`,
      }}
    >
      {/* Custom content */}
      <div className="p-2">{data?.text || 'Custom Node'}</div>
    </div>
  );
};

export default CustomNodeRenderer;
```

3. Add your custom tool to the Toolbar:

```tsx
// Extend the Toolbar component with your custom tool
const toolMap: Record<number, ToolType> = {
  // ... existing tools
  14: 'custom-shape' as ToolType,
};

const tools = [
  // ... existing tools
  { type: 'separator' },
  { id: 14, icon: <CustomIcon className="" size={16} />, name: "Custom Shape" },
];
```

## Loading Example Diagrams

The Canvas component includes several example diagrams that you can load:

1. Click the Examples tool (network icon) in the toolbar
2. Select an example from the gallery
3. Click to load it into your canvas

These examples are stored as JSON files in the `/examples` directory and can serve as templates for your own diagrams.

## Troubleshooting

### Canvas Not Rendering Properly
- Ensure the parent container has a defined width and height
- Check that you're not accidentally applying transforms to parent elements
- Verify that all required dependencies are installed

### Connection Issues
- Make sure connection points are visible when using line tools
- Check that you're clicking on the connection points, not just near them
- For automatic connections, verify the connection data structure is correct

### Performance Problems
- Reduce the number of nodes on the canvas
- Simplify complex shapes and lines
- Enable grid snapping to reduce rendering calculations
- Consider using the elbow line type for complex diagrams 