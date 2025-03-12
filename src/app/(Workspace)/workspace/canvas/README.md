## Canvas Tool Functionality

The Canvas Tool provides a powerful diagramming and drawing interface with the following key features:

### Shape Creation and Manipulation

1. **Adding Shapes to Canvas**
   - Select a shape tool (rectangle, circle, diamond, cylinder) from the toolbar
   - Click on the canvas to place the shape at that position
   - The shape is automatically created with default styling and dimensions

   ```typescript
   // Shape creation in Canvas.tsx
   const handleMouseDown = (e: React.MouseEvent) => {
     if (['rectangle', 'circle', 'diamond', 'cylinder'].includes(activeTool)) {
       const rect = canvasRef.current?.getBoundingClientRect();
       if (rect) {
         const x = (e.clientX - rect.left - transform.x) / transform.zoom;
         const y = (e.clientY - rect.top - transform.y) / transform.zoom;
         
         const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
         const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
         
         createShapeAtPosition(activeTool, snappedX, snappedY);
       }
     }
   }
   ```

2. **Shape Selection and Movement**
   - Click on a shape to select it (when using the select tool)
   - Selected shapes display resize handles and connection points
   - Drag selected shapes to move them around the canvas
   - When shapes are moved, any connected lines will automatically update to maintain their connections

### Line Drawing with Shape Anchoring

1. **Starting a Line from a Shape**
   - Select the line or arrow tool from the toolbar
   - When a shape is hovered with the line tool active, connection points appear around the shape
   - Click on a connection point to start drawing a line from that anchor point
   - The line's starting point is now anchored to that shape

   ```typescript
   // Connection point handling in Canvas.tsx
   const handleConnectionPointClick = (nodeId: string, position: ConnectionPointPosition) => {
     // Make sure we're using the line or arrow tool
     if (!['line', 'arrow'].includes(activeTool)) {
       return;
     }
     
     // Find the node to get its actual position
     const node = displayNodes?.find(n => n.id === nodeId);
     if (!node) return;
     
     // Calculate the exact connection point position using our utility
     const connectionPoint = calculateConnectionPointPosition(node, position);
     
     // Start a new line from this connection point
     startLineDraw(connectionPoint.x, connectionPoint.y, activeTool as 'line' | 'arrow');
     setIsDrawingLine(true);
     
     // Store the connection information for the start point
     const lineId = useCanvasStore.getState().lineInProgress?.id;
     if (lineId) {
       useCanvasStore.setState(state => {
         state.connections.push({
           lineId,
           pointIndex: 0, // First point of the line
           shapeId: nodeId,
           position
         });
         return state;
       });
     }
   }
   ```

2. **Drawing and Completing Lines**
   - After starting a line, move the cursor to draw the line
   - The line follows your cursor movement
   - To complete the line:
     - Click on another shape's connection point to anchor the end of the line
     - Click anywhere on the canvas to end the line without anchoring
     - Double-click to finish the line at the current position

   ```typescript
   // Finishing a line at a connection point
   if (lineInProgress) {
     // If we already have a line in progress, finish it at this connection point
     updateLineDraw(connectionPoint.x, connectionPoint.y, isShiftPressed);
     
     // Store the connection information before finishing the line
     const lineId = lineInProgress.id;
     const pointIndex = lineInProgress.points ? lineInProgress.points.length - 1 : 1;
     
     // Add the connection to the store
     useCanvasStore.setState(state => {
       state.connections.push({
         lineId,
         pointIndex,
         shapeId: nodeId,
         position
       });
       return state;
     });
     
     finishLineDraw();
   }
   ```

3. **Connected Line Behavior**
   - Lines anchored to shapes will maintain their connection when shapes are moved
   - The connection points (anchors) are calculated based on the shape's type and dimensions
   - When a shape is moved, all connected lines are automatically updated

   ```typescript
   // Updating connected lines when shapes move (in canvas-store.ts)
   updateNodePosition: (nodeId, x, y) => {
     set(state => {
       const node = state.nodes.find(n => n.id === nodeId);
       if (node) {
         // Update the node position
         node.position.x = newX;
         node.position.y = newY;
         
         // Update any connected lines
         if (state.connections) {
           state.connections.forEach(connection => {
             if (connection.shapeId === nodeId) {
               // Find the connected line
               const lineIndex = state.nodes.findIndex(n => n.id === connection.lineId);
               if (lineIndex !== -1) {
                 const line = state.nodes[lineIndex];
                 
                 // Calculate the new connection point position
                 const connectionPoint = calculateConnectionPointPosition(node, connection.position);
                 
                 // Update the line using our utility function
                 state.nodes[lineIndex] = updateConnectedLine(line, connection, connectionPoint);
               }
             }
           });
         }
       }
     });
   }
   ```

### Connection Points System

1. **Connection Point Positions**
   - Each shape has 8 connection points positioned around its perimeter:
     - 4 cardinal points (north, south, east, west)
     - 4 corner points (northwest, northeast, southwest, southeast)
   - The exact position of these points is calculated based on the shape's geometry

   ```typescript
   // Connection point positions in ConnectionPoints.tsx
   export type ConnectionPointPosition = 
     | 'n' | 's' | 'e' | 'w'  // Cardinal directions
     | 'nw' | 'ne' | 'sw' | 'se';
   ```

2. **Shape-Specific Connection Points**
   - Different shapes have connection points positioned appropriately:
     - Rectangles: Points along the edges and corners
     - Circles: Points distributed evenly around the circumference
     - Diamonds: Points at the vertices and midpoints of edges
   - Connection points are only visible when the line or arrow tool is active

### Technical Implementation

The canvas functionality is implemented using several key components:

1. **State Management**
   - Uses Zustand with Immer for immutable state updates
   - Tracks nodes (shapes), connections, and the current drawing state
   - Maintains a history stack for undo/redo operations

2. **Connection Tracking**
   - Connections are stored as references between line endpoints and shape anchor points
   - Each connection includes:
     - The line ID
     - The point index (0 for start, 1+ for end/intermediate points)
     - The shape ID
     - The connection position on the shape

3. **Rendering System**
   - Uses React components for shapes, lines, and UI elements
   - SVG for rendering lines and arrows
   - CSS for styling and positioning shapes

This implementation allows for a flexible and intuitive diagramming experience where shapes can be easily connected with lines that maintain their relationships even as elements are moved around the canvas.

