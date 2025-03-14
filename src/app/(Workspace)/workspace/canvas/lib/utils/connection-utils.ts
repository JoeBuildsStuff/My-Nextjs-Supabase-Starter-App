import { Node, Connection } from '../store/canvas-store';
import { ConnectionPointPosition } from '../../components/ui/ConnectionPoints';

// Define a constant for the snapping threshold
export const CONNECTION_SNAP_THRESHOLD = 25; // Increased from 15 to 25 for better snapping

// Define trigonometric constants at module level to avoid recalculation
const COS_45_DEG = 0.7071; // cos(45°)
const SIN_45_DEG = 0.7071; // sin(45°)

/**
 * Calculate the absolute position of a connection point on a shape
 */
export function calculateConnectionPointPosition(
  node: Node,
  position: ConnectionPointPosition
): { x: number, y: number } {
  if (!node.dimensions) {
    return { x: node.position.x, y: node.position.y };
  }

  const { x, y } = node.position;
  const { width, height } = node.dimensions;
  let connectionX = x;
  let connectionY = y;

  if (node.type === 'circle') {
    const radius = Math.min(width, height) / 2;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    switch (position) {
      case 'n':
        connectionX = centerX;
        connectionY = centerY - radius;
        break;
      case 's':
        connectionX = centerX;
        connectionY = centerY + radius;
        break;
      case 'w':
        connectionX = centerX - radius;
        connectionY = centerY;
        break;
      case 'e':
        connectionX = centerX + radius;
        connectionY = centerY;
        break;
      case 'nw':
        connectionX = centerX - radius * COS_45_DEG;
        connectionY = centerY - radius * COS_45_DEG;
        break;
      case 'ne':
        connectionX = centerX + radius * COS_45_DEG;
        connectionY = centerY - radius * COS_45_DEG;
        break;
      case 'sw':
        connectionX = centerX - radius * COS_45_DEG;
        connectionY = centerY + radius * COS_45_DEG;
        break;
      case 'se':
        connectionX = centerX + radius * COS_45_DEG;
        connectionY = centerY + radius * COS_45_DEG;
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
        break;
      case 's':
        rectX = centerX;
        rectY = y + height;
        break;
      case 'w':
        rectX = x;
        rectY = centerY;
        break;
      case 'e':
        rectX = x + width;
        rectY = centerY;
        break;
      case 'nw':
        rectX = x;
        rectY = y;
        break;
      case 'ne':
        rectX = x + width;
        rectY = y;
        break;
      case 'sw':
        rectX = x;
        rectY = y + height;
        break;
      case 'se':
        rectX = x + width;
        rectY = y + height;
        break;
    }
    
    // Then, apply the 45-degree rotation around the center
    // Rotation formula:
    // x' = centerX + (x - centerX) * cos(angle) - (y - centerY) * sin(angle)
    // y' = centerY + (x - centerX) * sin(angle) + (y - centerY) * cos(angle)
    // Using the constants defined at module level
    
    connectionX = centerX + (rectX - centerX) * COS_45_DEG - (rectY - centerY) * SIN_45_DEG;
    connectionY = centerY + (rectX - centerX) * SIN_45_DEG + (rectY - centerY) * COS_45_DEG;
  } else if (node.type === 'triangle') {
    // Triangle-specific connection point calculations
    const centerX = x + width / 2;
    
    switch (position) {
      case 'n':
        connectionX = centerX;
        connectionY = y;
        break;
      case 's':
        connectionX = centerX;
        connectionY = y + height;
        break;
      case 'w':
        connectionX = x + width / 4;
        connectionY = y + height / 2;
        break;
      case 'e':
        connectionX = x + width * 3 / 4;
        connectionY = y + height / 2;
        break;
      case 'sw':
        connectionX = x;
        connectionY = y + height;
        break;
      case 'se':
        connectionX = x + width;
        connectionY = y + height;
        break;
      // nw and ne are not used for triangles
      case 'nw':
      case 'ne':
        connectionX = centerX;
        connectionY = y;
        break;
    }
  } else {
    // Default rectangle/text/other shapes
    switch (position) {
      case 'n':
        connectionX = x + width / 2;
        connectionY = y;
        break;
      case 's':
        connectionX = x + width / 2;
        connectionY = y + height;
        break;
      case 'w':
        connectionX = x;
        connectionY = y + height / 2;
        break;
      case 'e':
        connectionX = x + width;
        connectionY = y + height / 2;
        break;
      case 'nw':
        connectionX = x;
        connectionY = y;
        break;
      case 'ne':
        connectionX = x + width;
        connectionY = y;
        break;
      case 'sw':
        connectionX = x;
        connectionY = y + height;
        break;
      case 'se':
        connectionX = x + width;
        connectionY = y + height;
        break;
    }
  }

  return { x: connectionX, y: connectionY };
}

/**
 * Find the optimal connection point on a shape that minimizes the distance to a target point
 * @param shape The shape node to find the optimal connection point on
 * @param targetPoint The target point to minimize distance to
 * @returns The optimal connection position and its absolute coordinates
 */
export function findOptimalConnectionPoint(
  shape: Node,
  targetPoint: { x: number, y: number }
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
    const connectionPoint = calculateConnectionPointPosition(shape, position);
    
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
      const pointPos = calculateConnectionPointPosition(node, position);
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
  
  // If we have nodes and this is a dynamic connection, find the optimal connection point
  if (nodes && connection.dynamic) {
    // Find the other endpoint index
    // We need to find the opposite endpoint from the current connection point
    let otherEndpointIndex: number | null = null;
    
    // If this is the first point (index 0), the other endpoint is the last point
    if (connection.pointIndex === 0) {
      otherEndpointIndex = line.points.length - 1;
    } 
    // If this is the last point, the other endpoint is the first point
    else if (connection.pointIndex === line.points.length - 1) {
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
      const shapeNode = nodes.find(n => n.id === connection.shapeId);
      
      if (shapeNode) {
        // Find the optimal connection point based on the other endpoint's position
        const optimalConnection = findOptimalConnectionPoint(shapeNode, otherEndpoint);
        
        // Update the connection position
        connection.position = optimalConnection.position;
        
        // Use the optimal connection point instead of the provided one
        connectionPoint = optimalConnection.point;
      }
    }
  }
  
  // Calculate the relative position for the line point
  const relativeX = connectionPoint.x - line.position.x;
  const relativeY = connectionPoint.y - line.position.y;
  
  // Update the line point
  updatedLine.points[connection.pointIndex] = { x: relativeX, y: relativeY };
  
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
      updatedLine.points[i].x += boundingBox.pointAdjustments.x;
      updatedLine.points[i].y += boundingBox.pointAdjustments.y;
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
 * Update all connections for a line to use optimal connection points
 * This is useful when a line is moved and we need to update all its connections
 */
export function updateAllLineConnections(
  line: Node,
  connections: Connection[],
  nodes: Node[]
): Node {
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
  
  // If both endpoints are connected, we need to optimize both
  if (firstPointConnection && lastPointConnection && 
      firstPointConnection.dynamic && lastPointConnection.dynamic) {
    // Find the shapes for both connections
    const firstShape = nodes.find(n => n.id === firstPointConnection.shapeId);
    const lastShape = nodes.find(n => n.id === lastPointConnection.shapeId);
    
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
        const optimalFirst = findOptimalConnectionPoint(firstShape, lastPoint);
        firstPoint = optimalFirst.point;
        firstPointConnection.position = optimalFirst.position;
        
        // Find optimal connection point for last endpoint based on first point
        const optimalLast = findOptimalConnectionPoint(lastShape, firstPoint);
        lastPoint = optimalLast.point;
        lastPointConnection.position = optimalLast.position;
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
      
      // Find the shape node this connection is attached to
      const shapeNode = nodes.find(n => n.id === connection.shapeId);
      
      if (shapeNode && updatedLine.points) {
        // Determine which point to use as reference for finding the optimal connection
        let referencePoint: { x: number, y: number } | null = null;
        
        // If this is an endpoint (first or last point), use the opposite endpoint
        if (connection.pointIndex === 0 && updatedLine.points.length > 1) {
          // First point - use the last point as reference
          referencePoint = {
            x: updatedLine.position.x + updatedLine.points[updatedLine.points.length - 1].x,
            y: updatedLine.position.y + updatedLine.points[updatedLine.points.length - 1].y
          };
        } else if (connection.pointIndex === updatedLine.points.length - 1) {
          // Last point - use the first point as reference
          referencePoint = {
            x: updatedLine.position.x + updatedLine.points[0].x,
            y: updatedLine.position.y + updatedLine.points[0].y
          };
        } else if (connection.pointIndex > 0 && connection.pointIndex < updatedLine.points.length - 1) {
          // Middle point - use the average of adjacent points as reference
          const prevPoint = {
            x: updatedLine.position.x + updatedLine.points[connection.pointIndex - 1].x,
            y: updatedLine.position.y + updatedLine.points[connection.pointIndex - 1].y
          };
          
          const nextPoint = {
            x: updatedLine.position.x + updatedLine.points[connection.pointIndex + 1].x,
            y: updatedLine.position.y + updatedLine.points[connection.pointIndex + 1].y
          };
          
          referencePoint = {
            x: (prevPoint.x + nextPoint.x) / 2,
            y: (prevPoint.y + nextPoint.y) / 2
          };
        }
        
        // Only proceed if we have a valid reference point
        if (referencePoint) {
          // Find the optimal connection point based on the reference point
          const optimalConnection = findOptimalConnectionPoint(shapeNode, referencePoint);
          
          // Update the connection position
          connection.position = optimalConnection.position;
          
          // Calculate the relative position for the line point
          const relativeX = optimalConnection.point.x - updatedLine.position.x;
          const relativeY = optimalConnection.point.y - updatedLine.position.y;
          
          // Update the line point
          updatedLine.points[connection.pointIndex] = { x: relativeX, y: relativeY };
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
        updatedLine.points[i].x += boundingBox.pointAdjustments.x;
        updatedLine.points[i].y += boundingBox.pointAdjustments.y;
      }
    }
  }
  
  return updatedLine;
} 