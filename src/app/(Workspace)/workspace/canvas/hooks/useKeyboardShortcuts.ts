import { useEffect, useRef } from 'react';
import { useCanvasStore, Node, MarkerShape } from '../lib/store/canvas-store';
import { useCanvasMouse } from '../hooks/useCanvasMouse';

export function useKeyboardShortcuts(copyCanvasToClipboard: () => void) {
    const canvasRef = useRef<HTMLDivElement>(null);
    
    const { 
        gridSize, 
        snapToGrid,
        updateNodePosition,
        selectMultipleNodes,
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
    setIsShiftPressed,
  } = useCanvasMouse(canvasRef);

  // Get nodes from the store for use in keyboard shortcuts
  const getNodesFromStore = () => useCanvasStore.getState().nodes;
  
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
          const nodes = getNodesFromStore();
          const selectedNodes = nodes.filter((node: Node) => node.selected);
          
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
            selectedNodes.forEach((node: Node) => {
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
        const nodes = getNodesFromStore();
        const allNodeIds = nodes.map((node: Node) => node.id);
        
        // Select all nodes
        selectMultipleNodes(allNodeIds);
      } else if (e.key === 'g' && (e.metaKey || e.ctrlKey) && !e.shiftKey && !isEditingText) {
        // Handle Cmd+G / Ctrl+G to toggle grid
        e.preventDefault();
        setSnapToGrid(!snapToGrid);
      }
      
      // Shortcuts for line markers - only when a line is selected
      const nodes = getNodesFromStore();
      const selectedLine = nodes.find((node: Node) => 
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
    setIsShiftPressed,
    gridSize,
    selectMultipleNodes
  ]);

  

  return {
    // Any exposed methods or state if needed
  };
}