'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";

export const InstructionsComponent = () => {
  const { toast } = useToast();

  // Using raw string to avoid TypeScript trying to interpret the markdown content
  const markdownContent = `# Canvas Import JSON Format Guide

This document explains the structure of the JSON format used for importing diagrams into the Canvas application. The import JSON contains nodes (shapes, text, lines, etc.), connections between nodes, metadata, and version information.

## Top-Level Structure

\`\`\`json
{
  "nodes": [...],         // Array of node objects (required)
  "connections": [...],   // Array of connection objects (optional)
  "version": "1.0",       // Version string (optional)
  "exportDate": "..."     // ISO date string of when it was exported (optional)
}
\`\`\`

## Node Objects

Each node represents a visual element on the canvas. All nodes have some common properties, while specific node types have additional properties.

### Common Node Properties

| Property | Type | Description |
|----------|------|-------------|
| \`id\` | string | Unique identifier for the node |
| \`type\` | string | Type of node ("rectangle", "circle", "diamond", "cylinder", "triangle", "line", "text", "icon", etc.) |
| \`position\` | object | Position of the node on the canvas |
| \`position.x\` | number | X coordinate |
| \`position.y\` | number | Y coordinate |
| \`dimensions\` | object | Size of the node |
| \`dimensions.width\` | number | Width in pixels |
| \`dimensions.height\` | number | Height in pixels |
| \`style\` | object | Styling properties for the node |
| \`data\` | object | Additional type-specific data |
| \`selected\` | boolean | Whether the node is currently selected (usually \`false\` for imports) |

### Style Properties

Style properties can include a mix of hex color values and tailwind-style color names:

| Property | Type | Description |
|----------|------|-------------|
| \`backgroundColor\` | string | Background color (e.g., "#7dd3fc", "transparent", "blue-500") |
| \`borderColor\` | string | Border color (e.g., "#0284c7", "black-500") |
| \`borderWidth\` | number | Border width in pixels |
| \`borderStyle\` | string | Border style ("solid", "dashed", "dotted") |
| \`borderRadius\` | string | Border radius for rounded corners with units (e.g., "8px") |
| \`stroke\` | string | Stroke color (e.g., "black-800") |
| \`fill\` | string | Fill color (e.g., "white-300") |
| \`strokeWidth\` | number | Width of stroke in pixels |
| \`strokeStyle\` | string | Style of stroke ("solid", "dashed", "dotted") |
| \`textColor\` | string | Text color (e.g., "sky-800", "black") |
| \`fontSize\` | string | Font size with units (e.g., "16px") |
| \`fontFamily\` | string | Font family (e.g., "sans-serif") |
| \`textAlign\` | string | Text alignment ("left", "center", "right") |
| \`verticalAlign\` | string | Vertical alignment ("top", "middle", "bottom") |
| \`iconColor\` | string | Color for icon nodes |
| \`iconSize\` | string | Size for icon nodes (e.g., "24px") |

### Shape-Specific Properties

Different shape types may have specific style properties. For example:

#### Text Nodes

\`\`\`json
{
  "id": "text-1",
  "type": "text",
  "position": { "x": 100, "y": 100 },
  "dimensions": { "width": 175, "height": 41 },
  "style": {
    "backgroundColor": "#7dd3fc",
    "borderColor": "#0284c7",
    "borderWidth": 1,
    "borderStyle": "solid",
    "borderRadius": "8px",
    "textColor": "sky-800",
    "fontSize": "16px",
    "fontFamily": "sans-serif",
    "textAlign": "center",
    "verticalAlign": "middle",
    "stroke": "black-800",
    "fill": "white-300",
    "strokeWidth": 2,
    "strokeStyle": "solid"
  },
  "data": {
    "text": "This is a text node",
    "isNew": false,
    "isDarkTheme": false
  }
}
\`\`\`

#### Icon Nodes

\`\`\`json
{
  "id": "icon-1",
  "type": "icon",
  "position": { "x": 200, "y": 200 },
  "dimensions": { "width": 48, "height": 48 },
  "style": {
    "backgroundColor": "transparent",
    "borderColor": "transparent",
    "iconColor": "black-500",
    "iconSize": "24px"
  },
  "data": {
    "iconName": "User",
    "isIcon": true
  }
}
\`\`\`

#### Line Nodes

Line nodes can be straight lines or elbow connectors with markers at either end:

\`\`\`json
{
  "id": "line-1",
  "type": "line",
  "position": { "x": 50, "y": 300 },
  "dimensions": { "width": 150, "height": 2 },
  "style": {
    "borderColor": "black-500",
    "borderWidth": 2,
    "borderStyle": "solid"
  },
  "points": [
    { "x": 0, "y": 0 },
    { "x": 150, "y": 0 }
  ],
  "data": {
    "lineType": "straight",
    "startMarker": "none",
    "endMarker": "triangle",
    "markerFillStyle": "filled"
  }
}
\`\`\`

For elbow connectors, use \`"lineType": "elbow"\` and provide appropriate points.

## Connection Objects

Connections define how lines are attached to other nodes. This allows lines to stay connected to shapes even when the shapes are moved.

\`\`\`json
{
  "sourceNodeId": "line-1",
  "sourcePointIndex": 0,
  "targetNodeId": "rectangle-1", 
  "targetPosition": "e"
}
\`\`\`

| Property | Type | Description |
|----------|------|-------------|
| \`sourceNodeId\` | string | ID of the line node |
| \`sourcePointIndex\` | number | Index of the point on the line (0 for start, 1 for end) |
| \`targetNodeId\` | string | ID of the target node that the line is connected to |
| \`targetPosition\` | string | Position on the target node where the line connects |

Target positions can be cardinal directions ("n", "s", "e", "w").

## Color Format

Colors in the canvas can be specified in several formats:

1. Hex color codes: \`"#7dd3fc"\`, \`"#0284c7"\`, etc.
2. Base color with shade: \`"blue-500"\`, \`"red-300"\`, \`"sky-800"\`, etc.
3. Single colors: \`"black"\`, \`"white"\`
4. Special value: \`"none"\` or \`"transparent"\`

Your application supports a mix of these formats, with some properties typically using hex codes (like \`backgroundColor\` and \`borderColor\`) and others using the named colors with intensity (like \`textColor\`, \`stroke\`, and \`fill\`).

When using named colors with shades, the first part is the color name, and the second part (after the hyphen) is the shade intensity.

## Complete Example

Here's a simplified example of a complete import JSON with different types of nodes:

\`\`\`json
{
  "nodes": [
    {
      "id": "rectangle-1",
      "type": "rectangle",
      "position": { "x": 100, "y": 100 },
      "dimensions": { "width": 120, "height": 80 },
      "style": {
        "backgroundColor": "#dbeafe",
        "borderColor": "#3b82f6",
        "borderWidth": 2,
        "borderRadius": "8px",
        "stroke": "blue-500",
        "fill": "blue-100",
        "strokeWidth": 2,
        "strokeStyle": "solid"
      },
      "data": {
        "isNew": false,
        "isDarkTheme": false
      },
      "selected": false
    },
    {
      "id": "text-1",
      "type": "text",
      "position": { "x": 110, "y": 130 },
      "dimensions": { "width": 100, "height": 40 },
      "style": {
        "backgroundColor": "transparent",
        "borderColor": "transparent",
        "textColor": "black-800",
        "fontSize": "14px",
        "fontFamily": "sans-serif",
        "textAlign": "center",
        "verticalAlign": "middle",
        "stroke": "black-800",
        "fill": "white-300"
      },
      "data": {
        "text": "Hello World",
        "isNew": false,
        "isDarkTheme": false
      },
      "selected": false
    },
    {
      "id": "line-1",
      "type": "line",
      "position": { "x": 220, "y": 140 },
      "dimensions": { "width": 100, "height": 2 },
      "style": {
        "borderColor": "#1e293b",
        "borderWidth": 2,
        "borderStyle": "solid"
      },
      "points": [
        { "x": 0, "y": 0 },
        { "x": 100, "y": 0 }
      ],
      "data": {
        "lineType": "straight",
        "endMarker": "triangle",
        "markerFillStyle": "filled",
        "isNew": false,
        "isDarkTheme": false
      },
      "selected": false
    }
  ],
  "connections": [
    {
      "sourceNodeId": "line-1",
      "sourcePointIndex": 0,
      "targetNodeId": "rectangle-1",
      "targetPosition": "e"
    }
  ],
  "version": "1.0",
  "exportDate": "2025-03-17T12:00:00Z"
}
\`\`\`

## Tips for Creating Valid Imports

1. **All nodes must have unique IDs**: Duplicate IDs will cause issues with rendering and interactions.
2. **Required properties**: Ensure that all nodes have the minimum required properties (id, type, position).
3. **Consistent connections**: Any connection defined should reference valid node IDs.
4. **Appropriate dimension values**: Width and height should be appropriate for the node type.
5. **Coordinate system**: The top-left of the canvas is (0,0), with x increasing to the right and y increasing downward.
6. **Data properties**: Include \`"isNew": false\` and \`"isDarkTheme": false\` in the data object for each node.
7. **Style consistency**: Maintain the style structure shown in the examples, including the mix of hex colors and named colors.
8. **Use the export feature**: The easiest way to understand the format is to create a diagram and use the export feature to see the resulting JSON.
9. **Data validation**: Before importing, check that your JSON is well-formed and follows the structure outlined above.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Instructions have been copied to clipboard",
          duration: 2000,
        });
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: "Failed to copy instructions",
          variant: "destructive",
          duration: 2000,
        });
        console.error('Failed to copy content: ', err);
      });
  };

  const instructionsContent = (
    <div className="w-full">
      <DialogHeader className="">
        <DialogTitle>LLM Instructions</DialogTitle>
        <DialogDescription>Share these instructions with the LLM to get the best results.</DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <ScrollArea className="rounded-md border">
          <div className="prose prose-sm dark:prose-invert h-[500px] max-w-[475px] overflow-y-auto p-4">
            <ReactMarkdown>
              {markdownContent}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </div>
      <DialogFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCopy}
          className="flex gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Instructions
        </Button>
        <DialogClose asChild>
          <Button variant="default" size="sm">
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
          <BookOpen className="w-4 h-4" />
          <span className="sr-only">Instructions</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="">
        {instructionsContent}
      </DialogContent>
    </Dialog>
  );
}; 