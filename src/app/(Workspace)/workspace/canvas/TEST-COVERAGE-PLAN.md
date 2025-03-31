# Canvas Module Test Coverage Plan

This document outlines the testing strategy for ensuring the Canvas component refactoring maintains existing functionality without introducing regressions.

## Current Test Coverage Assessment

Based on a review of the existing codebase, we have identified the following test coverage:

| Component | Test Coverage | Files |
|-----------|--------------|-------|
| Toolbar | Good | `Toolbar.test.tsx` |
| Line Resize Box | Partial | `LineResizeBox.test.tsx` |
| Canvas | Missing | No tests found |
| Canvas Store | Missing | No tests found |
| Utility Functions | Missing | No tests found |
| UI Controls | Missing | No tests found |

### Coverage Gaps

The current test coverage has significant gaps that need to be addressed before proceeding with the refactoring:

1. No tests for the main Canvas component
2. No tests for the canvas-store state management
3. Lack of integration tests for key user flows
4. Missing tests for utility functions and helpers
5. No tests for most UI control components

## Testing Strategy

To ensure comprehensive coverage, we will implement the following testing strategy:

### 1. Unit Tests

Create or expand unit tests for all components and functions:

- **Canvas Component**: Basic rendering, event handling, props validation
- **Canvas Store**: State initialization, actions, reducers, and selectors
- **UI Components**: Rendering, user interactions, state changes
- **Utility Functions**: Input/output verification, edge cases, error handling

### 2. Integration Tests

Test interactions between components:

- Canvas + Store interaction
- Tool selection + drawing operations
- Selection + manipulation operations
- Line drawing + connection points

### 3. User Flow Tests

Test complete user flows:

- Create shapes and connect them with lines
- Move and resize shapes, ensuring connected lines update
- Create multi-segment lines with connection points
- Group and ungroup elements
- Undo/redo operations
- Export/import canvas state

### 4. Visual Regression Tests

Consider adding visual regression tests for:

- Shape rendering
- Line styles and markers
- Connection points
- Selection and resize handles
- Grid and alignment guides

## Priority Test Implementation

We've implemented the following high-priority tests to address the most critical coverage gaps:

1. `Canvas.test.tsx` - Tests for the main Canvas component
2. `canvas-store.test.ts` - Tests for the state management store

### Canvas Component Tests

The `Canvas.test.tsx` file includes tests for:

- Basic rendering
- Event handling (mouse, keyboard)
- Tool interactions
- Selection mechanisms
- Node manipulation
- Line drawing

### Canvas Store Tests

The `canvas-store.test.ts` file includes tests for:

- Store initialization
- Node creation and manipulation
- Line drawing operations
- Selection operations
- History management (undo/redo)
- View controls (pan, zoom)
- Alignment and grouping

## Additional Tests Needed

The following additional tests should be implemented before proceeding with the refactoring:

### High Priority

1. **Connection Handling Tests**
   - Test connection point calculations
   - Test line anchoring to shapes
   - Test connection updates when shapes move

2. **Shape Specific Tests**
   - Test each shape type rendering
   - Test shape-specific behavior and interactions

3. **Keyboard Interaction Tests**
   - Test keyboard shortcuts
   - Test accessibility features

### Medium Priority

1. **Tool-specific Tests**
   - Individual tests for each drawing tool
   - Tool state management

2. **UI Control Tests**
   - Tests for each control component (color picker, alignment controls, etc.)
   - Tests for control interactions

3. **Performance Tests**
   - Large canvas rendering
   - Many nodes/connections

### Low Priority

1. **Edge Case Tests**
   - Browser-specific behavior
   - Touch interactions
   - Unusual input sequences

2. **Error Handling Tests**
   - Invalid input handling
   - Error recovery

## Test Implementation Plan

| Week | Tests to Implement | Expected Output |
|------|---------------------|----------------|
| Week 1 | Expand Canvas.test.tsx with tests for connection handling | Improved Canvas component test coverage |
| Week 1 | Create ShapeRenderer.test.tsx | Tests for shape-specific rendering |
| Week 2 | Create ConnectionPoints.test.tsx | Tests for connection point behavior |
| Week 2 | Create keyboard-interactions.test.tsx | Tests for keyboard shortcuts |
| Week 3 | Create tests for additional UI components | Coverage for remaining UI controls |
| Week 3 | Implement user flow tests | Integration tests for key workflows |

## Tools and Setup

For implementing these tests, we'll use:

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **jest-dom**: DOM matchers
- **Mock Service Worker (MSW)**: API mocking (if needed)

## Test Environment Setup

```tsx
// Common test setup
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as canvasStoreModule from '../lib/store/canvas-store';
import { CanvasState } from '../lib/store/canvas-store';

// Mock the canvas store
const mockCanvasStore = {
  // Initial state and mock functions
};

// Mock the useCanvasStore hook
jest.spyOn(canvasStoreModule, 'useCanvasStore').mockImplementation((selector) => {
  if (typeof selector === 'function') {
    return selector(mockCanvasStore as unknown as CanvasState);
  }
  return mockCanvasStore as unknown as CanvasState;
});
```

## Measuring Test Coverage

We'll measure test coverage using Jest's coverage report:

```bash
pnpm test -- --coverage
```

### Coverage Targets

| Category | Current | Target |
|----------|---------|--------|
| Statements | ~20% | >80% |
| Branches | ~15% | >75% |
| Functions | ~25% | >85% |
| Lines | ~20% | >80% |

## Continuous Integration

All tests should be run as part of the CI pipeline to ensure no regressions are introduced during the refactoring.

## Conclusion

This testing plan provides a structured approach to ensure the Canvas component refactoring maintains functionality while improving code quality. By implementing these tests before starting the refactoring, we establish a safety net that will catch regressions and guide the refactoring process. 