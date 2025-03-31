'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, Node, MarkerShape } from '../lib/store/canvas-store';
import ShapeRenderer from './shapes/ShapeRenderer';
import SelectionBox from './selection/SelectionBox';
import CanvasGrid from './grid/CanvasGrid';
import LineInProgress from './line-drawing/LineInProgress';
import { ResizeHandleDirection } from './ui/ResizeHandles';
import { deepClone } from '../lib/utils/connection-utils';
import AlignmentGuide from './alignment/AlignmentGuide';
import { toast } from '@/hooks/use-toast';
import IconSheet from './ui/IconSheet';
import ExamplesSheet from './ui/ExamplesSheet';
import { useCanvasMouse } from '../hooks/useCanvasMouse';


interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
  nodes?: Node[];
  onNodesChange?: (nodes: Node[]) => void;
  canvasId?: string;
}

const Canvas: React.FC<CanvasProps> = ({ 
  width,
  height,
  className = '',
  nodes = [],
  onNodesChange,
  canvasId
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { 
    transform, 
    activeTool, 
    gridSize, 
    snapToGrid,
    panCanvas,
    selectNode,
    updateNodePosition,
    deselectAllNodes,
    selectMultipleNodes,
    updateNodeDimensions,
    presentationMode,
    cancelLineDraw,
    lineInProgress,
    selectedPointIndices,
    deleteSelectedPoints,
    markerFillStyle,
    setStartMarker,
    setMarkerFillStyle,
    updateSelectedLineMarkers,
    setSnapToGrid,
  } = useCanvasStore();
  
  // Get the mouse interactions from our custom hook
  const {
    isSelecting,
    selectionBox,
    alignmentGuides,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleConnectionPointClick,
    setIsShiftPressed,
    hoveredConnectionPoint,
    selectedLineEndpoint
  } = useCanvasMouse(canvasRef);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [historyInitialized, setHistoryInitialized] = useState(false);
  
  // Add a state to track the nodes from the store
  const [storeNodes, setStoreNodes] = useState<Node[]>([]);
  
  // Use the nodes from props or from the store
  const displayNodes = nodes.length > 0 ? nodes : storeNodes;
  
  // Copy canvas data to clipboard
  const copyCanvasToClipboard = () => {
    const { nodes, connections } = useCanvasStore.getState();
    
    // Check if any nodes are selected
    const selectedNodes = nodes.filter(node => node.selected);
    
    // If nodes are selected, only copy those nodes and their connections
    const nodesToCopy = selectedNodes.length > 0 ? selectedNodes : nodes;
    
    // Get only the connections that involve the nodes being copied
    const nodeIds = nodesToCopy.map(node => node.id);
    const relevantConnections = connections.filter(conn => 
      nodeIds.includes(conn.lineId) && nodeIds.includes(conn.shapeId)
    );
    
    // Prepare the export data
    const exportData = {
      nodes: nodesToCopy,
      connections: relevantConnections,
      version: "1.0",
      exportDate: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: selectedNodes.length > 0 
            ? `Copied ${selectedNodes.length} selected node${selectedNodes.length === 1 ? '' : 's'} to clipboard.`
            : "The canvas JSON data has been copied to your clipboard."
        });
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive"
        });
      });
  };
  
  // Set dimensions after component mounts on client side
  useEffect(() => {
    const parentWidth = canvasRef.current?.parentElement?.clientWidth;
    const parentHeight = canvasRef.current?.parentElement?.clientHeight;
    
    setDimensions({
      width: width || parentWidth || 2000,
      height: height || parentHeight || 1500
    });
    
    const handleResize = () => {
      if (!width || !height) {
        const parentWidth = canvasRef.current?.parentElement?.clientWidth;
        const parentHeight = canvasRef.current?.parentElement?.clientHeight;
        
        setDimensions({
          width: width || parentWidth || 2000,
          height: height || parentHeight || 1500
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  // Initialize history when canvas first loads
  useEffect(() => {
    if (canvasId && !historyInitialized) {
      // Initialize history with empty state
      useCanvasStore.setState(state => {
        state.history = [{
          nodes: [],
          edges: [],
          connections: []
        }];
        state.historyIndex = 0;
        return state;
      });
      
      // If we have nodes, add them to history
      if (displayNodes && displayNodes.length > 0) {
        setTimeout(() => {
          useCanvasStore.setState(state => {
            state.history.push({
              nodes: deepClone(displayNodes),
              edges: deepClone(state.edges),
              connections: deepClone(state.connections || [])
            });
            state.historyIndex = 1;
            return state;
          });
        }, 100);
      }
      
      setHistoryInitialized(true);
    }
  }, [canvasId, displayNodes, historyInitialized]);
  
  // Initialize nodes in the store when component mounts
  useEffect(() => {
    // Only initialize if we have nodes from props and they're not already in the store
    if (nodes && nodes.length > 0) {
      const currentStoreNodes = useCanvasStore.getState().nodes;
      if (!currentStoreNodes || currentStoreNodes.length === 0) {
        // Set the nodes in the store
        useCanvasStore.setState({ nodes });
      }
    }
  }, [nodes]);
  
  // Subscribe to store changes to keep local state in sync
  useEffect(() => {
    // Initial sync
    setStoreNodes(useCanvasStore.getState().nodes);
    
    // Subscribe to store changes
    const unsubscribe = useCanvasStore.subscribe((state) => {
      setStoreNodes(state.nodes);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Add event listeners for keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the event target is an input or textarea element
      const target = e.target as HTMLElement;
      const isEditingText = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
      
      // Add arrow key detection
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Only handle arrow keys if we're not editing text
        if (!isEditingText) {
          e.preventDefault(); // Prevent page scrolling
          
          // Get selected nodes
          const selectedNodes = displayNodes.filter(node => node.selected);
          
          // If any nodes are selected, move them in the direction of the arrow key
          if (selectedNodes.length > 0) {
            // Determine base distance to move
            const baseDistance = snapToGrid ? gridSize : 1;
            
            // Use a multiplier of 5 when Shift is pressed
            const multiplier = e.shiftKey ? 5 : 1;
            const moveDistance = baseDistance * multiplier;
            
            // Calculate the movement based on key pressed
            let dx = 0;
            let dy = 0;
            
            switch (e.key) {
              case 'ArrowUp':
                dy = -moveDistance;
                break;
              case 'ArrowDown':
                dy = moveDistance;
                break;
              case 'ArrowLeft':
                dx = -moveDistance;
                break;
              case 'ArrowRight':
                dx = moveDistance;
                break;
            }
            
            // Move each selected node
            selectedNodes.forEach(node => {
              updateNodePosition(
                node.id,
                node.position.x + dx,
                node.position.y + dy
              );
            });
            
            // Push to history to preserve the movement
            useCanvasStore.getState().pushToHistory();
          }
        }
      }
      
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      } else if (e.key === 'Escape') {
        if (lineInProgress) {
          cancelLineDraw();
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText) {
        if (selectedPointIndices && selectedPointIndices.length > 0) {
          deleteSelectedPoints();
          e.preventDefault();
        }
      } else if (e.key === 'c' && (e.metaKey || e.ctrlKey) && !isEditingText) {
        // Handle Cmd+C / Ctrl+C to copy canvas JSON to clipboard
        e.preventDefault();
        copyCanvasToClipboard();
      } else if (e.key === 'a' && (e.metaKey || e.ctrlKey) && !isEditingText) {
        // Handle Cmd+A / Ctrl+A to select all nodes
        e.preventDefault();
        
        // Get all node IDs
        const allNodeIds = displayNodes.map(node => node.id);
        
        // Select all nodes
        selectMultipleNodes(allNodeIds);
      } else if (e.key === 'g' && (e.metaKey || e.ctrlKey) && !e.shiftKey && !isEditingText) {
        // Handle Cmd+G / Ctrl+G to toggle grid
        e.preventDefault();
        setSnapToGrid(!snapToGrid);
      }
      
      // Shortcuts for line markers - only when a line is selected
      const selectedLine = nodes.find(node => 
        node.selected && (node.type === 'line' || node.type === 'arrow')
      );
      
      if (selectedLine) {
        // Alt+1-5 for start marker types
        if (e.key >= '1' && e.key <= '5' && e.altKey) {
          e.preventDefault();
          const markerIndex = parseInt(e.key) - 1;
          const markers: MarkerShape[] = ['none', 'triangle', 'circle', 'square', 'diamond'];
          if (markerIndex >= 0 && markerIndex < markers.length) {
            setStartMarker(markers[markerIndex]);
            updateSelectedLineMarkers();
          }
        }
        
        // Shift+F to toggle fill style
        if (e.key === 'f' && e.shiftKey) {
          e.preventDefault();
          setMarkerFillStyle(markerFillStyle === 'filled' ? 'outlined' : 'filled');
          updateSelectedLineMarkers();
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    lineInProgress, 
    cancelLineDraw, 
    selectedPointIndices, 
    deleteSelectedPoints, 
    setStartMarker, 
    setMarkerFillStyle, 
    updateSelectedLineMarkers, 
    copyCanvasToClipboard, 
    snapToGrid, 
    setIsShiftPressed
  ]);
  
  // Add effect to deselect all nodes when line tool is selected
  useEffect(() => {
    if (['line', 'arrow'].includes(activeTool)) {
      deselectAllNodes();
    }
  }, [activeTool, deselectAllNodes]);
  
  // Handle resizing of nodes
  const handleResizeNode = (nodeId: string, direction: ResizeHandleDirection, dx: number, dy: number) => {
    const node = displayNodes?.find(n => n.id === nodeId);
    if (!node || !node.dimensions) return;
    
    const adjustedDx = dx / transform.zoom;
    const adjustedDy = dy / transform.zoom;
    
    let newWidth = node.dimensions.width;
    let newHeight = node.dimensions.height;
    let newX = node.position.x;
    let newY = node.position.y;
    
    switch (direction) {
      case 'e':
        newWidth = Math.max(10, node.dimensions.width + adjustedDx);
        break;
      case 'w':
        newWidth = Math.max(10, node.dimensions.width - adjustedDx);
        newX = node.position.x + adjustedDx;
        break;
      case 's':
        newHeight = Math.max(10, node.dimensions.height + adjustedDy);
        break;
      case 'n':
        newHeight = Math.max(10, node.dimensions.height - adjustedDy);
        newY = node.position.y + adjustedDy;
        break;
      case 'ne':
        newWidth = Math.max(10, node.dimensions.width + adjustedDx);
        newHeight = Math.max(10, node.dimensions.height - adjustedDy);
        newY = node.position.y + adjustedDy;
        break;
      case 'nw':
        newWidth = Math.max(10, node.dimensions.width - adjustedDx);
        newHeight = Math.max(10, node.dimensions.height - adjustedDy);
        newX = node.position.x + adjustedDx;
        newY = node.position.y + adjustedDy;
        break;
      case 'se':
        newWidth = Math.max(10, node.dimensions.width + adjustedDx);
        newHeight = Math.max(10, node.dimensions.height + adjustedDy);
        break;
      case 'sw':
        newWidth = Math.max(10, node.dimensions.width - adjustedDx);
        newHeight = Math.max(10, node.dimensions.height + adjustedDy);
        newX = node.position.x + adjustedDx;
        break;
    }
    
    if (snapToGrid) {
      newWidth = Math.round(newWidth / gridSize) * gridSize;
      newHeight = Math.round(newHeight / gridSize) * gridSize;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // For icon shapes, maintain a square aspect ratio
    const isIconShape = node.type === 'icon' || (node.data?.isIcon === true);
    if (isIconShape) {
      // Use the larger dimension to ensure the icon stays square
      // and doesn't get too small when resizing
      const maxDimension = Math.max(newWidth, newHeight);
      
      // Adjust position based on which corner is being dragged
      switch (direction) {
        case 'nw':
          newX = node.position.x + node.dimensions.width - maxDimension;
          newY = node.position.y + node.dimensions.height - maxDimension;
          break;
        case 'ne':
          newY = node.position.y + node.dimensions.height - maxDimension;
          break;
        case 'sw':
          newX = node.position.x + node.dimensions.width - maxDimension;
          break;
        // SE corner doesn't need position adjustment
      }
      
      // Set both dimensions to the same value
      newWidth = maxDimension;
      newHeight = maxDimension;
    }
    
    const isGroup = node.data?.isGroup === true;
    
    if (isGroup && displayNodes) {
      const childNodes = displayNodes.filter(n => n.parentId === nodeId);
      const widthRatio = newWidth / node.dimensions.width;
      const heightRatio = newHeight / node.dimensions.height;
      
      childNodes.forEach(childNode => {
        if (!childNode.dimensions) return;
        
        const newChildX = childNode.position.x * widthRatio;
        const newChildY = childNode.position.y * heightRatio;
        const newChildWidth = childNode.dimensions.width * widthRatio;
        const newChildHeight = childNode.dimensions.height * heightRatio;
        
        updateNodePosition(childNode.id, newChildX, newChildY);
        updateNodeDimensions(childNode.id, newChildWidth, newChildHeight);
      });
    }
    
    updateNodePosition(nodeId, newX, newY);
    updateNodeDimensions(nodeId, newWidth, newHeight);
  };
  
  // Update nodes in parent component when they change
  useEffect(() => {
    const storeNodes = useCanvasStore.getState().nodes;
    if (onNodesChange && storeNodes) {
      onNodesChange(storeNodes);
    }
  }, [onNodesChange]);
  
  // Handle text change
  const handleTextChange = (nodeId: string, text: string) => {
    const updatedNodes = useCanvasStore.getState().nodes.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, text, isNew: false } } : node
    );
    useCanvasStore.setState(state => {
      state.nodes = updatedNodes;
      return state;
    });
    useCanvasStore.getState().pushToHistory();
    if (onNodesChange) onNodesChange(updatedNodes);
  };
  
  // Add handler for empty text shapes
  const handleEmptyTextShape = (nodeId: string) => {
    // Filter out the empty text node
    const updatedNodes = useCanvasStore.getState().nodes.filter(node => node.id !== nodeId);
    useCanvasStore.setState(state => {
      state.nodes = updatedNodes;
      return state;
    });
    useCanvasStore.getState().pushToHistory();
    if (onNodesChange) onNodesChange(updatedNodes);
  };
  
  // Handle paste event for JSON data
  const handlePaste = (e: React.ClipboardEvent) => {
    // If we're in presentation mode, don't allow pasting
    if (presentationMode) return;
    
    // Check if we're editing text (input or textarea)
    const target = e.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;
    
    // If we're editing text, let the default paste behavior happen
    if (isEditingText) return;
    
    // Get clipboard data as text
    const clipboardText = e.clipboardData.getData('text');
    
    try {
      // Try to parse the clipboard text as JSON
      const jsonData = JSON.parse(clipboardText);
      
      // Validate the JSON data
      if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.nodes)) {
        // Not valid canvas JSON data, ignore
        return;
      }
      
      // Check if nodes have required properties
      for (const node of jsonData.nodes) {
        if (!node.id || !node.type || !node.position) {
          // Invalid node data, ignore
          return;
        }
      }
      
      // Get current store state to save to history
      useCanvasStore.getState().pushToHistory();
      
      // Generate new IDs for the pasted nodes to avoid conflicts
      const idMap = new Map<string, string>();
      const newNodes = jsonData.nodes.map((node: Node) => {
        const newId = `${node.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        idMap.set(node.id, newId);
        
        // Create a new node with a new ID
        return {
          ...node,
          id: newId,
          // Offset the position slightly to make it clear it's a new node
          position: {
            x: node.position.x + 20,
            y: node.position.y + 20
          },
          // Make sure the node is selected
          selected: true
        };
      });
      
      // Update connections to use the new IDs
      const newConnections = jsonData.connections && Array.isArray(jsonData.connections) 
        ? jsonData.connections.map((conn: { lineId: string; shapeId: string }) => {
            // Skip connections that reference nodes not in the paste data
            if (!idMap.has(conn.lineId) || !idMap.has(conn.shapeId)) {
              return null;
            }
            
            return {
              ...conn,
              lineId: idMap.get(conn.lineId) || conn.lineId,
              shapeId: idMap.get(conn.shapeId) || conn.shapeId
            };
          }).filter(Boolean)
        : [];
      
      // Add the new nodes and connections to the canvas
      useCanvasStore.setState(state => {
        // Deselect all existing nodes
        state.nodes.forEach(node => {
          node.selected = false;
        });
        
        // Add the new nodes to the existing ones
        state.nodes = [...state.nodes, ...newNodes];
        
        // Add the new connections to the existing ones
        if (newConnections.length > 0) {
          state.connections = [...state.connections, ...newConnections];
        }
        
        return state;
      });
      
      // Prevent default paste behavior
      e.preventDefault();
      
      // Show success toast
      toast({
        title: "Import Successful",
        description: `Pasted ${newNodes.length} nodes to the canvas.`,
      });
    } catch {
      // Not JSON or other error, let default paste behavior happen
      return;
    }
  };
  
  // Add effect for wheel event (with passive: false option)
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    
    const wheelHandler = (e: WheelEvent) => {
      // Prevent default scrolling behavior
      e.preventDefault();
      
      // Check if we're in presentation mode
      if (presentationMode) return;
      
      // Get the delta values
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;

      // Check for Cmd/Ctrl key for zooming
      if (e.metaKey || e.ctrlKey) {
        // Get canvas rect
        const rect = canvasElement.getBoundingClientRect();
        if (!rect) return;
        
        // Calculate mouse position in canvas coordinates (before zoom change)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate position relative to the content (account for current transform)
        const contentX = (mouseX - transform.x) / transform.zoom;
        const contentY = (mouseY - transform.y) / transform.zoom;
        
        // Current zoom level
        const oldZoom = transform.zoom;
        
        // New zoom level based on scroll direction
        let newZoom;
        if (deltaY < 0) {
          // Zoom in - wheel up (limit to max zoom of 2.0)
          newZoom = Math.min(oldZoom + 0.1, 2.0);
        } else {
          // Zoom out - wheel down (limit to min zoom of 0.1)
          newZoom = Math.max(oldZoom - 0.1, 0.1);
        }
        
        // Calculate new transform to keep the point under the mouse fixed
        const newX = mouseX - contentX * newZoom;
        const newY = mouseY - contentY * newZoom;
        
        // Update the transform in one operation to avoid flickering
        useCanvasStore.setState(state => {
          state.transform = {
            x: newX,
            y: newY,
            zoom: newZoom
          };
        });
      } else {
        // Handle both horizontal and vertical panning
        // This supports the MX Master's thumb scroll wheel for horizontal panning
        if (deltaX !== 0) {
          // Horizontal panning - using the thumb wheel or Shift+scroll on other mice
          panCanvas(-deltaX, 0);
        }
        
        if (deltaY !== 0) {
          // Vertical panning with main wheel
          panCanvas(0, -deltaY);
        }
      }
    };
    
    // Add event listener with { passive: false } to allow preventDefault()
    canvasElement.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Cleanup function to remove event listener
    return () => {
      canvasElement.removeEventListener('wheel', wheelHandler);
    };
  }, [transform, presentationMode, panCanvas]);
  
  return (
    <div 
      ref={canvasRef}
      data-testid="canvas-container"
      className={`relative overflow-hidden bg-background ${className}`}
      style={{ 
        width: dimensions.width, 
        height: dimensions.height,
        cursor: activeTool === 'text' ? 'text' : 'default'  // Add cursor style for text tool
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onPaste={handlePaste}
      tabIndex={0} // Make the div focusable to receive keyboard events
    >
      <CanvasGrid 
        snapToGrid={snapToGrid} 
        gridSize={gridSize} 
        transform={transform} 
        presentationMode={presentationMode} 
      />
      
      {isSelecting && selectionBox && (
        <SelectionBox 
          selectionBox={selectionBox} 
          transform={transform} 
        />
      )}
      
      {/* Render alignment guides */}
      {alignmentGuides.horizontal.map((guide, index) => (
        <AlignmentGuide
          key={`h-${index}`}
          orientation="horizontal"
          position={guide.y}
          start={guide.start}
          end={guide.end}
          transform={transform}
        />
      ))}
      
      {alignmentGuides.vertical.map((guide, index) => (
        <AlignmentGuide
          key={`v-${index}`}
          orientation="vertical"
          position={guide.x}
          start={guide.start}
          end={guide.end}
          transform={transform}
        />
      ))}
      
      <div 
        className="absolute"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {displayNodes && displayNodes.map(node => (
          <ShapeRenderer
            key={node.id}
            node={node}
            isSelected={node.selected}
            activeTool={activeTool}
            onSelect={selectNode}
            onResize={handleResizeNode}
            onConnectionPointClick={handleConnectionPointClick}
            hoveredConnectionPoint={hoveredConnectionPoint}
            selectedLineEndpoint={selectedLineEndpoint}
            onTextChange={handleTextChange}
            onEmptyText={handleEmptyTextShape}
          />
        ))}
        
        {lineInProgress && (
          <LineInProgress 
            lineInProgress={lineInProgress}
          />
        )}
      </div>
      <IconSheet />
      <ExamplesSheet />
    </div>
  );
};

export default Canvas; 