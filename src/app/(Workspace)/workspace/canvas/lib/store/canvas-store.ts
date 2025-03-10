import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Define the types for our canvas state
export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  dimensions?: { width: number; height: number };
  style?: Record<string, unknown>;
  selected?: boolean;
  dragHandle?: string;
  parentId?: string; // For grouping/nesting
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string; // straight, bezier, etc.
  style?: Record<string, unknown>;
  label?: string | React.ReactNode;
  selected?: boolean;
  animated?: boolean;
  points?: Array<{ x: number; y: number }>; // For custom paths
}

export type ToolType = 
  | 'select' 
  | 'hand' 
  | 'rectangle' 
  | 'triangle'
  | 'diamond' 
  | 'circle' 
  | 'arrow' 
  | 'line' 
  | 'pen' 
  | 'text' 
  | 'eraser'
  | 'lock';

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedElements: Array<Node | Edge>;
  transform: { x: number; y: number; zoom: number };
  activeTool: ToolType;
  gridSize: number;
  snapToGrid: boolean;
  strokeColor: string;
  fillColor: string;
  defaultShade: string;
  borderRadius: number;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  presentationMode: boolean;
  
  // History tracking
  history: Array<{
    nodes: Node[];
    edges: Edge[];
  }>;
  historyIndex: number;
  
  // Actions
  setTransform: (transform: Partial<{ x: number; y: number; zoom: number }>) => void;
  setActiveTool: (tool: ToolType) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setDefaultShade: (shade: string) => void;
  setBorderRadius: (radius: number) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeStyle: (style: 'solid' | 'dashed' | 'dotted') => void;
  updateSelectedNodeStyles: () => void;
  deselectAllNodes: () => void;
  selectMultipleNodes: (nodeIds: string[]) => void;
  moveSelectedToFront: () => void;
  moveSelectedToBack: () => void;
  moveSelectedForward: () => void;
  moveSelectedBackward: () => void;
  duplicateSelectedNodes: () => void;
  deleteSelectedNodes: () => void;
  togglePresentationMode: () => void;
  
  // History actions
  pushToHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Group actions
  groupSelectedNodes: () => void;
  ungroupSelectedNodes: () => void;
  
  // Alignment actions
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  distributeHorizontally: () => void;
  distributeVertically: () => void;
  
  // Viewport actions
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  panCanvas: (dx: number, dy: number) => void;
  
  // Node actions
  addNode: (node: Node) => void;
  selectNode: (nodeId: string) => void;
  createShapeAtPosition: (type: string, x: number, y: number) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  updateNodeDimensions: (nodeId: string, width: number, height: number) => void;
}

// Helper function to convert Tailwind color names to CSS color values
const getTailwindColor = (colorName: string): string => {
  // Special case for "none" color
  if (colorName === "none") {
    return "transparent";
  }

  // Handle basic colors
  if (colorName === "black") return "#000000"; // Pure black (equivalent to black-950)
  if (colorName === "white") return "#FFFFFF"; // Pure white (equivalent to white-100)

  // Handle color with shade (e.g., "red-500")
  const parts = colorName.split('-');
  if (parts.length === 2) {
    const [colorBase, shade] = parts;
    
    // Handle black shades (black-100 is lightest, black-950 is darkest)
    if (colorBase === 'black') {
      const blackShades: Record<string, string> = {
        '100': '#e6e6e6', // Very light gray (90% white)
        '200': '#cccccc', // Light gray (80% white)
        '300': '#b3b3b3', // (70% white)
        '400': '#999999', // (60% white)
        '500': '#808080', // Medium gray (50% white)
        '600': '#666666', // (40% white)
        '700': '#4d4d4d', // (30% white)
        '800': '#333333', // (20% white)
        '900': '#1a1a1a', // Very dark gray (10% white)
        '950': '#000000', // Pure black
      };
      return blackShades[shade] || '#000000';
    }
    
    // Handle white shades (white-100 is lightest, white-950 is darkest)
    if (colorBase === 'white') {
      const whiteShades: Record<string, string> = {
        '100': '#ffffff', // Pure white
        '200': '#fafafa', // (98% white)
        '300': '#f5f5f5', // (96% white)
        '400': '#f0f0f0', // (94% white)
        '500': '#ebebeb', // (92% white)
        '600': '#e0e0e0', // (88% white)
        '700': '#d6d6d6', // (84% white)
        '800': '#cccccc', // (80% white)
        '900': '#bfbfbf', // (75% white)
        '950': '#b3b3b3', // Light gray (70% white)
      };
      return whiteShades[shade] || '#ffffff';
    }
    
    // Tailwind color hex values for all shades
    const colorShades: Record<string, Record<string, string>> = {
      slate: {
        '100': '#f1f5f9',
        '200': '#e2e8f0',
        '300': '#cbd5e1',
        '400': '#94a3b8',
        '500': '#64748b',
        '600': '#475569',
        '700': '#334155',
        '800': '#1e293b',
        '900': '#0f172a',
        '950': '#020617',
      },
      gray: {
        '100': '#f3f4f6',
        '200': '#e5e7eb',
        '300': '#d1d5db',
        '400': '#9ca3af',
        '500': '#6b7280',
        '600': '#4b5563',
        '700': '#374151',
        '800': '#1f2937',
        '900': '#111827',
        '950': '#030712',
      },
      zinc: {
        '100': '#f4f4f5',
        '200': '#e4e4e7',
        '300': '#d4d4d8',
        '400': '#a1a1aa',
        '500': '#71717a',
        '600': '#52525b',
        '700': '#3f3f46',
        '800': '#27272a',
        '900': '#18181b',
        '950': '#09090b',
      },
      neutral: {
        '100': '#f5f5f5',
        '200': '#e5e5e5',
        '300': '#d4d4d4',
        '400': '#a3a3a3',
        '500': '#737373',
        '600': '#525252',
        '700': '#404040',
        '800': '#262626',
        '900': '#171717',
        '950': '#0a0a0a',
      },
      stone: {
        '100': '#f5f5f4',
        '200': '#e7e5e4',
        '300': '#d6d3d1',
        '400': '#a8a29e',
        '500': '#78716c',
        '600': '#57534e',
        '700': '#44403c',
        '800': '#292524',
        '900': '#1c1917',
        '950': '#0c0a09',
      },
      red: {
        '100': '#fee2e2',
        '200': '#fecaca',
        '300': '#fca5a5',
        '400': '#f87171',
        '500': '#ef4444',
        '600': '#dc2626',
        '700': '#b91c1c',
        '800': '#991b1b',
        '900': '#7f1d1d',
        '950': '#450a0a',
      },
      orange: {
        '100': '#ffedd5',
        '200': '#fed7aa',
        '300': '#fdba74',
        '400': '#fb923c',
        '500': '#f97316',
        '600': '#ea580c',
        '700': '#c2410c',
        '800': '#9a3412',
        '900': '#7c2d12',
        '950': '#431407',
      },
      amber: {
        '100': '#fef3c7',
        '200': '#fde68a',
        '300': '#fcd34d',
        '400': '#fbbf24',
        '500': '#f59e0b',
        '600': '#d97706',
        '700': '#b45309',
        '800': '#92400e',
        '900': '#78350f',
        '950': '#451a03',
      },
      yellow: {
        '100': '#fef9c3',
        '200': '#fef08a',
        '300': '#fde047',
        '400': '#facc15',
        '500': '#eab308',
        '600': '#ca8a04',
        '700': '#a16207',
        '800': '#854d0e',
        '900': '#713f12',
        '950': '#422006',
      },
      lime: {
        '100': '#ecfccb',
        '200': '#d9f99d',
        '300': '#bef264',
        '400': '#a3e635',
        '500': '#84cc16',
        '600': '#65a30d',
        '700': '#4d7c0f',
        '800': '#3f6212',
        '900': '#365314',
        '950': '#1a2e05',
      },
      green: {
        '100': '#dcfce7',
        '200': '#bbf7d0',
        '300': '#86efac',
        '400': '#4ade80',
        '500': '#22c55e',
        '600': '#16a34a',
        '700': '#15803d',
        '800': '#166534',
        '900': '#14532d',
        '950': '#052e16',
      },
      emerald: {
        '100': '#d1fae5',
        '200': '#a7f3d0',
        '300': '#6ee7b7',
        '400': '#34d399',
        '500': '#10b981',
        '600': '#059669',
        '700': '#047857',
        '800': '#065f46',
        '900': '#064e3b',
        '950': '#022c22',
      },
      teal: {
        '100': '#ccfbf1',
        '200': '#99f6e4',
        '300': '#5eead4',
        '400': '#2dd4bf',
        '500': '#14b8a6',
        '600': '#0d9488',
        '700': '#0f766e',
        '800': '#115e59',
        '900': '#134e4a',
        '950': '#042f2e',
      },
      cyan: {
        '100': '#cffafe',
        '200': '#a5f3fc',
        '300': '#67e8f9',
        '400': '#22d3ee',
        '500': '#06b6d4',
        '600': '#0891b2',
        '700': '#0e7490',
        '800': '#155e75',
        '900': '#164e63',
        '950': '#083344',
      },
      sky: {
        '100': '#e0f2fe',
        '200': '#bae6fd',
        '300': '#7dd3fc',
        '400': '#38bdf8',
        '500': '#0ea5e9',
        '600': '#0284c7',
        '700': '#0369a1',
        '800': '#075985',
        '900': '#0c4a6e',
        '950': '#082f49',
      },
      blue: {
        '100': '#dbeafe',
        '200': '#bfdbfe',
        '300': '#93c5fd',
        '400': '#60a5fa',
        '500': '#3b82f6',
        '600': '#2563eb',
        '700': '#1d4ed8',
        '800': '#1e40af',
        '900': '#1e3a8a',
        '950': '#172554',
      },
      indigo: {
        '100': '#e0e7ff',
        '200': '#c7d2fe',
        '300': '#a5b4fc',
        '400': '#818cf8',
        '500': '#6366f1',
        '600': '#4f46e5',
        '700': '#4338ca',
        '800': '#3730a3',
        '900': '#312e81',
        '950': '#1e1b4b',
      },
      violet: {
        '100': '#ede9fe',
        '200': '#ddd6fe',
        '300': '#c4b5fd',
        '400': '#a78bfa',
        '500': '#8b5cf6',
        '600': '#7c3aed',
        '700': '#6d28d9',
        '800': '#5b21b6',
        '900': '#4c1d95',
        '950': '#2e1065',
      },
      purple: {
        '100': '#f3e8ff',
        '200': '#e9d5ff',
        '300': '#d8b4fe',
        '400': '#c084fc',
        '500': '#a855f7',
        '600': '#9333ea',
        '700': '#7e22ce',
        '800': '#6b21a8',
        '900': '#581c87',
        '950': '#3b0764',
      },
      fuchsia: {
        '100': '#fae8ff',
        '200': '#f5d0fe',
        '300': '#f0abfc',
        '400': '#e879f9',
        '500': '#d946ef',
        '600': '#c026d3',
        '700': '#a21caf',
        '800': '#86198f',
        '900': '#701a75',
        '950': '#4a044e',
      },
      pink: {
        '100': '#fce7f3',
        '200': '#fbcfe8',
        '300': '#f9a8d4',
        '400': '#f472b6',
        '500': '#ec4899',
        '600': '#db2777',
        '700': '#be185d',
        '800': '#9d174d',
        '900': '#831843',
        '950': '#500724',
      },
      rose: {
        '100': '#ffe4e6',
        '200': '#fecdd3',
        '300': '#fda4af',
        '400': '#fb7185',
        '500': '#f43f5e',
        '600': '#e11d48',
        '700': '#be123c',
        '800': '#9f1239',
        '900': '#881337',
        '950': '#4c0519',
      },
    };

    return colorShades[colorBase]?.[shade] || colorName;
  }

  // For backward compatibility with old format (e.g., "red-500" stored as a single string)
  const legacyColorMap: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'slate-500': '#64748b',
    'gray-500': '#6b7280',
    'zinc-500': '#71717a',
    'neutral-500': '#737373',
    'stone-500': '#78716c',
    'red-500': '#ef4444',
    'orange-500': '#f97316',
    'amber-500': '#f59e0b',
    'yellow-500': '#eab308',
    'lime-500': '#84cc16',
    'green-500': '#22c55e',
    'emerald-500': '#10b981',
    'teal-500': '#14b8a6',
    'cyan-500': '#06b6d4',
    'sky-500': '#0ea5e9',
    'blue-500': '#3b82f6',
    'indigo-500': '#6366f1',
    'violet-500': '#8b5cf6',
    'purple-500': '#a855f7',
    'fuchsia-500': '#d946ef',
    'pink-500': '#ec4899',
    'rose-500': '#f43f5e',
  };

  return legacyColorMap[colorName] || colorName;
};

// Helper function to convert CSS color values back to Tailwind color names
const getTailwindColorName = (hexColor: string): string => {
  // Special case for transparent color
  if (hexColor === "transparent") {
    return "none";
  }

  // Convert hex to lowercase for case-insensitive comparison
  const lowerHex = hexColor.toLowerCase();
  
  // Black shades
  const blackShades: Record<string, string> = {
    '#e6e6e6': 'black-100',
    '#cccccc': 'black-200',
    '#b3b3b3': 'black-300',
    '#999999': 'black-400',
    '#808080': 'black-500',
    '#666666': 'black-600',
    '#4d4d4d': 'black-700',
    '#333333': 'black-800',
    '#1a1a1a': 'black-900',
    '#000000': 'black-950',
  };
  
  // White shades
  const whiteShades: Record<string, string> = {
    '#ffffff': 'white-100',
    '#fafafa': 'white-200',
    '#f5f5f5': 'white-300',
    '#f0f0f0': 'white-400',
    '#ebebeb': 'white-500',
    '#e0e0e0': 'white-600',
    '#d6d6d6': 'white-700',
    '#cccccc': 'white-800',
    '#bfbfbf': 'white-900',
    '#b3b3b3': 'white-950',
  };
  
  // Check for black and white shades first
  if (blackShades[lowerHex]) {
    return blackShades[lowerHex];
  }
  
  if (whiteShades[lowerHex]) {
    return whiteShades[lowerHex];
  }
  
  // All Tailwind colors with their hex values
  const allColorMap: Record<string, string> = {
    // Basic colors (non-shaded)
    '#000000': 'black',
    '#ffffff': 'white',
    
    // Slate
    '#f1f5f9': 'slate-100',
    '#e2e8f0': 'slate-200',
    '#cbd5e1': 'slate-300',
    '#94a3b8': 'slate-400',
    '#64748b': 'slate-500',
    '#475569': 'slate-600',
    '#334155': 'slate-700',
    '#1e293b': 'slate-800',
    '#0f172a': 'slate-900',
    '#020617': 'slate-950',
    
    // Gray
    '#f3f4f6': 'gray-100',
    '#e5e7eb': 'gray-200',
    '#d1d5db': 'gray-300',
    '#9ca3af': 'gray-400',
    '#6b7280': 'gray-500',
    '#4b5563': 'gray-600',
    '#374151': 'gray-700',
    '#1f2937': 'gray-800',
    '#111827': 'gray-900',
    '#030712': 'gray-950',
    
    // Zinc
    '#f4f4f5': 'zinc-100',
    '#e4e4e7': 'zinc-200',
    '#d4d4d8': 'zinc-300',
    '#a1a1aa': 'zinc-400',
    '#71717a': 'zinc-500',
    '#52525b': 'zinc-600',
    '#3f3f46': 'zinc-700',
    '#27272a': 'zinc-800',
    '#18181b': 'zinc-900',
    '#09090b': 'zinc-950',
    
    // Neutral
    '#f5f5f5': 'neutral-100',
    '#e5e5e5': 'neutral-200',
    '#d4d4d4': 'neutral-300',
    '#a3a3a3': 'neutral-400',
    '#737373': 'neutral-500',
    '#525252': 'neutral-600',
    '#404040': 'neutral-700',
    '#262626': 'neutral-800',
    '#171717': 'neutral-900',
    '#0a0a0a': 'neutral-950',
    
    // Stone
    '#f5f5f4': 'stone-100',
    '#e7e5e4': 'stone-200',
    '#d6d3d1': 'stone-300',
    '#a8a29e': 'stone-400',
    '#78716c': 'stone-500',
    '#57534e': 'stone-600',
    '#44403c': 'stone-700',
    '#292524': 'stone-800',
    '#1c1917': 'stone-900',
    '#0c0a09': 'stone-950',
    
    // Red
    '#fee2e2': 'red-100',
    '#fecaca': 'red-200',
    '#fca5a5': 'red-300',
    '#f87171': 'red-400',
    '#ef4444': 'red-500',
    '#dc2626': 'red-600',
    '#b91c1c': 'red-700',
    '#991b1b': 'red-800',
    '#7f1d1d': 'red-900',
    '#450a0a': 'red-950',
    
    // Orange
    '#ffedd5': 'orange-100',
    '#fed7aa': 'orange-200',
    '#fdba74': 'orange-300',
    '#fb923c': 'orange-400',
    '#f97316': 'orange-500',
    '#ea580c': 'orange-600',
    '#c2410c': 'orange-700',
    '#9a3412': 'orange-800',
    '#7c2d12': 'orange-900',
    '#431407': 'orange-950',
    
    // Amber
    '#fef3c7': 'amber-100',
    '#fde68a': 'amber-200',
    '#fcd34d': 'amber-300',
    '#fbbf24': 'amber-400',
    '#f59e0b': 'amber-500',
    '#d97706': 'amber-600',
    '#b45309': 'amber-700',
    '#92400e': 'amber-800',
    '#78350f': 'amber-900',
    '#451a03': 'amber-950',
    
    // Yellow
    '#fef9c3': 'yellow-100',
    '#fef08a': 'yellow-200',
    '#fde047': 'yellow-300',
    '#facc15': 'yellow-400',
    '#eab308': 'yellow-500',
    '#ca8a04': 'yellow-600',
    '#a16207': 'yellow-700',
    '#854d0e': 'yellow-800',
    '#713f12': 'yellow-900',
    '#422006': 'yellow-950',
    
    // Lime
    '#ecfccb': 'lime-100',
    '#d9f99d': 'lime-200',
    '#bef264': 'lime-300',
    '#a3e635': 'lime-400',
    '#84cc16': 'lime-500',
    '#65a30d': 'lime-600',
    '#4d7c0f': 'lime-700',
    '#3f6212': 'lime-800',
    '#365314': 'lime-900',
    '#1a2e05': 'lime-950',
    
    // Green
    '#dcfce7': 'green-100',
    '#bbf7d0': 'green-200',
    '#86efac': 'green-300',
    '#4ade80': 'green-400',
    '#22c55e': 'green-500',
    '#16a34a': 'green-600',
    '#15803d': 'green-700',
    '#166534': 'green-800',
    '#14532d': 'green-900',
    '#052e16': 'green-950',
    
    // Emerald
    '#d1fae5': 'emerald-100',
    '#a7f3d0': 'emerald-200',
    '#6ee7b7': 'emerald-300',
    '#34d399': 'emerald-400',
    '#10b981': 'emerald-500',
    '#059669': 'emerald-600',
    '#047857': 'emerald-700',
    '#065f46': 'emerald-800',
    '#064e3b': 'emerald-900',
    '#022c22': 'emerald-950',
    
    // Teal
    '#ccfbf1': 'teal-100',
    '#99f6e4': 'teal-200',
    '#5eead4': 'teal-300',
    '#2dd4bf': 'teal-400',
    '#14b8a6': 'teal-500',
    '#0d9488': 'teal-600',
    '#0f766e': 'teal-700',
    '#115e59': 'teal-800',
    '#134e4a': 'teal-900',
    '#042f2e': 'teal-950',
    
    // Cyan
    '#cffafe': 'cyan-100',
    '#a5f3fc': 'cyan-200',
    '#67e8f9': 'cyan-300',
    '#22d3ee': 'cyan-400',
    '#06b6d4': 'cyan-500',
    '#0891b2': 'cyan-600',
    '#0e7490': 'cyan-700',
    '#155e75': 'cyan-800',
    '#164e63': 'cyan-900',
    '#083344': 'cyan-950',
    
    // Sky
    '#e0f2fe': 'sky-100',
    '#bae6fd': 'sky-200',
    '#7dd3fc': 'sky-300',
    '#38bdf8': 'sky-400',
    '#0ea5e9': 'sky-500',
    '#0284c7': 'sky-600',
    '#0369a1': 'sky-700',
    '#075985': 'sky-800',
    '#0c4a6e': 'sky-900',
    '#082f49': 'sky-950',
    
    // Blue
    '#dbeafe': 'blue-100',
    '#bfdbfe': 'blue-200',
    '#93c5fd': 'blue-300',
    '#60a5fa': 'blue-400',
    '#3b82f6': 'blue-500',
    '#2563eb': 'blue-600',
    '#1d4ed8': 'blue-700',
    '#1e40af': 'blue-800',
    '#1e3a8a': 'blue-900',
    '#172554': 'blue-950',
    
    // Indigo
    '#e0e7ff': 'indigo-100',
    '#c7d2fe': 'indigo-200',
    '#a5b4fc': 'indigo-300',
    '#818cf8': 'indigo-400',
    '#6366f1': 'indigo-500',
    '#4f46e5': 'indigo-600',
    '#4338ca': 'indigo-700',
    '#3730a3': 'indigo-800',
    '#312e81': 'indigo-900',
    '#1e1b4b': 'indigo-950',
    
    // Violet
    '#ede9fe': 'violet-100',
    '#ddd6fe': 'violet-200',
    '#c4b5fd': 'violet-300',
    '#a78bfa': 'violet-400',
    '#8b5cf6': 'violet-500',
    '#7c3aed': 'violet-600',
    '#6d28d9': 'violet-700',
    '#5b21b6': 'violet-800',
    '#4c1d95': 'violet-900',
    '#2e1065': 'violet-950',
    
    // Purple
    '#f3e8ff': 'purple-100',
    '#e9d5ff': 'purple-200',
    '#d8b4fe': 'purple-300',
    '#c084fc': 'purple-400',
    '#a855f7': 'purple-500',
    '#9333ea': 'purple-600',
    '#7e22ce': 'purple-700',
    '#6b21a8': 'purple-800',
    '#581c87': 'purple-900',
    '#3b0764': 'purple-950',
    
    // Fuchsia
    '#fae8ff': 'fuchsia-100',
    '#f5d0fe': 'fuchsia-200',
    '#f0abfc': 'fuchsia-300',
    '#e879f9': 'fuchsia-400',
    '#d946ef': 'fuchsia-500',
    '#c026d3': 'fuchsia-600',
    '#a21caf': 'fuchsia-700',
    '#86198f': 'fuchsia-800',
    '#701a75': 'fuchsia-900',
    '#4a044e': 'fuchsia-950',
    
    // Pink
    '#fce7f3': 'pink-100',
    '#fbcfe8': 'pink-200',
    '#f9a8d4': 'pink-300',
    '#f472b6': 'pink-400',
    '#ec4899': 'pink-500',
    '#db2777': 'pink-600',
    '#be185d': 'pink-700',
    '#9d174d': 'pink-800',
    '#831843': 'pink-900',
    '#500724': 'pink-950',
    
    // Rose
    '#ffe4e6': 'rose-100',
    '#fecdd3': 'rose-200',
    '#fda4af': 'rose-300',
    '#fb7185': 'rose-400',
    '#f43f5e': 'rose-500',
    '#e11d48': 'rose-600',
    '#be123c': 'rose-700',
    '#9f1239': 'rose-800',
    '#881337': 'rose-900',
    '#4c0519': 'rose-950',
  };
  
  // Try to find an exact match
  for (const [hex, name] of Object.entries(allColorMap)) {
    if (hex.toLowerCase() === lowerHex) {
      return name;
    }
  }
  
  // If no exact match, return the original hex
  return hexColor;
};

// Create the store with immer middleware for immutable updates
export const useCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    // Initial state
    nodes: [],
    edges: [],
    selectedElements: [],
    transform: { x: 0, y: 0, zoom: 1 },
    activeTool: 'select',
    gridSize: 20,
    snapToGrid: true,
    strokeColor: 'white',
    fillColor: 'none',
    defaultShade: '500',
    borderRadius: 8,
    strokeWidth: 2,
    strokeStyle: 'solid',
    presentationMode: false,
    
    // History tracking
    history: [],
    historyIndex: -1,
    
    // History actions
    pushToHistory: () => 
      set((state) => {
        console.log('Pushing to history, current index:', state.historyIndex, 'history length:', state.history.length);
        
        // Create a deep copy of the current state
        const currentState = {
          nodes: JSON.parse(JSON.stringify(state.nodes)),
          edges: JSON.parse(JSON.stringify(state.edges))
        };
        
        // If we're not at the end of the history, remove future states
        if (state.historyIndex < state.history.length - 1) {
          console.log('Removing future history states');
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        
        // Add the current state to history
        state.history.push(currentState);
        state.historyIndex = state.history.length - 1;
        
        console.log('After push: index:', state.historyIndex, 'history length:', state.history.length);
        
        // Limit history size to prevent memory issues
        if (state.history.length > 50) {
          state.history.shift();
          state.historyIndex--;
          console.log('History limit reached, removed oldest state');
        }
      }),
    
    undo: () => 
      set((state) => {
        console.log('Undo called, current index:', state.historyIndex, 'history length:', state.history.length);
        
        if (state.historyIndex > 0) {
          state.historyIndex--;
          console.log('Undoing to index:', state.historyIndex);
          
          const previousState = state.history[state.historyIndex];
          console.log('Previous state has', previousState.nodes.length, 'nodes');
          
          state.nodes = JSON.parse(JSON.stringify(previousState.nodes));
          state.edges = JSON.parse(JSON.stringify(previousState.edges));
          
          console.log('Undo complete, now at index:', state.historyIndex);
        } else {
          console.log('Cannot undo: already at oldest state');
        }
      }),
    
    redo: () => 
      set((state) => {
        console.log('Redo called, current index:', state.historyIndex, 'history length:', state.history.length);
        
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          console.log('Redoing to index:', state.historyIndex);
          
          const nextState = state.history[state.historyIndex];
          console.log('Next state has', nextState.nodes.length, 'nodes');
          
          state.nodes = JSON.parse(JSON.stringify(nextState.nodes));
          state.edges = JSON.parse(JSON.stringify(nextState.edges));
          
          console.log('Redo complete, now at index:', state.historyIndex);
        } else {
          console.log('Cannot redo: already at newest state');
        }
      }),
    
    // Actions
    setTransform: (newTransform) => 
      set((state) => {
        if (newTransform.x !== undefined) state.transform.x = newTransform.x;
        if (newTransform.y !== undefined) state.transform.y = newTransform.y;
        if (newTransform.zoom !== undefined) state.transform.zoom = newTransform.zoom;
      }),
    
    setActiveTool: (tool) => 
      set((state) => {
        state.activeTool = tool;
      }),
    
    setSnapToGrid: (snap) => 
      set((state) => {
        state.snapToGrid = snap;
      }),
    
    setGridSize: (size) => 
      set((state) => {
        state.gridSize = size;
      }),
    
    setStrokeColor: (color) =>
      set((state) => {
        state.strokeColor = color;
        
        // Directly update selected nodes
        const strokeColorHex = getTailwindColor(color);
        console.log('Setting stroke color to:', strokeColorHex);
        
        let updatedAnyNode = false;
        let shouldPushToHistory = false;
        
        // Check if any node will be updated
        state.nodes.forEach(node => {
          if (node.selected) {
            shouldPushToHistory = true;
          }
        });
        
        // Push to history before making changes
        if (shouldPushToHistory) {
          console.log('Pushing to history before changing stroke color');
          // Create a deep copy of the current state
          const currentState = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
          };
          
          // Add the current state to history
          state.history.push(currentState);
          state.historyIndex = state.history.length - 1;
          
          console.log('After push in setStrokeColor: index:', state.historyIndex, 'history length:', state.history.length);
        }
        
        // Now update the nodes
        state.nodes.forEach(node => {
          if (node.selected) {
            console.log('Updating stroke for node:', node.id);
            
            // If this is a group, only update its children, not the group container
            if (node.data?.isGroup === true) {
              const childNodes = state.nodes.filter(n => n.parentId === node.id);
              childNodes.forEach(childNode => {
                if (!childNode.style) {
                  childNode.style = {};
                }
                childNode.style.borderColor = strokeColorHex;
              });
              updatedAnyNode = true;
            } else {
              // For regular nodes, update as normal
              if (!node.style) {
                node.style = {};
              }
              node.style.borderColor = strokeColorHex;
              updatedAnyNode = true;
            }
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        }
      }),
      
    setFillColor: (color) =>
      set((state) => {
        state.fillColor = color;
        
        // Directly update selected nodes
        const fillColorHex = getTailwindColor(color);
        console.log('Setting fill color to:', fillColorHex);
        
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            // Push current state to history before making changes
            if (!updatedAnyNode) {
              get().pushToHistory();
              updatedAnyNode = true;
            }
            
            console.log('Updating fill for node:', node.id);
            
            // If this is a group, only update its children, not the group container
            if (node.data?.isGroup === true) {
              const childNodes = state.nodes.filter(n => n.parentId === node.id);
              childNodes.forEach(childNode => {
                if (!childNode.style) {
                  childNode.style = {};
                }
                childNode.style.backgroundColor = fillColorHex;
              });
            } else {
              // For regular nodes, update as normal
              if (!node.style) {
                node.style = {};
              }
              node.style.backgroundColor = fillColorHex;
            }
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        }
      }),
      
    setDefaultShade: (shade) =>
      set((state) => {
        state.defaultShade = shade;
      }),
      
    setBorderRadius: (radius) =>
      set((state) => {
        state.borderRadius = radius;
        console.log('Setting border radius to:', radius);
        
        // Update selected nodes with new border radius
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            // Push current state to history before making changes
            if (!updatedAnyNode) {
              get().pushToHistory();
              updatedAnyNode = true;
            }
            
            console.log('Updating border radius for node:', node.id);
            
            // If this is a group, only update its children, not the group container
            if (node.data?.isGroup === true) {
              const childNodes = state.nodes.filter(n => n.parentId === node.id);
              childNodes.forEach(childNode => {
                if (!childNode.style) {
                  childNode.style = {};
                }
                // For circles, maintain the 50% border radius
                if (childNode.type === 'circle') {
                  childNode.style.borderRadius = '50%';
                } else {
                  childNode.style.borderRadius = `${radius}px`;
                }
              });
            } else {
              // For regular nodes, update as normal
              if (!node.style) {
                node.style = {};
              }
              node.style.borderRadius = `${radius}px`;
              console.log('Node style after update:', node.style);
            }
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        } else {
          console.log('No nodes were selected to update border radius');
        }
      }),
      
    setStrokeWidth: (width) =>
      set((state) => {
        state.strokeWidth = width;
        
        // Update selected nodes
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            // Push current state to history before making changes
            if (!updatedAnyNode) {
              get().pushToHistory();
              updatedAnyNode = true;
            }
            
            // If this is a group, only update its children, not the group container
            if (node.data?.isGroup === true) {
              const childNodes = state.nodes.filter(n => n.parentId === node.id);
              childNodes.forEach(childNode => {
                if (!childNode.style) {
                  childNode.style = {};
                }
                childNode.style.borderWidth = width;
              });
            } else {
              // For regular nodes, update as normal
              if (!node.style) {
                node.style = {};
              }
              node.style.borderWidth = width;
            }
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        }
      }),
      
    setStrokeStyle: (style) =>
      set((state) => {
        state.strokeStyle = style;
        
        // Update selected nodes
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            // Push current state to history before making changes
            if (!updatedAnyNode) {
              get().pushToHistory();
              updatedAnyNode = true;
            }
            
            // If this is a group, only update its children, not the group container
            if (node.data?.isGroup === true) {
              const childNodes = state.nodes.filter(n => n.parentId === node.id);
              childNodes.forEach(childNode => {
                if (!childNode.style) {
                  childNode.style = {};
                }
                childNode.style.borderStyle = style;
              });
            } else {
              // For regular nodes, update as normal
              if (!node.style) {
                node.style = {};
              }
              node.style.borderStyle = style;
            }
          }
        });
        
        // Create a new nodes array to trigger a re-render
        if (updatedAnyNode) {
          state.nodes = [...state.nodes];
        }
      }),
      
    updateSelectedNodeStyles: () =>
      set((state) => {
        const strokeColorHex = getTailwindColor(state.strokeColor);
        const fillColorHex = getTailwindColor(state.fillColor);
        
        let updatedAnyNode = false;
        
        state.nodes.forEach(node => {
          if (node.selected) {
            // Push current state to history before making changes
            if (!updatedAnyNode) {
              get().pushToHistory();
              updatedAnyNode = true;
            }
            
            // If this is a group, only update its children, not the group container
            if (node.data?.isGroup === true) {
              const childNodes = state.nodes.filter(n => n.parentId === node.id);
              childNodes.forEach(childNode => {
                if (!childNode.style) {
                  childNode.style = {};
                }
                childNode.style.borderColor = strokeColorHex;
                childNode.style.backgroundColor = fillColorHex;
                
                // For circles, maintain the 50% border radius
                if (childNode.type === 'circle') {
                  childNode.style.borderRadius = '50%';
                } else {
                  childNode.style.borderRadius = `${state.borderRadius}px`;
                }
                
                childNode.style.borderWidth = state.strokeWidth;
                childNode.style.borderStyle = state.strokeStyle;
              });
            } else {
              // For regular nodes, update as normal
              if (!node.style) {
                node.style = {};
              }
              node.style.borderColor = strokeColorHex;
              node.style.backgroundColor = fillColorHex;
              node.style.borderRadius = `${state.borderRadius}px`;
              node.style.borderWidth = state.strokeWidth;
              node.style.borderStyle = state.strokeStyle;
            }
          }
        });
      }),
    
    deselectAllNodes: () =>
      set((state) => {
        state.nodes.forEach(node => {
          node.selected = false;
        });
        state.selectedElements = [];
      }),
      
    selectMultipleNodes: (nodeIds) =>
      set((state) => {
        // Deselect all nodes first
        state.nodes.forEach(node => {
          node.selected = nodeIds.includes(node.id);
        });
        
        // Update selectedElements array
        state.selectedElements = state.nodes.filter(node => nodeIds.includes(node.id));
      }),
    
    moveSelectedToFront: () =>
      set((state) => {
        // Get all selected nodes
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length === 0) return;
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Remove selected nodes from the array
        state.nodes = state.nodes.filter(node => !node.selected);
        
        // Add them back at the end (top)
        state.nodes.push(...selectedNodes);
      }),
      
    moveSelectedToBack: () =>
      set((state) => {
        // Get all selected nodes
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length === 0) return;
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Remove selected nodes from the array
        state.nodes = state.nodes.filter(node => !node.selected);
        
        // Add them at the beginning (bottom)
        state.nodes.unshift(...selectedNodes);
      }),
      
    moveSelectedForward: () =>
      set((state) => {
        // Get indices of selected nodes
        const selectedIndices = state.nodes
          .map((node, index) => node.selected ? index : -1)
          .filter(index => index !== -1);
        
        if (selectedIndices.length === 0) return;
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Process from last to first to avoid index shifting problems
        for (let i = selectedIndices.length - 1; i >= 0; i--) {
          const currentIndex = selectedIndices[i];
          if (currentIndex < state.nodes.length - 1) {
            // Swap with the next node
            [state.nodes[currentIndex], state.nodes[currentIndex + 1]] = 
            [state.nodes[currentIndex + 1], state.nodes[currentIndex]];
          }
        }
      }),
      
    moveSelectedBackward: () =>
      set((state) => {
        // Get indices of selected nodes
        const selectedIndices = state.nodes
          .map((node, index) => node.selected ? index : -1)
          .filter(index => index !== -1);
        
        if (selectedIndices.length === 0) return;
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Process from first to last to avoid index shifting problems
        for (let i = 0; i < selectedIndices.length; i++) {
          const currentIndex = selectedIndices[i];
          if (currentIndex > 0) {
            // Swap with the previous node
            [state.nodes[currentIndex], state.nodes[currentIndex - 1]] = 
            [state.nodes[currentIndex - 1], state.nodes[currentIndex]];
          }
        }
      }),
    
    duplicateSelectedNodes: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length === 0) return;
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Deselect all nodes first
        state.nodes.forEach(node => {
          node.selected = false;
        });
        
        // Create duplicates with new IDs and slightly offset positions
        const duplicates = selectedNodes.map(node => ({
          ...node,
          id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          position: {
            x: node.position.x + 20,
            y: node.position.y + 20
          },
          selected: true
        }));
        
        // Add duplicates to the nodes array
        state.nodes.push(...duplicates);
        
        // Update selected elements
        state.selectedElements = duplicates;
      }),
      
    deleteSelectedNodes: () =>
      set((state) => {
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Remove selected nodes from the array
        state.nodes = state.nodes.filter(node => !node.selected);
        // Clear selected elements
        state.selectedElements = [];
      }),
    
    // Viewport actions
    zoomIn: () => 
      set((state) => {
        // Limit zoom to a maximum of 2 (200%)
        state.transform.zoom = Math.min(state.transform.zoom + 0.1, 2);
      }),
    
    zoomOut: () => 
      set((state) => {
        // Limit zoom to a minimum of 0.1 (10%)
        state.transform.zoom = Math.max(state.transform.zoom - 0.1, 0.1);
      }),
    
    resetView: () => 
      set((state) => {
        state.transform = { x: 0, y: 0, zoom: 1 };
      }),
    
    panCanvas: (dx, dy) => 
      set((state) => {
        state.transform.x += dx;
        state.transform.y += dy;
      }),
    
    // Node actions
    addNode: (node) =>
      set((state) => {
        state.nodes.push(node);
      }),
    
    selectNode: (nodeId) =>
      set((state) => {
        // Deselect all nodes first
        state.nodes.forEach(node => {
          node.selected = false;
        });
        
        // Find and select the target node
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          node.selected = true;
          state.selectedElements = [node];
          
          // Only update the current style settings if this is not a group
          if (!node.data?.isGroup) {
            // Update the current stroke and fill colors based on the selected node
            if (node.style) {
              const borderColor = node.style.borderColor as string;
              const backgroundColor = node.style.backgroundColor as string;
              const borderRadius = node.style.borderRadius as string;
              const borderWidth = node.style.borderWidth as number;
              const borderStyle = node.style.borderStyle as string;
              
              if (borderColor) {
                state.strokeColor = getTailwindColorName(borderColor);
              }
              
              if (backgroundColor) {
                state.fillColor = getTailwindColorName(backgroundColor);
              }
              
              if (borderRadius) {
                // Extract the numeric value from the borderRadius string (e.g., "10px" -> 10)
                const radiusValue = parseInt((borderRadius.match(/\d+/) || ['0'])[0], 10);
                state.borderRadius = radiusValue;
              }
              
              if (borderWidth !== undefined) {
                state.strokeWidth = borderWidth;
              }
              
              if (borderStyle && ['solid', 'dashed', 'dotted'].includes(borderStyle)) {
                state.strokeStyle = borderStyle as 'solid' | 'dashed' | 'dotted';
              }
            }
          }
        }
      }),
      
    createShapeAtPosition: (type, x, y) =>
      set((state) => {
        console.log('createShapeAtPosition called with type:', type, 'at position:', x, y);
        
        // We'll handle history at the end of this function
        // Don't push to history here to avoid double-pushing
        
        // Generate a unique ID for the new node
        const id = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log('Generated node ID:', id);
        
        // Default dimensions for different shape types
        let dimensions = { width: 100, height: 100 };
        if (type === 'line' || type === 'arrow') {
          dimensions = { width: 150, height: 2 };
        }
        
        // Create the new node
        const newNode: Node = {
          id,
          type,
          position: { x, y },
          data: {},
          dimensions,
          selected: true,
          style: {
            backgroundColor: getTailwindColor(state.fillColor),
            borderColor: getTailwindColor(state.strokeColor),
            borderWidth: state.strokeWidth,
            borderRadius: `${state.borderRadius}px`,
            borderStyle: state.strokeStyle,
          }
        };
        
        console.log('Created new node:', newNode);
        
        // Add the node to the canvas
        state.nodes.push(newNode);
        console.log('Total nodes after adding:', state.nodes.length);
        
        // Select the new node
        state.nodes.forEach(node => {
          node.selected = node.id === id;
        });
        
        state.selectedElements = [newNode];
        
        // Switch to select tool after creating a shape
        state.activeTool = 'select';
        console.log('Switched to select tool');
        
        // Push the new state to history
        // We don't call pushToHistory here to avoid double-pushing
        // Instead, we'll manually update the history
        const newState = {
          nodes: JSON.parse(JSON.stringify(state.nodes)),
          edges: JSON.parse(JSON.stringify(state.edges))
        };
        
        // If this is the first node, initialize history with empty state first
        if (state.history.length === 0) {
          state.history.push({
            nodes: [],
            edges: []
          });
          state.historyIndex = 0;
        }
        
        // Add the new state to history
        state.history.push(newState);
        state.historyIndex = state.history.length - 1;
        
        console.log('After shape creation: index:', state.historyIndex, 'history length:', state.history.length);
      }),
      
    updateNodePosition: (nodeId, x, y) =>
      set((state) => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          // Push current state to history before making changes
          if (!state.nodes.some(n => n.selected && n.id !== nodeId)) {
            get().pushToHistory();
          }
          
          // Apply grid snapping if enabled
          if (state.snapToGrid) {
            node.position.x = Math.round(x / state.gridSize) * state.gridSize;
            node.position.y = Math.round(y / state.gridSize) * state.gridSize;
          } else {
            node.position.x = x;
            node.position.y = y;
          }
        }
      }),
      
    updateNodeDimensions: (nodeId, width, height) =>
      set((state) => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node && node.dimensions) {
          // Push current state to history before making changes
          get().pushToHistory();
          
          // Apply grid snapping if enabled
          if (state.snapToGrid) {
            node.dimensions.width = Math.round(width / state.gridSize) * state.gridSize;
            node.dimensions.height = Math.round(height / state.gridSize) * state.gridSize;
          } else {
            node.dimensions.width = width;
            node.dimensions.height = height;
          }
        }
      }),
    
    // Alignment actions
    alignTop: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 1) return; // Need at least 2 nodes to align
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Find the topmost position among selected nodes
        const topPosition = Math.min(...selectedNodes.map(node => node.position.y));
        console.log('Aligning to top position:', topPosition);
        
        // Align all selected nodes to the topmost position
        selectedNodes.forEach(node => {
          node.position.y = topPosition;
        });
      }),
      
    alignMiddle: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 1) return; // Need at least 2 nodes to align
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Calculate the average vertical center of all selected nodes
        const centerY = selectedNodes.reduce((sum, node) => {
          const nodeHeight = node.dimensions?.height || 0;
          return sum + (node.position.y + nodeHeight / 2);
        }, 0) / selectedNodes.length;
        console.log('Aligning to middle position:', centerY);
        
        // Align all selected nodes to the average center
        selectedNodes.forEach(node => {
          const nodeHeight = node.dimensions?.height || 0;
          node.position.y = centerY - nodeHeight / 2;
        });
      }),
      
    alignBottom: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 1) return; // Need at least 2 nodes to align
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Find the bottommost position among selected nodes
        const bottomPosition = Math.max(...selectedNodes.map(node => {
          const nodeHeight = node.dimensions?.height || 0;
          return node.position.y + nodeHeight;
        }));
        console.log('Aligning to bottom position:', bottomPosition);
        
        // Align all selected nodes to the bottommost position
        selectedNodes.forEach(node => {
          const nodeHeight = node.dimensions?.height || 0;
          node.position.y = bottomPosition - nodeHeight;
        });
      }),
      
    alignLeft: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 1) return; // Need at least 2 nodes to align
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Find the leftmost position among selected nodes
        const leftPosition = Math.min(...selectedNodes.map(node => node.position.x));
        console.log('Aligning to left position:', leftPosition);
        
        // Align all selected nodes to the leftmost position
        selectedNodes.forEach(node => {
          node.position.x = leftPosition;
        });
      }),
      
    alignCenter: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 1) return; // Need at least 2 nodes to align
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Calculate the average horizontal center of all selected nodes
        const centerX = selectedNodes.reduce((sum, node) => {
          const nodeWidth = node.dimensions?.width || 0;
          return sum + (node.position.x + nodeWidth / 2);
        }, 0) / selectedNodes.length;
        console.log('Aligning to center position:', centerX);
        
        // Align all selected nodes to the average center
        selectedNodes.forEach(node => {
          const nodeWidth = node.dimensions?.width || 0;
          node.position.x = centerX - nodeWidth / 2;
        });
      }),
      
    alignRight: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 1) return; // Need at least 2 nodes to align
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Find the rightmost position among selected nodes
        const rightPosition = Math.max(...selectedNodes.map(node => {
          const nodeWidth = node.dimensions?.width || 0;
          return node.position.x + nodeWidth;
        }));
        console.log('Aligning to right position:', rightPosition);
        
        // Align all selected nodes to the rightmost position
        selectedNodes.forEach(node => {
          const nodeWidth = node.dimensions?.width || 0;
          node.position.x = rightPosition - nodeWidth;
        });
      }),
      
    distributeHorizontally: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 2) return; // Need at least 3 nodes to distribute
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Sort nodes by their x position
        const sortedNodes = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
        
        // Find the leftmost and rightmost positions
        const leftmostNode = sortedNodes[0];
        const rightmostNode = sortedNodes[sortedNodes.length - 1];
        
        const leftX = leftmostNode.position.x;
        const rightX = rightmostNode.position.x + (rightmostNode.dimensions?.width || 0);
        const totalWidth = rightX - leftX;
        
        console.log('Distributing horizontally from', leftX, 'to', rightX);
        
        // Calculate the spacing between nodes
        const spacing = totalWidth / (sortedNodes.length - 1);
        
        // Distribute the nodes evenly
        sortedNodes.forEach((node, index) => {
          if (index === 0 || index === sortedNodes.length - 1) return; // Skip first and last nodes
          
          const nodeWidth = node.dimensions?.width || 0;
          const newX = leftX + spacing * index - nodeWidth / 2;
          console.log(`Node ${index} positioned at ${newX}`);
          node.position.x = newX;
        });
      }),
      
    distributeVertically: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 2) return; // Need at least 3 nodes to distribute
        
        // Push current state to history before making changes
        get().pushToHistory();
        
        // Sort nodes by their y position
        const sortedNodes = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
        
        // Find the topmost and bottommost positions
        const topmostNode = sortedNodes[0];
        const bottommostNode = sortedNodes[sortedNodes.length - 1];
        
        const topY = topmostNode.position.y;
        const bottomY = bottommostNode.position.y + (bottommostNode.dimensions?.height || 0);
        const totalHeight = bottomY - topY;
        
        console.log('Distributing vertically from', topY, 'to', bottomY);
        
        // Calculate the spacing between nodes
        const spacing = totalHeight / (sortedNodes.length - 1);
        
        // Distribute the nodes evenly
        sortedNodes.forEach((node, index) => {
          if (index === 0 || index === sortedNodes.length - 1) return; // Skip first and last nodes
          
          const nodeHeight = node.dimensions?.height || 0;
          const newY = topY + spacing * index - nodeHeight / 2;
          console.log(`Node ${index} positioned at ${newY}`);
          node.position.y = newY;
        });
      }),
      
    // Group selected nodes
    groupSelectedNodes: () =>
      set((state) => {
        console.log('groupSelectedNodes called');
        
        const selectedNodes = state.nodes.filter(node => node.selected);
        if (selectedNodes.length <= 1) {
          console.log('Not enough nodes selected for grouping, need at least 2');
          return;
        }
        
        console.log('Grouping', selectedNodes.length, 'nodes');
        
        // Push current state to history before making changes
        console.log('Pushing to history before grouping, current index:', state.historyIndex, 'history length:', state.history.length);
        get().pushToHistory();
        
        // Generate a unique ID for the group
        const groupId = `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log('Generated group ID:', groupId);
        
        // Calculate the bounding box of all selected nodes
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        selectedNodes.forEach(node => {
          const nodeWidth = node.dimensions?.width || 0;
          const nodeHeight = node.dimensions?.height || 0;
          
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + nodeWidth);
          maxY = Math.max(maxY, node.position.y + nodeHeight);
        });
        
        // Add some padding around the group
        const padding = 20; // Increased padding
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        const groupWidth = maxX - minX;
        const groupHeight = maxY - minY;
        
        // Create a group node with invisible border by default
        // The border will only be visible when selected
        const groupNode: Node = {
          id: groupId,
          type: 'rectangle',
          position: { x: minX, y: minY },
          data: { isGroup: true },
          dimensions: { width: groupWidth, height: groupHeight },
          style: {
            backgroundColor: 'transparent', // Always transparent
            borderColor: 'transparent', // Invisible by default
            borderWidth: 2,
            borderStyle: 'dashed',
            borderRadius: '4px',
            pointerEvents: 'all', // Make sure the group is interactive
          },
          selected: true,
        };
        
        // Set the parentId for all selected nodes
        selectedNodes.forEach(node => {
          node.parentId = groupId;
          node.selected = false;
          
          // Adjust positions to be relative to the group
          node.position = {
            x: node.position.x - minX,
            y: node.position.y - minY
          };
        });
        
        // Deselect all nodes and select only the group
        state.nodes.forEach(node => {
          node.selected = false;
        });
        
        // Add the group node to the nodes array
        state.nodes.push(groupNode);
        
        // Update selected elements
        state.selectedElements = [groupNode];
        
        console.log('Grouping complete, created group with ID:', groupId);
      }),
      
    // Ungroup selected nodes
    ungroupSelectedNodes: () =>
      set((state) => {
        console.log('ungroupSelectedNodes called');
        
        const selectedGroups = state.nodes.filter(node => 
          node.selected && node.data?.isGroup === true
        );
        
        if (selectedGroups.length === 0) {
          console.log('No groups selected for ungrouping');
          return;
        }
        
        console.log('Ungrouping', selectedGroups.length, 'groups');
        
        // Push current state to history before making changes
        console.log('Pushing to history before ungrouping, current index:', state.historyIndex, 'history length:', state.history.length);
        get().pushToHistory();
        
        // Process each selected group
        selectedGroups.forEach(group => {
          console.log('Processing group:', group.id);
          
          // Find all child nodes of this group
          const childNodes = state.nodes.filter(node => node.parentId === group.id);
          console.log('Found', childNodes.length, 'child nodes in group');
          
          // Adjust positions back to absolute coordinates
          childNodes.forEach(node => {
            node.position = {
              x: node.position.x + group.position.x,
              y: node.position.y + group.position.y
            };
            node.parentId = undefined;
            node.selected = true;
          });
          
          // Remove the group node
          state.nodes = state.nodes.filter(node => node.id !== group.id);
        });
        
        // Update selected elements to be the child nodes
        state.selectedElements = state.nodes.filter(node => node.selected);
        
        console.log('Ungrouping complete, selected', state.selectedElements.length, 'child nodes');
      }),
    
    // Toggle presentation mode
    togglePresentationMode: () => {
      set(state => {
        state.presentationMode = !state.presentationMode;
      });
    },
  }))
); 