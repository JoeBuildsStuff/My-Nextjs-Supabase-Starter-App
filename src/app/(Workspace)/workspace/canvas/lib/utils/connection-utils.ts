import { Node, Connection } from '../store/canvas-store';
import { ConnectionPointPosition } from '../../components/ui/ConnectionPoints';

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

// Line bounding box padding constant
const LINE_BOUNDING_BOX_PADDING = 10;

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
  
  // Recalculate line dimensions
  const allX = updatedLine.points.map(p => p.x);
  const allY = updatedLine.points.map(p => p.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  
  // Add padding to the bounding box
  const paddedMinX = minX - LINE_BOUNDING_BOX_PADDING;
  const paddedMaxX = maxX + LINE_BOUNDING_BOX_PADDING;
  const paddedMinY = minY - LINE_BOUNDING_BOX_PADDING;
  const paddedMaxY = maxY + LINE_BOUNDING_BOX_PADDING;
  
  // Update line position and dimensions
  if (paddedMinX < 0 || paddedMinY < 0) {
    // Adjust position to the top-left corner of the padded bounding box
    updatedLine.position = {
      x: updatedLine.position.x + paddedMinX,
      y: updatedLine.position.y + paddedMinY
    };
    
    // Adjust all points to be relative to the new position
    for (let i = 0; i < updatedLine.points.length; i++) {
      updatedLine.points[i].x -= paddedMinX;
      updatedLine.points[i].y -= paddedMinY;
    }
    
    // Update dimensions to the size of the padded bounding box
    updatedLine.dimensions = {
      width: Math.max(paddedMaxX - paddedMinX, 1),
      height: Math.max(paddedMaxY - paddedMinY, 1)
    };
  } else {
    // No need to adjust position, just update dimensions with padding
    updatedLine.dimensions = {
      width: Math.max(paddedMaxX, 1),
      height: Math.max(paddedMaxY, 1)
    };
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