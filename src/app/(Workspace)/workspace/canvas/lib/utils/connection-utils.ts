import { Node, Connection } from '../store/canvas-store';
import { ConnectionPointPosition } from '../../components/ui/ConnectionPoints';

// Define a constant for the snapping threshold
export const CONNECTION_SNAP_THRESHOLD = 15; // px

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
        connectionX = centerX - radius * 0.7071;
        connectionY = centerY - radius * 0.7071;
        break;
      case 'ne':
        connectionX = centerX + radius * 0.7071;
        connectionY = centerY - radius * 0.7071;
        break;
      case 'sw':
        connectionX = centerX - radius * 0.7071;
        connectionY = centerY + radius * 0.7071;
        break;
      case 'se':
        connectionX = centerX + radius * 0.7071;
        connectionY = centerY + radius * 0.7071;
        break;
    }
  } else if (node.type === 'diamond') {
    // Diamond-specific connection point calculations
    // Implementation would go here
  } else if (node.type === 'triangle') {
    // Triangle-specific connection point calculations
    // Implementation would go here
  } else {
    // Default rectangle behavior
    switch (position) {
      case 'n':
        connectionX += width / 2;
        break;
      case 's':
        connectionX += width / 2;
        connectionY += height;
        break;
      case 'w':
        connectionY += height / 2;
        break;
      case 'e':
        connectionX += width;
        connectionY += height / 2;
        break;
      case 'nw':
        break;
      case 'ne':
        connectionX += width;
        break;
      case 'sw':
        connectionY += height;
        break;
      case 'se':
        connectionX += width;
        connectionY += height;
        break;
    }
  }

  return { x: connectionX, y: connectionY };
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
  connectionPoint: { x: number, y: number }
): Node {
  if (!line.points || line.points.length <= connection.pointIndex) {
    return line;
  }

  // Create a copy of the line to avoid direct mutation
  const updatedLine = { ...line, points: [...line.points] };
  
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