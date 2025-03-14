import React, { useState, useEffect, useRef } from 'react';
import { Node } from '../../lib/store/canvas-store';

interface TextShapeProps {
  node: Node;
  isSelected: boolean;
  onTextChange?: (nodeId: string, text: string) => void;
}

/**
 * TextShape component renders a text node with editing capabilities
 * It handles both display and editing modes with appropriate styling
 */
const TextShape: React.FC<TextShapeProps> = ({ node, isSelected, onTextChange }) => {
  const { id, style, data } = node;
  // Initialize editing state based on whether this is a new text shape
  const [isEditing, setIsEditing] = useState(data?.isNew || false);
  const [text, setText] = useState(data?.text as string || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus and select the textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at the start for new text shapes
      textareaRef.current.setSelectionRange(0, 0);
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isSelected) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onTextChange) {
      // Only update if there's text content
      onTextChange(id, text || 'Enter text here');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      if (onTextChange) {
        // Only update if there's text content
        onTextChange(id, text || 'Enter text here');
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      // Revert to original text if ESC is pressed
      setText(data?.text as string || '');
    }
  };

  // Base styles that are common to both display and edit modes
  const baseStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    color: (style?.textColor as string) || 'hsl(var(--foreground))',
    backgroundColor: (style?.backgroundColor as string) || 'transparent',
    fontSize: (style?.fontSize as string) || '14px',
    fontFamily: (style?.fontFamily as string) || 'sans-serif',
    fontWeight: (style?.fontWeight as string) || 'normal',
    textAlign: (style?.textAlign as 'left' | 'center' | 'right') || 'left',
  };

  // Container styles for the outer div
  const containerStyle: React.CSSProperties = {
    ...baseStyles,
    position: 'relative',
    // Use the shape's border properties
    border: style?.borderWidth ? 
      `${style.borderWidth}px ${style.borderStyle || 'solid'} ${style.borderColor || 'transparent'}` : 'none',
    borderRadius: (style?.borderRadius as string) || '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: style?.verticalAlign === 'bottom' ? 'flex-end' : 
                   style?.verticalAlign === 'middle' ? 'center' : 
                   'flex-start',
    overflow: 'hidden',
  };

  // Styles specific to the text display mode
  const textDisplayStyle: React.CSSProperties = {
    ...baseStyles,
    padding: '8px',
    outline: 'none',
    userSelect: 'none',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: style?.verticalAlign === 'bottom' ? 'flex-end' : 
                   style?.verticalAlign === 'middle' ? 'center' : 
                   'flex-start',
  };

  // Styles for the inner content div that handles alignment
  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: style?.verticalAlign === 'middle' ? 'center' : 
               style?.verticalAlign === 'bottom' ? 'flex-end' : 
               'flex-start',
    justifyContent: style?.textAlign === 'center' ? 'center' : 
                   style?.textAlign === 'right' ? 'flex-end' : 
                   'flex-start',
    textAlign: (style?.textAlign as 'left' | 'center' | 'right') || 'left',
  };

  // Styles specific to the textarea in edit mode
  const textareaStyle: React.CSSProperties = {
    ...baseStyles,
    padding: '8px',
    userSelect: 'text',
    cursor: 'text',
    background: 'transparent',
    outline: 'none',
    resize: 'none',
    // Use a primary color border when editing
    border: style?.borderWidth ? 
      `${style.borderWidth}px ${style.borderStyle || 'solid'} hsl(var(--primary))` : 
      '2px solid hsl(var(--primary))',
    borderRadius: (style?.borderRadius as string) || '12px',
    display: 'block', // Override flex display for textarea
    justifyContent: 'normal', // Override justifyContent for textarea
    height: style?.verticalAlign === 'bottom' ? 'auto' : '100%',
    alignSelf: style?.verticalAlign === 'middle' ? 'center' : 
              style?.verticalAlign === 'bottom' ? 'flex-end' : 
              'flex-start',
    caretColor: 'hsl(var(--primary))', // Blinking cursor color
  };

  // Render the editing textarea
  if (isEditing) {
    return (
      <div style={containerStyle}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={textareaStyle}
        />
      </div>
    );
  }

  // Render the display view
  return (
    <div style={containerStyle}>
      <div style={textDisplayStyle} onDoubleClick={handleDoubleClick}>
        <div style={contentStyle}>
          {text || <span className='text-muted-foreground'>Double-click to add text</span>}
        </div>
      </div>
    </div>
  );
};

export default TextShape; 