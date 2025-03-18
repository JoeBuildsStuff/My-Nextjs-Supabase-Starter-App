import { Node, Connection } from '../store/canvas-store';
import { ConnectionPointPosition } from '../../components/ui/ConnectionPoints';
import { 
  calculateConnectionPointPosition, 
  findOptimalConnectionPoint, 
  calculateLineBoundingBox,
  deepClone
} from './connection-utils';

// ====================================================================
// TYPE DEFINITIONS
// ====================================================================

/**
 * Options for controlling how elbow routes are generated
 */
export interface ElbowRouteOptions {
  // When true, the connector will try to go horizontally first, then vertically
  // When false, it will go vertically first, then horizontally
  preferHorizontalFirst?: boolean;
  
  // The minimum length a segment should be (in pixels)
  // Helps avoid very small segments that look like glitches
  minSegmentLength?: number;
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Check if a node is an elbow line by looking at its data properties
 * 
 * @param node - Any node object that might be a line
 * @returns true if the node is an elbow line, false otherwise
 */
export function isElbowLine(node: Node): boolean {
  // Check if the node has a 'data' property, and if it does,
  // check if its 'lineType' property is set to 'elbow'
  return node.data?.lineType === 'elbow';
}

/**
 * Generate points for a single elbow connector between two points
 * 
 * This function creates a path with a single 90-degree bend (elbow)
 * to connect two points, taking into account their connection positions.
 * 
 * @param startPoint - The coordinates where the line begins
 * @param endPoint - The coordinates where the line ends
 * @param startPosition - Which side of an object the line connects to at the start (north, south, east, west)
 * @param endPosition - Which side of an object the line connects to at the end (north, south, east, west)
 * @param options - Additional configuration for the elbow route
 * @returns An array of points that define the path of the elbow connector
 */
export function generateElbowConnector(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  startPosition?: ConnectionPointPosition,
  endPosition?: ConnectionPointPosition,
  options?: ElbowRouteOptions
): Array<{ x: number; y: number }> {
  // Start with the simplest case - just the two endpoints in a straight line
  // We'll modify this array later if we need an elbow
  const points: Array<{ x: number; y: number }> = [
    { x: startPoint.x, y: startPoint.y },
    { x: endPoint.x, y: endPoint.y }
  ];
  
  // Calculate the direct distance between the two points using the Pythagorean theorem
  // dx is the horizontal distance, dy is the vertical distance
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If the points are very close to each other (less than 20 pixels),
  // just use a straight line instead of an elbow - it will look better
  if (distance < 20) {
    return points;
  }
  
  // Determine which direction to go first (horizontal or vertical)
  // This calls another function that considers various factors to decide
  const startHorizontal = determineOptimalElbowDirection(
    startPoint, 
    endPoint, 
    startPosition, 
    endPosition,
    options
  );
  
  // Clear the existing points array and rebuild with a single elbow
  points.length = 0;
  
  // First point is always the start point
  points.push({ x: startPoint.x, y: startPoint.y });
  
  // Now calculate where the elbow (the 90-degree bend) should be
  let elbowX: number; // X-coordinate of the elbow point
  let elbowY: number; // Y-coordinate of the elbow point
  
  if (startHorizontal) {
    // If we go horizontally first, then:
    // - The elbow's X coordinate will be the same as the end point
    // - The elbow's Y coordinate will be the same as the start point
    elbowX = endPoint.x;
    elbowY = startPoint.y;
  } else {
    // If we go vertically first, then:
    // - The elbow's X coordinate will be the same as the start point
    // - The elbow's Y coordinate will be the same as the end point
    elbowX = startPoint.x;
    elbowY = endPoint.y;
  }
  
  // Add the elbow point to our points array
  points.push({ x: elbowX, y: elbowY });
  
  // Add the end point to complete the path
  points.push({ x: endPoint.x, y: endPoint.y });
  
  // Return the final array of points that define our elbow connector
  return points;
}

/**
 * Determine the optimal direction for the elbow connector
 * 
 * This function decides whether the connector should go horizontally first,
 * then vertically, or vertically first, then horizontally.
 * 
 * @param startPoint - The coordinates where the line begins
 * @param endPoint - The coordinates where the line ends
 * @param startPosition - Which side of an object the line connects to at the start
 * @param endPosition - Which side of an object the line connects to at the end
 * @param options - Additional configuration for the elbow route
 * @returns true for horizontal-first, false for vertical-first
 */
export function determineOptimalElbowDirection(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  startPosition?: ConnectionPointPosition,
  endPosition?: ConnectionPointPosition,
  options?: ElbowRouteOptions
): boolean {
  // If options explicitly specify a preference, use that and ignore other factors
  if (options?.preferHorizontalFirst !== undefined) {
    return options.preferHorizontalFirst;
  }
  
  // Calculate the direct distances in each direction
  const dx = endPoint.x - startPoint.x; // Horizontal distance
  const dy = endPoint.y - startPoint.y; // Vertical distance
  
  // Default to horizontal first unless we determine otherwise
  let startHorizontal = true;
  
  // If we have a defined start position, use that to help determine direction
  if (startPosition) {
    // If starting from top (n) or bottom (s) of an object, it makes sense to go vertical first
    if (startPosition === 'n' || startPosition === 's') {
      startHorizontal = false;
    }
    // If starting from left (w) or right (e) of an object, it makes sense to go horizontal first
    else if (startPosition === 'e' || startPosition === 'w') {
      startHorizontal = true;
    }
    // For corners (like 'ne', 'sw', etc.), use the dominant axis (whichever is longer)
    else {
      startHorizontal = Math.abs(dx) > Math.abs(dy);
    }
  } 
  // If no start position but we have end position
  else if (endPosition) {
    // If ending at top or bottom, we should go horizontal first to arrive at the correct ending
    if (endPosition === 'n' || endPosition === 's') {
      startHorizontal = true;
    }
    // If ending at left or right, we should go vertical first to arrive at the correct ending
    else if (endPosition === 'e' || endPosition === 'w') {
      startHorizontal = false;
    }
    // For corners, use the dominant axis again
    else {
      startHorizontal = Math.abs(dx) > Math.abs(dy);
    }
  }
  // If no connection positions specified at all, just use the dominant axis
  // (go horizontally first if horizontal distance is greater, vertically otherwise)
  else {
    startHorizontal = Math.abs(dx) > Math.abs(dy);
  }
  
  // Return our decision
  return startHorizontal;
}

/**
 * Find the optimal connection points for an elbow connection between two shapes
 * 
 * This function determines the best sides of two shapes to connect with an elbow line,
 * based on their relative positions to each other.
 * 
 * @param startShape - The node representing the shape where the line starts
 * @param endShape - The node representing the shape where the line ends
 * @returns Object containing the best connection positions and their coordinates
 */
export function findOptimalElbowConnectionPoints(
  startShape: Node,
  endShape: Node
): {
  startPosition: ConnectionPointPosition;
  endPosition: ConnectionPointPosition;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
} {
  // Find the center point of the start shape
  // We do this by taking the shape's position (usually its top-left corner)
  // and adding half its width and height to get to the center
  const startCenter = {
    x: startShape.position.x + (startShape.dimensions?.width || 0) / 2,
    y: startShape.position.y + (startShape.dimensions?.height || 0) / 2
  };
  
  // Do the same to find the center point of the end shape
  const endCenter = {
    x: endShape.position.x + (endShape.dimensions?.width || 0) / 2,
    y: endShape.position.y + (endShape.dimensions?.height || 0) / 2
  };
  
  // Calculate the relative position of the end shape compared to the start shape
  const dx = endCenter.x - startCenter.x; // Positive means end is to the right of start
  const dy = endCenter.y - startCenter.y; // Positive means end is below start
  
  // Variables to store our decision about which sides to connect
  let startPosition: ConnectionPointPosition;
  let endPosition: ConnectionPointPosition;
  
  // First determine the dominant axis to decide which connection point to use for the first shape
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal relationship is stronger (shapes are more side-by-side than over/under)
    if (dx > 0) {
      // Start shape is to the left of end shape
      startPosition = 'e'; // Use east connection of start shape
    } else {
      // Start shape is to the right of end shape
      startPosition = 'w'; // Use west connection of start shape
    }
  } else {
    // Vertical relationship is stronger (shapes are more over/under than side-by-side)
    if (dy > 0) {
      // Start shape is above end shape
      startPosition = 's'; // Use south connection of start shape
    } else {
      // Start shape is below end shape
      startPosition = 'n'; // Use north connection of start shape
    }
  }
  
  // Now determine the appropriate connection point for the second shape
  // based on the connection point chosen for the first shape
  
  // If using south connection from first shape
  if (startPosition === 's') {
    if (dx > 0) {
      // Second shape is to the right of first shape
      endPosition = 'w'; // Use west connection of second shape
    } else {
      // Second shape is to the left of first shape
      endPosition = 'e'; // Use east connection of second shape
    }
  } 
  // If using north connection from first shape
  else if (startPosition === 'n') {
    if (dx > 0) {
      // Second shape is to the right of first shape
      endPosition = 'w'; // Use west connection of second shape
    } else {
      // Second shape is to the left of first shape
      endPosition = 'e'; // Use east connection of second shape
    }
  }
  // If using west connection from first shape
  else if (startPosition === 'w') {
    if (dy > 0) {
      // Second shape is below first shape
      endPosition = 'n'; // Use north connection of second shape
    } else {
      // Second shape is above first shape
      endPosition = 's'; // Use south connection of second shape
    }
  }
  // If using east connection from first shape
  else if (startPosition === 'e') {
    if (dy > 0) {
      // Second shape is below first shape
      endPosition = 'n'; // Use north connection of second shape
    } else {
      // Second shape is above first shape
      endPosition = 's'; // Use south connection of second shape
    }
  }
  // Default fallback for corner cases
  else {
    // If we're using a corner connection point on the first shape,
    // choose the opposite corner on the second shape
    if (dx > 0 && dy > 0) {
      // Second shape is to the right and below
      endPosition = 'nw';
    } else if (dx > 0 && dy <= 0) {
      // Second shape is to the right and above
      endPosition = 'sw';
    } else if (dx <= 0 && dy > 0) {
      // Second shape is to the left and below
      endPosition = 'ne';
    } else {
      // Second shape is to the left and above
      endPosition = 'se';
    }
  }

  // Validate and adjust the connection points to avoid passing through shapes
  [startPosition, endPosition] = validateConnectionPoints(
    startShape,
    endShape,
    startPosition,
    endPosition,
    startCenter,
    endCenter
  );
  
  // Calculate the actual pixel coordinates of these connection points
  // This uses another function that knows how to find the exact coordinate 
  // on the edge of a shape based on its position code (n, s, e, w, etc.)
  const startPoint = calculateConnectionPointPosition(startShape, startPosition, true);
  const endPoint = calculateConnectionPointPosition(endShape, endPosition, true);
  
  // Return all the information we've determined
  return {
    startPosition,
    endPosition,
    startPoint,
    endPoint
  };
}

/**
 * Validate that the chosen connection points won't create a path that intersects with either shape
 * 
 * @param startShape - The node representing the shape where the line starts
 * @param endShape - The node representing the shape where the line ends
 * @param startPosition - Initially chosen connection point for start shape
 * @param endPosition - Initially chosen connection point for end shape
 * @param startCenter - Center point of the start shape
 * @param endCenter - Center point of the end shape
 * @returns Adjusted connection positions to avoid shape intersections
 */
function validateConnectionPoints(
  startShape: Node,
  endShape: Node,
  startPosition: ConnectionPointPosition,
  endPosition: ConnectionPointPosition,
  startCenter: { x: number; y: number },
  endCenter: { x: number; y: number }
): [ConnectionPointPosition, ConnectionPointPosition] {

  // Get the bounds of both shapes
  const startBounds = {
    left: startShape.position.x,
    top: startShape.position.y,
    right: startShape.position.x + (startShape.dimensions?.width || 0),
    bottom: startShape.position.y + (startShape.dimensions?.height || 0)
  };
  
  const endBounds = {
    left: endShape.position.x,
    top: endShape.position.y,
    right: endShape.position.x + (endShape.dimensions?.width || 0),
    bottom: endShape.position.y + (endShape.dimensions?.height || 0)
  };
  
  // Calculate the relative position again for convenience
  const dx = endCenter.x - startCenter.x;
  const dy = endCenter.y - startCenter.y;
  
  // Check for potential intersections based on the connection positions
  
  // Case 1: East-North connection (horizontal then vertical)
  if (startPosition === 'e' && endPosition === 'n') {
    // Check if the elbow point would be inside the end shape
    // The elbow point would be at (endBounds.left, startCenter.y)
    if (startCenter.y > endBounds.top && startCenter.y < endBounds.bottom) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dy) > Math.abs(dx) / 2) {
        // If vertical distance is significant, go vertical first
        startPosition = dy < 0 ? 'n' : 's';
        endPosition = dx > 0 ? 'w' : 'e';
      } else {
        // Otherwise, try using the south connection of the end shape
        endPosition = 'w';
      }
    }
  }
  
  // Case 2: East-South connection (horizontal then vertical)
  else if (startPosition === 'e' && endPosition === 's') {
    // Check if the elbow point would be inside the end shape
    if (startCenter.y > endBounds.top && startCenter.y < endBounds.bottom) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dy) > Math.abs(dx) / 2) {
        // If vertical distance is significant, go vertical first
        startPosition = dy < 0 ? 'n' : 's';
        endPosition = dx > 0 ? 'w' : 'e';
      } else {
        // Otherwise, try using the north connection of the end shape
        endPosition = 'w';
      }
    }
  }
  
  // Case 3: West-North connection (horizontal then vertical)
  else if (startPosition === 'w' && endPosition === 'n') {
    // Check if the elbow point would be inside the end shape
    if (startCenter.y > endBounds.top && startCenter.y < endBounds.bottom) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dy) > Math.abs(dx) / 2) {
        // If vertical distance is significant, go vertical first
        startPosition = dy < 0 ? 'n' : 's';
        endPosition = dx > 0 ? 'w' : 'e';
      } else {
        // Otherwise, try using the south connection of the end shape
        endPosition = 'e';
      }
    }
  }
  
  // Case 4: West-South connection (horizontal then vertical)
  else if (startPosition === 'w' && endPosition === 's') {
    // Check if the elbow point would be inside the end shape
    if (startCenter.y > endBounds.top && startCenter.y < endBounds.bottom) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dy) > Math.abs(dx) / 2) {
        // If vertical distance is significant, go vertical first
        startPosition = dy < 0 ? 'n' : 's';
        endPosition = dx > 0 ? 'w' : 'e';
      } else {
        // Otherwise, try using the north connection of the end shape
        endPosition = 'e';
      }
    }
  }
  
  // Case 5: North-East connection (vertical then horizontal)
  else if (startPosition === 'n' && endPosition === 'e') {
    // Check if the elbow point would be inside the end shape
    if (startCenter.x > endBounds.left && startCenter.x < endBounds.right) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dx) > Math.abs(dy) / 2) {
        // If horizontal distance is significant, go horizontal first
        startPosition = dx < 0 ? 'w' : 'e';
        endPosition = dy > 0 ? 'n' : 's';
      } else {
        // Otherwise, try using the west connection of the end shape
        endPosition = 's';
      }
    }
  }
  
  // Case 6: North-West connection (vertical then horizontal)
else if (startPosition === 'n' && endPosition === 'w') {
    // Check if the elbow point would be inside the end shape
    if (startCenter.x > endBounds.left && startCenter.x < endBounds.right) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dx) > Math.abs(dy) / 2) {
        // If horizontal distance is significant, go horizontal first
        startPosition = dx < 0 ? 'w' : 'e';
        endPosition = dy > 0 ? 'n' : 's';
      } else {
        // Otherwise, try using the east connection of the end shape
        endPosition = 's';
      }
    }
  }
  
  // Case 7: South-East connection (vertical then horizontal)
  else if (startPosition === 's' && endPosition === 'e') {
    // Check if the elbow point would be inside the end shape
    if (startCenter.x > endBounds.left && startCenter.x < endBounds.right) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dx) > Math.abs(dy) / 2) {
        // If horizontal distance is significant, go horizontal first
        startPosition = dx < 0 ? 'w' : 'e';
        endPosition = dy > 0 ? 'n' : 's';
      } else {
        // Otherwise, try using the west connection of the end shape
        endPosition = 'n';
      }
    }
  }
  
  // Case 8: South-West connection (vertical then horizontal)
  else if (startPosition === 's' && endPosition === 'w') {
    // Check if the elbow point would be inside the end shape
    if (startCenter.x > endBounds.left && startCenter.x < endBounds.right) {
      // Potential intersection - adjust the connection strategy
      if (Math.abs(dx) > Math.abs(dy) / 2) {
        // If horizontal distance is significant, go horizontal first
        startPosition = dx < 0 ? 'w' : 'e';
        endPosition = dy > 0 ? 'n' : 's';
      } else {
        // Otherwise, try using the east connection of the end shape
        endPosition = 'n';
      }
    }
  }
  
  // Also check for the reverse case - if the elbow would intersect with the start shape
  // This is similar logic but with start and end swapped
  
  // For example, for North-East connection from start shape
  if (startPosition === 'n' && endPosition === 'e') {
    // Check if the elbow would intersect with the start shape
    // The elbow would be at (startCenter.x, endBounds.top)
    if (endBounds.top < startBounds.bottom && 
        endCenter.x > startBounds.left && endCenter.x < startBounds.right) {
      // Try a different approach - go horizontal first
      startPosition = dx > 0 ? 'e' : 'w';
      endPosition = dy < 0 ? 's' : 'n';
    }
  }
  
  // Similar checks for other connection combinations...
  
  return [startPosition, endPosition];
}

/**
 * Update a line to use single elbow routing
 * 
 * This is a complex function that updates an existing line to use elbow routing,
 * taking into account any connections to shapes at either end.
 * 
 * @param line - The line node to update
 * @param connections - Array of all connections in the diagram
 * @param nodes - Array of all nodes in the diagram
 * @returns Updated line node with elbow routing
 */
export function updateLineWithElbowRouting(
  line: Node,
  connections: Connection[],
  nodes: Node[]
): Node {
  // Create a copy of the line to avoid directly changing the original
  // (This is a common pattern in React/Redux to maintain immutability)
  const updatedLine = { ...line, points: [...(line.points || [])] };
  
  // If the line doesn't have enough points to form an elbow, return it unchanged
  if (!updatedLine.points || updatedLine.points.length < 2) {
    return updatedLine;
  }

  // The connections array is organized like this:
  // [
  //   {
  //       lineId: 'node-1742339908991-398',
  //       pointIndex: 0,
  //       shapeId: 'node-1742339903125-579',
  //       position: 'e',
  //       dynamic: true
  //     },
  //   {
  //       lineId: 'node-1742339908991-398',
  //       pointIndex: 1,
  //       shapeId: 'node-1742339905016-910',
  //       position: 'n',
  //       dynamic: true
  //     }
  //   ]
  //
  // Where each connection has a lineId.  The pointIndex of 0 represents the
  // start point of the line.  A pointIndex of 1 represents the end point of the line
  
  // Find the connection for the start point (index 0) of the line
  const startConnection = connections.find(
    conn => conn.lineId === line.id && conn.pointIndex === 0
  );
  
  // Find the connection for the end point of the line in the connections array.
  const endConnection = connections.find(
    conn => conn.lineId === line.id && conn.pointIndex === 1
  );

  // Calculate the absolute (on-canvas) positions of the start and end points
  // Line points are stored relative to the line's position, so we need to add that offset
  const startPoint = {
    x: updatedLine.position.x + updatedLine.points[0].x,
    y: updatedLine.position.y + updatedLine.points[0].y
  };
  
  const endPoint = {
    x: updatedLine.position.x + updatedLine.points[updatedLine.points.length - 1].x,
    y: updatedLine.position.y + updatedLine.points[updatedLine.points.length - 1].y
  };
  
  // Variables to store the connection positions at each end (if available)
  let startPosition: ConnectionPointPosition | undefined;
  let endPosition: ConnectionPointPosition | undefined;
  
  // If both endpoints are connected to shapes, we can find optimal connection points
  if (startConnection && endConnection) {
    // Find the shapes at each end of the connection
    const startShape = nodes.find(n => n.id === startConnection.shapeId);
    const endShape = nodes.find(n => n.id === endConnection.shapeId);
    
    if (startShape && endShape) {
      // We found both shapes, so find optimal connection points for an elbow connection
      const optimalPoints = findOptimalElbowConnectionPoints(startShape, endShape);
      
      // Update connection positions based on what we found
      startPosition = optimalPoints.startPosition;
      endPosition = optimalPoints.endPosition;
      
      // Update the actual points to use the optimal positions
      startPoint.x = optimalPoints.startPoint.x;
      startPoint.y = optimalPoints.startPoint.y;
      endPoint.x = optimalPoints.endPoint.x;
      endPoint.y = optimalPoints.endPoint.y;
      
      // IMPORTANT: We're not directly modifying the connection objects in the store
      // We're just updating our local variables, and the store will handle updates
    } else {
      // One or both shapes not found, use existing connection positions
      if (startConnection) {
        // Use the position from the start connection
        startPosition = startConnection.position;
        
        // If the connection is dynamic (can move) and we have the shape, update the point
        if (startConnection.dynamic && startShape) {
          const point = calculateConnectionPointPosition(startShape, startConnection.position, true);
          startPoint.x = point.x;
          startPoint.y = point.y;
        }
      }
      
      if (endConnection) {
        // Use the position from the end connection
        endPosition = endConnection.position;
        
        // If the connection is dynamic and we have the shape, update the point
        if (endConnection.dynamic && endShape) {
          const point = calculateConnectionPointPosition(endShape, endConnection.position, true);
          endPoint.x = point.x;
          endPoint.y = point.y;
        }
      }
    }
  } else {
    // Handle cases where only one endpoint is connected (or none are)
    
    // If start is connected to a shape
    if (startConnection) {
      const startShape = nodes.find(n => n.id === startConnection.shapeId);
      
      if (startShape) {
        if (startConnection.dynamic) {
          // For a dynamic connection, find the best connection point based on where
          // the end point is located
          const optimalConnection = findOptimalConnectionPoint(startShape, endPoint, true);
          startPosition = optimalConnection.position;
          startPoint.x = optimalConnection.point.x;
          startPoint.y = optimalConnection.point.y;
        } else {
          // For a fixed connection, use the specified position
          startPosition = startConnection.position;
          const point = calculateConnectionPointPosition(startShape, startConnection.position, true);
          startPoint.x = point.x;
          startPoint.y = point.y;
        }
      }
    }
    
    // If end is connected to a shape
    if (endConnection) {
      const endShape = nodes.find(n => n.id === endConnection.shapeId);
      
      if (endShape) {
        if (endConnection.dynamic) {
          // For a dynamic connection, find the best connection point based on where
          // the start point is located
          const optimalConnection = findOptimalConnectionPoint(endShape, startPoint, true);
          endPosition = optimalConnection.position;
          endPoint.x = optimalConnection.point.x;
          endPoint.y = optimalConnection.point.y;
        } else {
          // For a fixed connection, use the specified position
          endPosition = endConnection.position;
          const point = calculateConnectionPointPosition(endShape, endConnection.position, true);
          endPoint.x = point.x;
          endPoint.y = point.y;
        }
      }
    }
  }
  
  // Generate the elbow points between the start and end points
  const elbowPoints = generateElbowConnector(
    startPoint,
    endPoint,
    startPosition,
    endPosition
  );
  
  // Convert the absolute points back to positions relative to the line's position
  // (This is how points are stored in the line object)
  updatedLine.points = elbowPoints.map(point => ({
    x: point.x - updatedLine.position.x,
    y: point.y - updatedLine.position.y
  }));
  
  // Recalculate the bounding box of the line
  // This is important for selecting, moving, and other operations
  const boundingBox = calculateLineBoundingBox(updatedLine.points);
  
  // Update the line's dimensions based on the bounding box
  updatedLine.dimensions = boundingBox.dimensions;
  
  // Apply position adjustments if needed (to keep the line within its bounding box)
  if (boundingBox.positionAdjustment) {
    // Update the line's position
    updatedLine.position = {
      x: updatedLine.position.x + boundingBox.positionAdjustment.x,
      y: updatedLine.position.y + boundingBox.positionAdjustment.y
    };
    
    // Adjust all points to maintain their visual positions after the line position changes
    for (let i = 0; i < updatedLine.points.length; i++) {
      updatedLine.points[i] = {
        x: updatedLine.points[i].x + boundingBox.pointAdjustments.x,
        y: updatedLine.points[i].y + boundingBox.pointAdjustments.y
      };
    }
  }
  
  // Return the updated line
  return updatedLine;
}

/**
 * Generate simple elbow points between two points
 * 
 * This is a simpler version of generateElbowConnector that always creates
 * a single elbow point without considering connection positions.
 * 
 * @param startPoint - The coordinates where the line begins
 * @param endPoint - The coordinates where the line ends
 * @returns Array of 3 points forming the elbow connector
 */
export function generateElbowPoints(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number }
): Array<{ x: number; y: number }> {
  // Calculate the distances in each direction
  const dx = endPoint.x - startPoint.x; // Horizontal distance
  const dy = endPoint.y - startPoint.y; // Vertical distance
  
  // Variables to store the elbow point coordinates
  let elbowX: number;
  let elbowY: number;
  
  // Determine which axis to bend on based on which direction has the greater distance
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal distance is greater, so we'll go horizontally first, then vertically
    // The elbow point will have the same x-coordinate as the end point
    // and the same y-coordinate as the start point
    elbowX = endPoint.x;
    elbowY = startPoint.y;
  } else {
    // Vertical distance is greater, so we'll go vertically first, then horizontally
    // The elbow point will have the same x-coordinate as the start point
    // and the same y-coordinate as the end point
    elbowX = startPoint.x;
    elbowY = endPoint.y;
  }
  
  // Return a 3-point path: start point -> elbow point -> end point
  return [
    { x: startPoint.x, y: startPoint.y }, // Start point
    { x: elbowX, y: elbowY },             // Elbow point (the 90-degree bend)
    { x: endPoint.x, y: endPoint.y }      // End point
  ];
}

/**
 * Handle dragging of elbow line endpoints
 * 
 * When a user drags an endpoint of an elbow line, this function updates
 * the middle point to maintain the L-shape of the connector.
 * 
 * @param node - The line node being modified
 * @param pointIndex - The index of the point being dragged (0 for start, 2 for end)
 * @param newPoint - The new position the user has dragged the point to
 * @returns Updated array of points for the line
 */
export function handleElbowEndpointDrag(
  node: Node,
  pointIndex: number,
  newPoint: { x: number; y: number }
): Array<{ x: number; y: number }> {
  // Check if this is actually an elbow line with 3 points
  // If not, return the existing points unchanged
  if (!node.points || node.points.length !== 3) {
    return node.points || [];
  }
  
  // Create a copy of the points array to avoid modifying the original
  const updatedPoints = [...node.points];
  
  // Update the position of the dragged point
  updatedPoints[pointIndex] = { ...newPoint };
  
  // Adjust the middle point to maintain the L-shape of the elbow connector
  return adjustElbowMiddlePoint(updatedPoints, pointIndex);
}

/**
 * Adjust the middle point of an elbow line to maintain the L-shape
 * 
 * This ensures that after dragging an endpoint, the line still forms a
 * proper 90-degree angle (an "L" shape).
 * 
 * @param points - The current points array (should have 3 points)
 * @param draggedPointIndex - Which point was dragged (0 for start, 2 for end)
 * @returns Updated points array with adjusted middle point
 */
export function adjustElbowMiddlePoint(
  points: Array<{ x: number; y: number }>,
  draggedPointIndex: number
): Array<{ x: number; y: number }> {
  // Check if this is actually an elbow line with 3 points
  // If not, return the existing points unchanged
  if (points.length !== 3) {
    return points;
  }
  
  // Create a copy of the points array to avoid modifying the original
  const updatedPoints = [...points];
  
  if (draggedPointIndex === 0) {
    // If user dragged the start point (index 0):
    // We need to adjust the middle point to maintain the L-shape
    // The middle point should:
    // - Keep the same X-coordinate as the end point
    // - Keep the same Y-coordinate as the (new) start point
    updatedPoints[1] = {
      x: updatedPoints[2].x, // Align X with end point
      y: updatedPoints[0].y  // Align Y with start point
    };
  } else if (draggedPointIndex === 2) {
    // If user dragged the end point (index 2):
    // We need to adjust the middle point to maintain the L-shape
    // The middle point should:
    // - Keep the same X-coordinate as the start point
    // - Keep the same Y-coordinate as the (new) end point
    updatedPoints[1] = {
      x: updatedPoints[0].x, // Align X with start point
      y: updatedPoints[2].y  // Align Y with end point
    };
  }
  
  // Return the updated points array
  return updatedPoints;
}

/**
 * Convert a straight line to an elbow line
 * 
 * This transforms a straight line connector into an elbow connector
 * with a 90-degree bend.
 * 
 * @param line - The straight line node to convert
 * @returns Updated line node converted to an elbow line
 */
export function convertStraightToElbow(line: Node): Node {
  // Create a deep copy of the line to avoid modifying the original
  // Deep clone includes all nested objects and arrays
  const updatedLine = deepClone(line);
  
  // Set the line type to 'elbow' in the node's data
  if (!updatedLine.data) {
    updatedLine.data = {}; // Create the data object if it doesn't exist
  }
  updatedLine.data.lineType = 'elbow';
  
  // If we have at least 2 points (start and end), convert to an elbow
  if (updatedLine.points && updatedLine.points.length >= 2) {
    // Get the start and end points (ignore any other points if they exist)
    const startPoint = updatedLine.points[0];
    const endPoint = updatedLine.points[updatedLine.points.length - 1];
    
    // Generate new points for an elbow connector
    const elbowPoints = generateElbowPoints(startPoint, endPoint);
    
    // Update the line's points with the new elbow points
    updatedLine.points = elbowPoints;
  }
  
  // Return the updated line
  return updatedLine;
}

/**
 * Convert an elbow line to a straight line
 * 
 * This transforms an elbow connector back into a simple straight line
 * connecting the endpoints directly.
 * 
 * @param line - The elbow line node to convert
 * @returns Updated line node converted to a straight line
 */
export function convertElbowToStraight(line: Node): Node {
  // Create a deep copy of the line to avoid modifying the original
  const updatedLine = deepClone(line);
  
  // Set the line type to 'straight' in the node's data
  if (!updatedLine.data) {
    updatedLine.data = {}; // Create the data object if it doesn't exist
  }
  updatedLine.data.lineType = 'straight';
  
  // If we have at least 2 points, convert to a straight line
  if (updatedLine.points && updatedLine.points.length >= 2) {
    // Keep only the start and end points, discard any middle points
    const startPoint = updatedLine.points[0];
    const endPoint = updatedLine.points[updatedLine.points.length - 1];
    
    // Update the line's points to form a straight line
    updatedLine.points = [startPoint, endPoint];
  }
  
  // Return the updated line
  return updatedLine;
}

/**
 * Generate SVG path data for an elbow connector with rounded corners
 * 
 * @param points - Array of points defining the elbow connector
 * @param cornerRadius - Radius for the rounded corners in pixels (default: 8)
 * @returns SVG path data string for drawing the rounded elbow connector
 */
export function generateRoundedElbowPathData(
  points: Array<{ x: number; y: number }>,
  cornerRadius: number = 8
): string {
  // If we don't have enough points for an elbow, return a straight line
  if (!points || points.length < 3) {
    if (points && points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }
    return '';
  }

  // Start building the SVG path
  let pathData = `M ${points[0].x},${points[0].y}`;
  
  // For each middle point, create a rounded corner
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    
    // Calculate direction vectors
    const dx1 = current.x - prev.x;
    const dy1 = current.y - prev.y;
    const dx2 = next.x - current.x;
    const dy2 = next.y - current.y;
    
    // Calculate distances
    const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    
    // Ensure the corner radius doesn't exceed half of the shortest segment
    const maxRadius = Math.min(dist1, dist2) / 2;
    const radius = Math.min(cornerRadius, maxRadius);
    
    // Calculate the start and end points of the arc
    const arcStart = {
      x: current.x - (radius * dx1) / dist1,
      y: current.y - (radius * dy1) / dist1
    };
    
    const arcEnd = {
      x: current.x + (radius * dx2) / dist2,
      y: current.y + (radius * dy2) / dist2
    };
    
    // Add line to the start of the arc
    pathData += ` L ${arcStart.x},${arcStart.y}`;
    
    // Add the arc
    // The large-arc-flag and sweep-flag are set to 0 for a small arc
    pathData += ` Q ${current.x},${current.y} ${arcEnd.x},${arcEnd.y}`;
  }
  
  // Add line to the final point
  pathData += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;
  
  return pathData;
}

/**
 * Generate SVG path element for a rounded elbow connector
 * 
 * This function creates a complete SVG path element string that can be used
 * directly in an SVG component.
 * 
 * @param points - Array of points defining the elbow connector
 * @param cornerRadius - Radius for the rounded corners in pixels (default: 8)
 * @param strokeColor - Color of the line (default: "black")
 * @param strokeWidth - Width of the line in pixels (default: 2)
 * @returns SVG path element string
 */
export function createRoundedElbowPath(
  points: Array<{ x: number; y: number }>,
  cornerRadius: number = 8,
  strokeColor: string = "black",
  strokeWidth: number = 2
): string {
  const pathData = generateRoundedElbowPathData(points, cornerRadius);
  
  return `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
}