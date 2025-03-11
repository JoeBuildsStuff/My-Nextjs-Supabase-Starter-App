import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Toolbar from '../ui/Toolbar';
import * as canvasStoreModule from '../../lib/store/canvas-store';
import { CanvasState } from '../../lib/store/canvas-store';
import '@testing-library/jest-dom';

// Create a mock implementation of the store
const mockCanvasStore = {
  transform: { zoom: 1, x: 0, y: 0 },
  activeTool: 'select',
  setActiveTool: jest.fn(),
  createShapeAtPosition: jest.fn(),
};

// Mock the useCanvasStore hook
jest.spyOn(canvasStoreModule, 'useCanvasStore').mockImplementation((selector) => {
  if (typeof selector === 'function') {
    return selector(mockCanvasStore as unknown as CanvasState);
  }
  return mockCanvasStore as unknown as CanvasState;
});

// Mock the getState and setState methods
type MockedStore = typeof canvasStoreModule.useCanvasStore & {
  getState: () => Partial<CanvasState>;
  setState: (fn: (state: Partial<CanvasState>) => void) => void;
};

(canvasStoreModule.useCanvasStore as MockedStore).getState = jest.fn().mockReturnValue(mockCanvasStore);
(canvasStoreModule.useCanvasStore as MockedStore).setState = jest.fn();

// Mock window.innerWidth for consistent testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('Toolbar', () => {
  beforeEach(() => {
    // Reset all mock functions
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    cleanup();
  });

  it('renders all tool buttons', () => {
    render(<Toolbar />);
    
    // Check if the toolbar is rendered
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    
    // Check if all tool buttons are rendered
    expect(screen.getByTestId('tool-hand')).toBeInTheDocument();
    expect(screen.getByTestId('tool-select')).toBeInTheDocument();
    expect(screen.getByTestId('tool-rectangle')).toBeInTheDocument();
    expect(screen.getByTestId('tool-triangle')).toBeInTheDocument();
    expect(screen.getByTestId('tool-diamond')).toBeInTheDocument();
    expect(screen.getByTestId('tool-circle')).toBeInTheDocument();
    expect(screen.getByTestId('tool-cylinder')).toBeInTheDocument();
    expect(screen.getByTestId('tool-arrow')).toBeInTheDocument();
    expect(screen.getByTestId('tool-line')).toBeInTheDocument();
    expect(screen.getByTestId('tool-pen')).toBeInTheDocument();
    expect(screen.getByTestId('tool-text')).toBeInTheDocument();
    expect(screen.getByTestId('tool-eraser')).toBeInTheDocument();
  });

  it('calls setActiveTool when a tool button is clicked', () => {
    render(<Toolbar />);
    
    // Click the rectangle tool button
    fireEvent.click(screen.getByTestId('tool-rectangle'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('rectangle');
  });

  it('creates a rectangle shape when the rectangle tool button is clicked', () => {
    render(<Toolbar />);
    
    // Click the rectangle tool button
    fireEvent.click(screen.getByTestId('tool-rectangle'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('rectangle');
    
    // Check if createShapeAtPosition was called with the correct parameters
    expect(mockCanvasStore.createShapeAtPosition).toHaveBeenCalledWith('rectangle', expect.any(Number), expect.any(Number));
  });

  it('creates a triangle shape when the triangle tool button is clicked', () => {
    render(<Toolbar />);
    
    // Click the triangle tool button
    fireEvent.click(screen.getByTestId('tool-triangle'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('triangle');
    
    // Check if createShapeAtPosition was called with the correct parameters
    expect(mockCanvasStore.createShapeAtPosition).toHaveBeenCalledWith('triangle', expect.any(Number), expect.any(Number));
  });

  it('creates a diamond shape when the diamond tool button is clicked', () => {
    render(<Toolbar />);
    
    // Click the diamond tool button
    fireEvent.click(screen.getByTestId('tool-diamond'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('diamond');
    
    // Check if createShapeAtPosition was called with the correct parameters
    expect(mockCanvasStore.createShapeAtPosition).toHaveBeenCalledWith('diamond', expect.any(Number), expect.any(Number));
  });

  it('creates a circle shape when the circle tool button is clicked', () => {
    render(<Toolbar />);
    
    // Click the circle tool button
    fireEvent.click(screen.getByTestId('tool-circle'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('circle');
    
    // Check if createShapeAtPosition was called with the correct parameters
    expect(mockCanvasStore.createShapeAtPosition).toHaveBeenCalledWith('circle', expect.any(Number), expect.any(Number));
  });

  it('creates a cylinder shape when the cylinder tool button is clicked', () => {
    render(<Toolbar />);
    
    // Click the cylinder tool button
    fireEvent.click(screen.getByTestId('tool-cylinder'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('cylinder');
    
    // Check if createShapeAtPosition was called with the correct parameters
    expect(mockCanvasStore.createShapeAtPosition).toHaveBeenCalledWith('cylinder', expect.any(Number), expect.any(Number));
  });

  it('does not create a shape when a non-shape tool button is clicked', () => {
    render(<Toolbar />);
    
    // Click the hand tool button
    fireEvent.click(screen.getByTestId('tool-hand'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('hand');
    
    // Check if createShapeAtPosition was not called
    expect(mockCanvasStore.createShapeAtPosition).not.toHaveBeenCalled();
  });

  // Specific test for the line tool
  it('sets the line tool as active but does not create a shape when clicked', () => {
    render(<Toolbar />);
    
    // Click the line tool button
    fireEvent.click(screen.getByTestId('tool-line'));
    
    // Check if setActiveTool was called with the correct tool type
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('line');
    
    // Check that createShapeAtPosition was not called since line is not a shape tool
    expect(mockCanvasStore.createShapeAtPosition).not.toHaveBeenCalled();
  });

  // Compare behavior of line tool vs shape tools
  it('behaves differently than shape tools when selected', () => {
    render(<Toolbar />);
    
    // First test a shape tool (rectangle)
    fireEvent.click(screen.getByTestId('tool-rectangle'));
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('rectangle');
    expect(mockCanvasStore.createShapeAtPosition).toHaveBeenCalledWith('rectangle', expect.any(Number), expect.any(Number));
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Now test the line tool
    fireEvent.click(screen.getByTestId('tool-line'));
    expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith('line');
    expect(mockCanvasStore.createShapeAtPosition).not.toHaveBeenCalled();
    
    // This verifies that the line tool is treated differently from shape tools
    // Line tools require user interaction to draw lines between points
    // while shape tools automatically create shapes at a predetermined position
  });

  // Test all non-shape tools to ensure they don't create shapes
  it('does not create shapes when non-shape tools are clicked', () => {
    render(<Toolbar />);
    
    // Test all non-shape tools
    const nonShapeTools = [
      { testId: 'tool-hand', toolType: 'hand' },
      { testId: 'tool-select', toolType: 'select' },
      { testId: 'tool-arrow', toolType: 'arrow' },
      { testId: 'tool-line', toolType: 'line' },
      { testId: 'tool-pen', toolType: 'pen' },
      { testId: 'tool-text', toolType: 'text' },
      { testId: 'tool-eraser', toolType: 'eraser' }
    ];
    
    for (const tool of nonShapeTools) {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Click the tool button
      fireEvent.click(screen.getByTestId(tool.testId));
      
      // Check if setActiveTool was called with the correct tool type
      expect(mockCanvasStore.setActiveTool).toHaveBeenCalledWith(tool.toolType);
      
      // Check if createShapeAtPosition was not called
      expect(mockCanvasStore.createShapeAtPosition).not.toHaveBeenCalled();
    }
  });

  // Test that shapes are created at the correct position based on canvas transform
  it('calculates correct position for shapes based on canvas transform', () => {
    // Test different transform values
    const testCases = [
      { zoom: 1, x: 0, y: 0 },
      { zoom: 2, x: 100, y: 50 },
      { zoom: 0.5, x: -200, y: -100 }
    ];
    
    for (const transform of testCases) {
      // Update the mock store with the current transform
      mockCanvasStore.transform = transform;
      
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Render the toolbar (and clean up previous render)
      cleanup();
      render(<Toolbar />);
      
      // Click the rectangle tool button
      fireEvent.click(screen.getByTestId('tool-rectangle'));
      
      // Calculate the expected position
      const toolbarHeight = 100; // Approximate height of toolbar + margin
      const centerX = window.innerWidth / 3; // 1024 / 3 = 341.33
      const expectedX = (centerX - transform.x) / transform.zoom;
      const expectedY = (toolbarHeight - transform.y) / transform.zoom;
      
      // Check if createShapeAtPosition was called with the correct parameters
      expect(mockCanvasStore.createShapeAtPosition).toHaveBeenCalledWith('rectangle', expectedX, expectedY);
    }
  });
}); 