# Canvas Module Documentation

## Overview

The Canvas module is a powerful diagramming and flowchart creation tool built with Next.js and React. It provides a versatile interface for creating, editing, and presenting visual diagrams with shapes, lines, and text. The module is designed with a focus on usability, interactivity, and extensibility.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [State Management](#state-management)
4. [Drawing Tools](#drawing-tools)
5. [Interaction System](#interaction-system)
6. [Shapes and Lines](#shapes-and-lines)
7. [Connection System](#connection-system)
8. [Key Features](#key-features)
9. [Examples](#examples)

## Architecture

The Canvas module is structured following a component-based architecture:

```
/canvas
├── components/               # React components
│   ├── ui/                   # User interface controls
│   ├── shapes/               # Shape rendering components
│   ├── line-drawing/         # Line creation and editing
│   ├── alignment/            # Alignment guides and tools
│   ├── grid/                 # Grid system components
│   ├── selection/            # Selection handling
│   ├── groups/               # Grouping functionality
│   ├── __tests__/            # Component tests
│   ├── Canvas.tsx            # Main canvas component
│   ├── Node.tsx              # Base node component
│   └── NodeRegistry.tsx      # Registry for node types
├── lib/                      # Utilities and logic
│   ├── store/                # State management (Zustand)
│   │   └── canvas-store.ts   # Canvas state and actions
│   ├── utils/                # Utility functions
│   └── icons.ts              # Icon definitions
├── examples/                 # Example diagrams
├── page.tsx                  # Canvas page component
└── KEY-FUNCTIONS.md          # Key functionality documentation
```

## Core Components

### Canvas.tsx
The primary component that renders the drawing surface and handles interactions with the canvas elements. It manages:

- Mouse and keyboard events
- Shape and line drawing
- Selection and transformation
- Connection points system
- Grid and alignment

### NodeRegistry.tsx
Registers different types of nodes (shapes, lines, etc.) that can be added to the canvas, along with their default properties and render methods.

### Node.tsx
Base component for rendering different node types based on their configuration. Handles the common functionality across all node types.

## State Management

The canvas uses Zustand with Immer for state management, defined in `canvas-store.ts`. The store manages:

### Key State Elements:

- **Nodes**: All shapes, lines, and text elements on the canvas
- **Connections**: Relationships between shapes and lines
- **Transform**: Pan and zoom state of the canvas
- **Selected Elements**: Currently selected items
- **Active Tool**: Currently active drawing tool
- **Style Settings**: Color, stroke, fill, and other visual properties
- **History**: Undo/redo stack

### Actions:

The store provides numerous actions for manipulating the canvas, including:

- Node creation, selection, and manipulation
- Line drawing and editing
- Style adjustments
- Selection and grouping operations
- History management (undo/redo)
- Alignment and distribution
- View controls (zoom, pan, etc.)

## Drawing Tools

The canvas provides a comprehensive set of drawing tools accessed through the Toolbar:

1. **Selection Tools**:
   - Hand tool (for panning)
   - Select tool (for selecting and moving elements)

2. **Shape Tools**:
   - Rectangle
   - Triangle
   - Diamond
   - Circle
   - Cylinder

3. **Line Tools**:
   - Arrow
   - Line
   - Pen (freeform drawing)

4. **Content Tools**:
   - Text
   - Icons
   - Examples (predefined diagrams)

## Interaction System

### Mouse Interactions:
- **Click**: Select elements, place shapes
- **Drag**: Move elements, draw lines, resize shapes
- **Double-click**: Add points to lines, edit text
- **Shift+click**: Multi-select elements

### Keyboard Shortcuts:
- **Delete/Backspace**: Delete selected elements
- **Ctrl/Cmd+Z**: Undo
- **Ctrl/Cmd+Shift+Z**: Redo
- **Ctrl/Cmd+D**: Duplicate selected elements
- **Ctrl/Cmd+G**: Group selected elements
- **Ctrl/Cmd+Shift+G**: Ungroup selected elements
- **Ctrl/Cmd+P or F5**: Toggle presentation mode
- **ESC**: Exit presentation mode

## Shapes and Lines

### Shapes:
Shapes are rendered as HTML/SVG elements with configurable properties:
- Position
- Dimensions
- Fill color
- Stroke color
- Border radius
- Stroke width and style

### Lines:
Lines connect shapes and can be:
- Straight lines
- Elbow lines (with orthogonal segments)
- Arrows (with customizable endpoints)
- Multi-segment paths
- Animated

## Connection System

The canvas uses a sophisticated connection system to link shapes with lines:

1. **Connection Points**:
   - Each shape has 8 connection points (N, S, E, W, NE, NW, SE, SW)
   - Connection points are displayed when drawing lines
   - Lines can be anchored to specific connection points

2. **Smart Connections**:
   - Lines maintain their connections when shapes are moved
   - The system recalculates line paths based on shape positions
   - Elbow routing automatically creates orthogonal paths between shapes

3. **Connection Data Model**:
   Each connection stores:
   - The line ID
   - The point index on the line
   - The shape ID it connects to
   - The connection point position on the shape
   - Whether the connection is dynamic (auto-updating)

## Key Features

### Alignment and Distribution
- Automatic alignment guides when moving shapes
- Explicit alignment tools (align left, center, right, top, middle, bottom)
- Distribution tools to evenly space elements

### Presentation Mode
- Clean view without UI controls
- Navigation shortcuts
- Focus on content presentation

### Styling Options
- Comprehensive color controls
- Fill and stroke customization
- Text formatting (size, alignment, weight)
- Line styling (dashed, dotted, solid)
- Line endpoints (arrows, circles, squares)

### History and Undo/Redo
- Multi-level undo/redo
- History tracking for all canvas operations

### Export and Sharing
- Copy canvas to clipboard as JSON
- Import and export canvas diagrams
- Example diagrams for quick starting points

## Examples

The canvas includes several example diagrams in the `examples/` directory:
- Basic diagrams
- Agent components
- Chat bot flows
- Agentic overviews
- Process flows

These examples can be loaded through the Examples tool in the toolbar, providing templates and inspiration for users creating their own diagrams. 