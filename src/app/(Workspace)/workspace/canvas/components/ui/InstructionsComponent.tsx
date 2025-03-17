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

Style properties can include:

| Property | Type | Description |
|----------|------|-------------|
| \`backgroundColor\` | string | Background color (e.g., "transparent", "blue-500") |
| \`borderColor\` | string | Border color (e.g., "black-500", "blue-500") |
| \`borderWidth\` | number | Border width in pixels |
| \`borderStyle\` | string | Border style ("solid", "dashed", "dotted") |
| \`borderRadius\` | string or number | Border radius for rounded corners (e.g., "8px" or 8) |
| \`color\` | string | Text color for text nodes |
| \`textColor\` | string | Another way to specify text color |
| \`fontSize\` | string | Font size with units (e.g., "14px") |
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
    "backgroundColor": "transparent",
    "borderColor": "transparent",
    "textColor": "black-500",
    "fontSize": "14px",
    "textAlign": "left"
  },
  "data": {
    "text": "This is a text node"
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

Target positions can be cardinal directions ("n", "s", "e", "w") or corners ("nw", "ne", "sw", "se").

## Color Format

Colors in the canvas can be specified in several formats:

1. Base color with shade: \`"blue-500"\`, \`"red-300"\`, etc.
2. Single colors: \`"black"\`, \`"white"\`
3. Special value: \`"none"\` or \`"transparent"\`

When using shades, the first part is the color name, and the second part (after the hyphen) is the shade intensity.

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
        "backgroundColor": "blue-100",
        "borderColor": "blue-500",
        "borderWidth": 2,
        "borderRadius": "8"
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
        "textAlign": "center"
      },
      "data": {
        "text": "Hello World"
      },
      "selected": false
    },
    {
      "id": "line-1",
      "type": "line",
      "position": { "x": 220, "y": 140 },
      "dimensions": { "width": 100, "height": 2 },
      "style": {
        "borderColor": "black-500",
        "borderWidth": 2
      },
      "points": [
        { "x": 0, "y": 0 },
        { "x": 100, "y": 0 }
      ],
      "data": {
        "lineType": "straight",
        "endMarker": "triangle"
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
6. **Use the export feature**: The easiest way to understand the format is to create a diagram and use the export feature to see the resulting JSON.
7. **Data validation**: Before importing, check that your JSON is well-formed and follows the structure outlined above.`;

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