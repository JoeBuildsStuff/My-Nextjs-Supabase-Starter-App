import { Node, Connection } from '../store/canvas-store';
import { ConnectionPointPosition } from '../../components/ui/ConnectionPoints';

// Define a constant for the snapping threshold
export const CONNECTION_SNAP_THRESHOLD = 25; // Increased from 15 to 25 for better snapping

// Define a constant for connection point offset
// Positive values move the line endpoint away from the shape
// Negative values move the line endpoint into the shape
// Zero means the line endpoint will be exactly at the connection point
export const CONNECTION_POINT_OFFSET: number = 12; // Default: 12 pixels offset

// Define trigonometric constants at module level to avoid recalculation
const COS_45_DEG = 0.7071; // cos(45°)
const SIN_45_DEG = 0.7071; // sin(45°)

/**
 * Calculate the absolute position of a connection point on a shape
 * @param node The shape node to calculate connection point for
 * @param position The position of the connection point
 * @param isConnected Optional flag to indicate if this is for a connected line endpoint
 */
export function calculateConnectionPointPosition(
  node: Node,
  position: ConnectionPointPosition,
  isConnected: boolean = false
): { x: number, y: number } {
  if (!node.dimensions) {
    return { x: node.position.x, y: node.position.y };
  }

  const { x, y } = node.position;
  const { width, height } = node.dimensions;
  let connectionX = x;
  let connectionY = y;
  
  // Direction vectors for applying offset
  let directionX = 0;
  let directionY = 0;

  if (node.type === 'circle') {
    const radius = Math.min(width, height) / 2;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    switch (position) {
      case 'n':
        connectionX = centerX;
        connectionY = centerY - radius;
        directionX = 0;
        directionY = -1;
        break;
      case 's':
        connectionX = centerX;
        connectionY = centerY + radius;
        directionX = 0;
        directionY = 1;
        break;
      case 'w':
        connectionX = centerX - radius;
        connectionY = centerY;
        directionX = -1;
        directionY = 0;
        break;
      case 'e':
        connectionX = centerX + radius;
        connectionY = centerY;
        directionX = 1;
        directionY = 0;
        break;
      case 'nw':
        connectionX = centerX - radius * COS_45_DEG;
        connectionY = centerY - radius * COS_45_DEG;
        directionX = -COS_45_DEG;
        directionY = -COS_45_DEG;
        break;
      case 'ne':
        connectionX = centerX + radius * COS_45_DEG;
        connectionY = centerY - radius * COS_45_DEG;
        directionX = COS_45_DEG;
        directionY = -COS_45_DEG;
        break;
      case 'sw':
        connectionX = centerX - radius * COS_45_DEG;
        connectionY = centerY + radius * COS_45_DEG;
        directionX = -COS_45_DEG;
        directionY = COS_45_DEG;
        break;
      case 'se':
        connectionX = centerX + radius * COS_45_DEG;
        connectionY = centerY + radius * COS_45_DEG;
        directionX = COS_45_DEG;
        directionY = COS_45_DEG;
        break;
    }
  } else if (node.type === 'diamond') {
    // Diamond-specific connection point calculations
    // For a diamond, we use rectangle positions and apply rotation
    // This matches how the connection points are visually positioned
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // First, get the position on the rectangle
    let rectX = 0;
    let rectY = 0;
    
    switch (position) {
      case 'n':
        rectX = centerX;
        rectY = y;
        directionX = 0;
        directionY = -1;
        break;
      case 's':
        rectX = centerX;
        rectY = y + height;
        directionX = 0;
        directionY = 1;
        break;
      case 'w':
        rectX = x;
        rectY = centerY;
        directionX = -1;
        directionY = 0;
        break;
      case 'e':
        rectX = x + width;
        rectY = centerY;
        directionX = 1;
        directionY = 0;
        break;
      case 'nw':
        rectX = x;
        rectY = y;
        directionX = -1;
        directionY = -1;
        break;
      case 'ne':
        rectX = x + width;
        rectY = y;
        directionX = 1;
        directionY = -1;
        break;
      case 'sw':
        rectX = x;
        rectY = y + height;
        directionX = -1;
        directionY = 1;
        break;
      case 'se':
        rectX = x + width;
        rectY = y + height;
        directionX = 1;
        directionY = 1;
        break;
    }
    
    // Then, apply the 45-degree rotation around the center
    // Rotation formula:
    // x' = centerX + (x - centerX) * cos(angle) - (y - centerY) * sin(angle)
    // y' = centerY + (x - centerX) * sin(angle) + (y - centerY) * cos(angle)
    // Using the constants defined at module level
    
    connectionX = centerX + (rectX - centerX) * COS_45_DEG - (rectY - centerY) * SIN_45_DEG;
    connectionY = centerY + (rectX - centerX) * SIN_45_DEG + (rectY - centerY) * COS_45_DEG;
    
    // Rotate the direction vector as well
    const rotatedDirX = directionX * COS_45_DEG - directionY * SIN_45_DEG;
    const rotatedDirY = directionX * SIN_45_DEG + directionY * COS_45_DEG;
    directionX = rotatedDirX;
    directionY = rotatedDirY;
  } else if (node.type === 'triangle') {
    // Triangle-specific connection point calculations
    const centerX = x + width / 2;
    
    switch (position) {
      case 'n':
        connectionX = centerX;
        connectionY = y;
        directionX = 0;
        directionY = -1;
        break;
      case 's':
        connectionX = centerX;
        connectionY = y + height;
        directionX = 0;
        directionY = 1;
        break;
      case 'w':
        connectionX = x + width / 4;
        connectionY = y + height / 2;
        directionX = -1;
        directionY = 0;
        break;
      case 'e':
        connectionX = x + width * 3 / 4;
        connectionY = y + height / 2;
        directionX = 1;
        directionY = 0;
        break;
      case 'sw':
        connectionX = x;
        connectionY = y + height;
        directionX = -1;
        directionY = 1;
        break;
      case 'se':
        connectionX = x + width;
        connectionY = y + height;
        directionX = 1;
        directionY = 1;
        break;
      // nw and ne are not used for triangles
      case 'nw':
      case 'ne':
        connectionX = centerX;
        connectionY = y;
        directionX = 0;
        directionY = -1;
        break;
    }
  } else {
    // Default rectangle/text/other shapes
    switch (position) {
      case 'n':
        connectionX = x + width / 2;
        connectionY = y;
        directionX = 0;
        directionY = -1;
        break;
      case 's':
        connectionX = x + width / 2;
        connectionY = y + height;
        directionX = 0;
        directionY = 1;
        break;
      case 'w':
        connectionX = x;
        connectionY = y + height / 2;
        directionX = -1;
        directionY = 0;
        break;
      case 'e':
        connectionX = x + width;
        connectionY = y + height / 2;
        directionX = 1;
        directionY = 0;
        break;
      case 'nw':
        connectionX = x;
        connectionY = y;
        directionX = -1;
        directionY = -1;
        break;
      case 'ne':
        connectionX = x + width;
        connectionY = y;
        directionX = 1;
        directionY = -1;
        break;
      case 'sw':
        connectionX = x;
        connectionY = y + height;
        directionX = -1;
        directionY = 1;
        break;
      case 'se':
        connectionX = x + width;
        connectionY = y + height;
        directionX = 1;
        directionY = 1;
        break;
    }
  }

  // Normalize direction vector for diagonal positions
  if (directionX !== 0 && directionY !== 0) {
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    directionX /= length;
    directionY /= length;
  }

  // Apply the offset only if this is for a connected line endpoint
  if (isConnected && CONNECTION_POINT_OFFSET !== 0) {
    connectionX += directionX * CONNECTION_POINT_OFFSET;
    connectionY += directionY * CONNECTION_POINT_OFFSET;
  }

  return { x: connectionX, y: connectionY };
}

/**
 * Find the optimal connection point on a shape that minimizes the distance to a target point
 * @param shape The shape node to find the optimal connection point on
 * @param targetPoint The target point to minimize distance to
 * @param isConnected Whether this is for a connected line endpoint
 * @returns The optimal connection position and its absolute coordinates
 */
export function findOptimalConnectionPoint(
  shape: Node,
  targetPoint: { x: number, y: number },
  isConnected: boolean = false
): { position: ConnectionPointPosition, point: { x: number, y: number } } {
  // All possible connection positions
  const connectionPositions: ConnectionPointPosition[] = [
    'n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'
  ];
  
  let minDistance = Number.MAX_VALUE;
  let optimalPosition: ConnectionPointPosition = 'n'; // Default
  let optimalPoint = { x: 0, y: 0 };
  
  // Check each connection point position
  for (const position of connectionPositions) {
    const connectionPoint = calculateConnectionPointPosition(shape, position, isConnected);
    
    // Calculate distance to target point
    const dx = connectionPoint.x - targetPoint.x;
    const dy = connectionPoint.y - targetPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update if this is the closest point so far
    if (distance < minDistance) {
      minDistance = distance;
      optimalPosition = position;
      optimalPoint = connectionPoint;
    }
  }
  
  return { position: optimalPosition, point: optimalPoint };
}

/**
 * Find the nearest connection point on any node to a given position
 * Returns the node, connection point position, and the absolute position if within threshold
 */
export interface NearestConnectionPoint {
  node: Node;
  position: ConnectionPointPosition;
  absolutePosition: { x: number, y: number };
  distance: number;
}

export function findNearestConnectionPoint(
  nodes: Node[],
  x: number,
  y: number,
  excludeNodeId?: string,
  threshold: number = CONNECTION_SNAP_THRESHOLD
): NearestConnectionPoint | null {
  // Skip line nodes and the excluded node
  const eligibleNodes = nodes.filter(node => 
    node.id !== excludeNodeId && 
    node.type !== 'line' && 
    node.type !== 'arrow' &&
    !node.data?.isGroup // Skip group nodes
  );
  
  if (eligibleNodes.length === 0) return null;
  
  // All possible connection positions
  const connectionPositions: ConnectionPointPosition[] = [
    'n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'
  ];
  
  let nearestPoint: NearestConnectionPoint | null = null;
  let minDistance = threshold; // Only consider points within threshold
  
  // Check each node and each connection point
  for (const node of eligibleNodes) {
    for (const position of connectionPositions) {
      // Don't apply offset when finding nearest connection point
      const pointPos = calculateConnectionPointPosition(node, position, false);
      const dx = pointPos.x - x;
      const dy = pointPos.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If this point is closer than the current nearest, update
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = {
          node,
          position,
          absolutePosition: pointPos,
          distance
        };
      }
    }
  }
  
  return nearestPoint;
}

// Line bounding box padding constant
export const LINE_BOUNDING_BOX_PADDING = 10;

/**
 * Calculate the bounding box for a line with points
 * Returns the padded bounding box dimensions and any position adjustments needed
 */
export interface LineBoundingBoxResult {
  // New dimensions for the line
  dimensions: { width: number; height: number };
  // Position adjustment needed (if any)
  positionAdjustment: { x: number; y: number } | null;
  // Point adjustments needed (if positionAdjustment is not null)
  pointAdjustments: { x: number; y: number };
}

export function calculateLineBoundingBox(points: Array<{ x: number; y: number }>): LineBoundingBoxResult {
  // Find the min/max coordinates from all points
  const allX = points.map(p => p.x);
  const allY = points.map(p => p.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  
  // Add padding to the bounding box
  const paddedMinX = minX - LINE_BOUNDING_BOX_PADDING;
  const paddedMaxX = maxX + LINE_BOUNDING_BOX_PADDING;
  const paddedMinY = minY - LINE_BOUNDING_BOX_PADDING;
  const paddedMaxY = maxY + LINE_BOUNDING_BOX_PADDING;
  
  // Calculate dimensions with padding
  const width = Math.max(paddedMaxX - paddedMinX, 1);
  const height = Math.max(paddedMaxY - paddedMinY, 1);
  
  // Check if we need to adjust the position
  if (paddedMinX < 0 || paddedMinY < 0) {
    // Need to adjust position and all points
    return {
      dimensions: { width, height },
      positionAdjustment: { x: paddedMinX, y: paddedMinY },
      pointAdjustments: { x: -paddedMinX, y: -paddedMinY }
    };
  } else {
    // No position adjustment needed
    return {
      dimensions: { 
        width: Math.max(paddedMaxX, 1), 
        height: Math.max(paddedMaxY, 1) 
      },
      positionAdjustment: null,
      pointAdjustments: { x: 0, y: 0 }
    };
  }
}

/**
 * Update a line's points and dimensions based on connected shapes
 */
export function updateConnectedLine(
  line: Node,
  connection: Connection,
  connectionPoint: { x: number, y: number },
  nodes?: Node[] // Optional array of all nodes to find the other endpoint's connection
): Node {
  if (!line.points || line.points.length <= connection.pointIndex) {
    return line;
  }

  // Create a copy of the line to avoid direct mutation
  const updatedLine = { ...line, points: [...line.points] };
  
  // Create a copy of the connection to avoid modifying the original
  const connectionCopy = { ...connection };
  
  // If we have nodes and this is a dynamic connection, find the optimal connection point
  if (nodes && connectionCopy.dynamic) {
    // Find the other endpoint index
    // We need to find the opposite endpoint from the current connection point
    let otherEndpointIndex: number | null = null;
    
    // If this is the first point (index 0), the other endpoint is the last point
    if (connectionCopy.pointIndex === 0) {
      otherEndpointIndex = line.points.length - 1;
    } 
    // If this is the last point, the other endpoint is the first point
    else if (connectionCopy.pointIndex === line.points.length - 1) {
      otherEndpointIndex = 0;
    }
    
    // Only proceed if we have a valid other endpoint
    if (otherEndpointIndex !== null) {
      // Get the absolute position of the other endpoint
      const otherEndpoint = {
        x: line.position.x + line.points[otherEndpointIndex].x,
        y: line.position.y + line.points[otherEndpointIndex].y
      };
      
      // Find the shape node this connection is attached to
      const shapeNode = nodes.find(n => n.id === connectionCopy.shapeId);
      
      if (shapeNode) {
        // Find the optimal connection point based on the other endpoint's position
        const optimalConnection = findOptimalConnectionPoint(shapeNode, otherEndpoint, true);
        
        // Update the connection position
        connectionCopy.position = optimalConnection.position;
        
        // Use the optimal connection point with offset
        connectionPoint = optimalConnection.point;
      }
    }
  }
  
  // Calculate the relative position for the line point
  const relativeX = connectionPoint.x - line.position.x;
  const relativeY = connectionPoint.y - line.position.y;
  
  // Update the line point
  updatedLine.points[connectionCopy.pointIndex] = { x: relativeX, y: relativeY };
  
  // Use the utility function to calculate the bounding box
  const boundingBox = calculateLineBoundingBox(updatedLine.points);
  
  // Update dimensions
  updatedLine.dimensions = boundingBox.dimensions;
  
  // Apply position adjustment if needed
  if (boundingBox.positionAdjustment) {
    updatedLine.position = {
      x: updatedLine.position.x + boundingBox.positionAdjustment.x,
      y: updatedLine.position.y + boundingBox.positionAdjustment.y
    };
    
    // Adjust all points
    for (let i = 0; i < updatedLine.points.length; i++) {
      updatedLine.points[i] = {
        x: updatedLine.points[i].x + boundingBox.pointAdjustments.x,
        y: updatedLine.points[i].y + boundingBox.pointAdjustments.y
      };
    }
  }

  return updatedLine;
}

/**
 * Create a deep copy of an object without using JSON.parse/stringify
 * More efficient than JSON methods for large objects
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * Generate points for a single elbow connector between two points
 * @param startPoint The starting point
 * @param endPoint The ending point
 * @param startPosition The connection position of the start point (if connected to a shape)
 * @param endPosition The connection position of the end point (if connected to a shape)
 * @returns Array of points forming the elbow connector
 */
export function generateElbowConnector(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  startPosition?: ConnectionPointPosition,
  endPosition?: ConnectionPointPosition
): Array<{ x: number; y: number }> {
  // Start with the simplest case - just the two endpoints
  const points: Array<{ x: number; y: number }> = [
    { x: startPoint.x, y: startPoint.y },
    { x: endPoint.x, y: endPoint.y }
  ];
  
  // Calculate the direct distance between points
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If the points are very close, just use a straight line
  if (distance < 20) {
    return points;
  }
  
  // Determine which direction to go first based on connection points
  let startHorizontal = true; // Default to horizontal first
  
  // If we have connection positions, use them to determine the direction
  if (startPosition) {
    // If starting from top or bottom, go vertical first
    if (startPosition === 'n' || startPosition === 's') {
      startHorizontal = false;
    }
    // If starting from left or right, go horizontal first
    else if (startPosition === 'e' || startPosition === 'w') {
      startHorizontal = true;
    }
    // For corners, use the dominant axis
    else {
      startHorizontal = Math.abs(dx) > Math.abs(dy);
    }
  } 
  // If no start position but we have end position
  else if (endPosition) {
    // If ending at top or bottom, go vertical last (horizontal first)
    if (endPosition === 'n' || endPosition === 's') {
      startHorizontal = true;
    }
    // If ending at left or right, go horizontal last (vertical first)
    else if (endPosition === 'e' || endPosition === 'w') {
      startHorizontal = false;
    }
    // For corners, use the dominant axis
    else {
      startHorizontal = Math.abs(dx) > Math.abs(dy);
    }
  }
  // If no connection positions, use the dominant axis
  else {
    startHorizontal = Math.abs(dx) > Math.abs(dy);
  }
  
  // Clear the points array and rebuild with a single elbow
  points.length = 0;
  points.push({ x: startPoint.x, y: startPoint.y });
  
  // Calculate the elbow point based on the determined direction
  let elbowX: number;
  let elbowY: number;
  
  if (startHorizontal) {
    // Go horizontally first, then vertically
    elbowX = endPoint.x;
    elbowY = startPoint.y;
  } else {
    // Go vertically first, then horizontally
    elbowX = startPoint.x;
    elbowY = endPoint.y;
  }
  
  // Add the elbow point
  points.push({ x: elbowX, y: elbowY });
  
  // Add the end point
  points.push({ x: endPoint.x, y: endPoint.y });
  
  return points;
}

/**
 * Determine the optimal connection points for a single elbow connector
 * @param startShape The starting shape
 * @param endShape The ending shape
 * @returns Optimal connection positions and points
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
  // Get the center points of both shapes
  const startCenter = {
    x: startShape.position.x + (startShape.dimensions?.width || 0) / 2,
    y: startShape.position.y + (startShape.dimensions?.height || 0) / 2
  };
  
  const endCenter = {
    x: endShape.position.x + (endShape.dimensions?.width || 0) / 2,
    y: endShape.position.y + (endShape.dimensions?.height || 0) / 2
  };
  
  // Determine relative positions
  const dx = endCenter.x - startCenter.x;
  const dy = endCenter.y - startCenter.y;
  
  // Determine optimal connection points based on relative positions
  let startPosition: ConnectionPointPosition;
  let endPosition: ConnectionPointPosition;
  
  // Following the rules:
  // 1. If start is to the left of end, exit from east
  // 2. If start is to the right of end, exit from west
  // 3. If start is above end, exit from south
  // 4. If start is below end, exit from north
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal relationship is stronger
    if (dx > 0) {
      // Start is to the left of end
      startPosition = 'e';
      endPosition = 'w';
    } else {
      // Start is to the right of end
      startPosition = 'w';
      endPosition = 'e';
    }
  } else {
    // Vertical relationship is stronger
    if (dy > 0) {
      // Start is above end
      startPosition = 's';
      endPosition = 'n';
    } else {
      // Start is below end
      startPosition = 'n';
      endPosition = 's';
    }
  }
  
  // Calculate the actual connection points
  const startPoint = calculateConnectionPointPosition(startShape, startPosition, true);
  const endPoint = calculateConnectionPointPosition(endShape, endPosition, true);
  
  return {
    startPosition,
    endPosition,
    startPoint,
    endPoint
  };
}

/**
 * Update a line to use single elbow routing
 * @param line The line node to update
 * @param connections Array of connections
 * @param nodes Array of all nodes
 * @returns Updated line node with elbow routing
 */
export function updateLineWithElbowRouting(
  line: Node,
  connections: Connection[],
  nodes: Node[]
): Node {
  // Create a copy of the line to avoid direct mutation
  const updatedLine = { ...line, points: [...(line.points || [])] };
  
  // If there are no points or fewer than 2 points, return the line as is
  if (!updatedLine.points || updatedLine.points.length < 2) {
    return updatedLine;
  }
  
  // Find connections for the start and end points
  const startConnection = connections.find(
    conn => conn.lineId === line.id && conn.pointIndex === 0
  );
  
  const endConnection = connections.find(
    conn => conn.lineId === line.id && conn.pointIndex === updatedLine.points!.length - 1
  );
  
  // Get absolute positions of start and end points
  const startPoint = {
    x: updatedLine.position.x + updatedLine.points[0].x,
    y: updatedLine.position.y + updatedLine.points[0].y
  };
  
  const endPoint = {
    x: updatedLine.position.x + updatedLine.points[updatedLine.points.length - 1].x,
    y: updatedLine.position.y + updatedLine.points[updatedLine.points.length - 1].y
  };
  
  // Get connection positions if available
  let startPosition: ConnectionPointPosition | undefined;
  let endPosition: ConnectionPointPosition | undefined;
  
  // If both endpoints are connected to shapes, find optimal connection points
  if (startConnection && endConnection) {
    const startShape = nodes.find(n => n.id === startConnection.shapeId);
    const endShape = nodes.find(n => n.id === endConnection.shapeId);
    
    if (startShape && endShape) {
      // Find optimal connection points for a single elbow
      const optimalPoints = findOptimalElbowConnectionPoints(startShape, endShape);
      
      // Update connection positions
      startPosition = optimalPoints.startPosition;
      endPosition = optimalPoints.endPosition;
      
      // Update actual points
      startPoint.x = optimalPoints.startPoint.x;
      startPoint.y = optimalPoints.startPoint.y;
      endPoint.x = optimalPoints.endPoint.x;
      endPoint.y = optimalPoints.endPoint.y;
      
      // Update the connections in the store
      if (startConnection.dynamic) {
        startConnection.position = startPosition;
      }
      
      if (endConnection.dynamic) {
        endConnection.position = endPosition;
      }
    } else {
      // One or both shapes not found, use existing connection positions
      if (startConnection) {
        startPosition = startConnection.position;
        
        // Update start point if dynamic
        if (startConnection.dynamic && startShape) {
          const point = calculateConnectionPointPosition(startShape, startConnection.position, true);
          startPoint.x = point.x;
          startPoint.y = point.y;
        }
      }
      
      if (endConnection) {
        endPosition = endConnection.position;
        
        // Update end point if dynamic
        if (endConnection.dynamic && endShape) {
          const point = calculateConnectionPointPosition(endShape, endConnection.position, true);
          endPoint.x = point.x;
          endPoint.y = point.y;
        }
      }
    }
  } else {
    // Handle cases where only one endpoint is connected
    if (startConnection) {
      const startShape = nodes.find(n => n.id === startConnection.shapeId);
      
      if (startShape) {
        if (startConnection.dynamic) {
          // If dynamic, find the optimal connection point based on the end point
          const optimalConnection = findOptimalConnectionPoint(startShape, endPoint, true);
          startPosition = optimalConnection.position;
          startPoint.x = optimalConnection.point.x;
          startPoint.y = optimalConnection.point.y;
          
          // Update the connection position in the store
          startConnection.position = startPosition;
        } else {
          // Use the fixed connection point
          startPosition = startConnection.position;
          const point = calculateConnectionPointPosition(startShape, startConnection.position, true);
          startPoint.x = point.x;
          startPoint.y = point.y;
        }
      }
    }
    
    if (endConnection) {
      const endShape = nodes.find(n => n.id === endConnection.shapeId);
      
      if (endShape) {
        if (endConnection.dynamic) {
          // If dynamic, find the optimal connection point based on the start point
          const optimalConnection = findOptimalConnectionPoint(endShape, startPoint, true);
          endPosition = optimalConnection.position;
          endPoint.x = optimalConnection.point.x;
          endPoint.y = optimalConnection.point.y;
          
          // Update the connection position in the store
          endConnection.position = endPosition;
        } else {
          // Use the fixed connection point
          endPosition = endConnection.position;
          const point = calculateConnectionPointPosition(endShape, endConnection.position, true);
          endPoint.x = point.x;
          endPoint.y = point.y;
        }
      }
    }
  }
  
  // Generate elbow points
  const elbowPoints = generateElbowConnector(
    startPoint,
    endPoint,
    startPosition,
    endPosition
  );
  
  // Convert absolute points to relative points
  updatedLine.points = elbowPoints.map(point => ({
    x: point.x - updatedLine.position.x,
    y: point.y - updatedLine.position.y
  }));
  
  // Recalculate the bounding box
  const boundingBox = calculateLineBoundingBox(updatedLine.points);
  
  // Update dimensions
  updatedLine.dimensions = boundingBox.dimensions;
  
  // Apply position adjustment if needed
  if (boundingBox.positionAdjustment) {
    updatedLine.position = {
      x: updatedLine.position.x + boundingBox.positionAdjustment.x,
      y: updatedLine.position.y + boundingBox.positionAdjustment.y
    };
    
    // Adjust all points
    for (let i = 0; i < updatedLine.points.length; i++) {
      updatedLine.points[i] = {
        x: updatedLine.points[i].x + boundingBox.pointAdjustments.x,
        y: updatedLine.points[i].y + boundingBox.pointAdjustments.y
      };
    }
  }
  
  return updatedLine;
}

// Modify the existing updateAllLineConnections function to handle elbow routing
export function updateAllLineConnections(
  line: Node,
  connections: Connection[],
  nodes: Node[]
): Node {
  // Check if this line uses elbow routing
  const lineType = line.data?.lineType as string || 'straight';
  
  // If this is an elbow connector, use the elbow routing function
  if (lineType === 'elbow') {
    return updateLineWithElbowRouting(line, connections, nodes);
  }
  
  // Otherwise, use the existing straight line logic
  // Create a copy of the line to avoid direct mutation
  const updatedLine = { ...line, points: [...(line.points || [])] };
  
  // Find all connections for this line
  const lineConnections = connections.filter(conn => conn.lineId === line.id);
  
  // If there are no connections or no points, return the line as is
  if (lineConnections.length === 0 || !updatedLine.points || updatedLine.points.length < 2) {
    return updatedLine;
  }
  
  // First, identify the connections for the first and last points (endpoints)
  const firstPointConnection = lineConnections.find(conn => conn.pointIndex === 0);
  const lastPointConnection = lineConnections.find(conn => 
    conn.pointIndex === updatedLine.points!.length - 1
  );
  
  // Create copies of the connections to avoid modifying the originals
  const firstPointConnectionCopy = firstPointConnection ? { ...firstPointConnection } : null;
  const lastPointConnectionCopy = lastPointConnection ? { ...lastPointConnection } : null;
  
  // If both endpoints are connected, we need to optimize both
  if (firstPointConnectionCopy && lastPointConnectionCopy && 
      firstPointConnectionCopy.dynamic && lastPointConnectionCopy.dynamic) {
    // Find the shapes for both connections
    const firstShape = nodes.find(n => n.id === firstPointConnectionCopy.shapeId);
    const lastShape = nodes.find(n => n.id === lastPointConnectionCopy.shapeId);
    
    if (firstShape && lastShape) {
      // We need to iteratively find the optimal connection points for both endpoints
      // since they depend on each other
      
      // Start with the current positions
      let firstPoint = {
        x: updatedLine.position.x + updatedLine.points[0].x,
        y: updatedLine.position.y + updatedLine.points[0].y
      };
      
      let lastPoint = {
        x: updatedLine.position.x + updatedLine.points[updatedLine.points.length - 1].x,
        y: updatedLine.position.y + updatedLine.points[updatedLine.points.length - 1].y
      };
      
      // Iterate a few times to converge on optimal points
      for (let i = 0; i < 3; i++) {
        // Find optimal connection point for first endpoint based on last point
        const optimalFirst = findOptimalConnectionPoint(firstShape, lastPoint, true);
        firstPoint = optimalFirst.point;
        firstPointConnectionCopy.position = optimalFirst.position;
        
        // Find optimal connection point for last endpoint based on first point
        const optimalLast = findOptimalConnectionPoint(lastShape, firstPoint, true);
        lastPoint = optimalLast.point;
        lastPointConnectionCopy.position = optimalLast.position;
      }
      
      // Update the line points with the final optimal positions
      updatedLine.points[0] = {
        x: firstPoint.x - updatedLine.position.x,
        y: firstPoint.y - updatedLine.position.y
      };
      
      updatedLine.points[updatedLine.points.length - 1] = {
        x: lastPoint.x - updatedLine.position.x,
        y: lastPoint.y - updatedLine.position.y
      };
    }
  } else {
    // Process each connection individually
    for (const connection of lineConnections) {
      if (!connection.dynamic) continue;
      
      // Create a copy of the connection to avoid modifying the original
      const connectionCopy = { ...connection };
      
      // Find the shape node this connection is attached to
      const shapeNode = nodes.find(n => n.id === connectionCopy.shapeId);
      
      if (shapeNode && updatedLine.points) {
        // Determine which point to use as reference for finding the optimal connection
        let referencePoint: { x: number, y: number } | null = null;
        
        // If this is an endpoint (first or last point), use the opposite endpoint
        if (connectionCopy.pointIndex === 0 && updatedLine.points.length > 1) {
          // First point - use the last point as reference
          referencePoint = {
            x: updatedLine.position.x + updatedLine.points[updatedLine.points.length - 1].x,
            y: updatedLine.position.y + updatedLine.points[updatedLine.points.length - 1].y
          };
        } else if (connectionCopy.pointIndex === updatedLine.points.length - 1) {
          // Last point - use the first point as reference
          referencePoint = {
            x: updatedLine.position.x + updatedLine.points[0].x,
            y: updatedLine.position.y + updatedLine.points[0].y
          };
        } else if (connectionCopy.pointIndex > 0 && connectionCopy.pointIndex < updatedLine.points.length - 1) {
          // Middle point - use the average of adjacent points as reference
          const prevPoint = {
            x: updatedLine.position.x + updatedLine.points[connectionCopy.pointIndex - 1].x,
            y: updatedLine.position.y + updatedLine.points[connectionCopy.pointIndex - 1].y
          };
          
          const nextPoint = {
            x: updatedLine.position.x + updatedLine.points[connectionCopy.pointIndex + 1].x,
            y: updatedLine.position.y + updatedLine.points[connectionCopy.pointIndex + 1].y
          };
          
          referencePoint = {
            x: (prevPoint.x + nextPoint.x) / 2,
            y: (prevPoint.y + nextPoint.y) / 2
          };
        }
        
        // Only proceed if we have a valid reference point
        if (referencePoint) {
          // Find the optimal connection point based on the reference point
          const optimalConnection = findOptimalConnectionPoint(shapeNode, referencePoint, true);
          
          // Update the connection position in our copy
          connectionCopy.position = optimalConnection.position;
          
          // Calculate the relative position for the line point
          const relativeX = optimalConnection.point.x - updatedLine.position.x;
          const relativeY = optimalConnection.point.y - updatedLine.position.y;
          
          // Update the line point
          updatedLine.points[connectionCopy.pointIndex] = { x: relativeX, y: relativeY };
        }
      }
    }
  }
  
  // Recalculate the bounding box
  if (updatedLine.points && updatedLine.points.length > 0) {
    const boundingBox = calculateLineBoundingBox(updatedLine.points);
    
    // Update dimensions
    updatedLine.dimensions = boundingBox.dimensions;
    
    // Apply position adjustment if needed
    if (boundingBox.positionAdjustment) {
      updatedLine.position = {
        x: updatedLine.position.x + boundingBox.positionAdjustment.x,
        y: updatedLine.position.y + boundingBox.positionAdjustment.y
      };
      
      // Adjust all points
      for (let i = 0; i < updatedLine.points.length; i++) {
        updatedLine.points[i] = {
          x: updatedLine.points[i].x + boundingBox.pointAdjustments.x,
          y: updatedLine.points[i].y + boundingBox.pointAdjustments.y
        };
      }
    }
  }
  
  return updatedLine;
} 