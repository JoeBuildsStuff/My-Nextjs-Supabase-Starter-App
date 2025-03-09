'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Share, BookOpen } from 'lucide-react';

interface TopMenuControlsProps {
  position: 'left' | 'right';
}

const TopMenuControls = ({ position }: TopMenuControlsProps) => {
  return (
    <div className={`absolute top-4 ${position === 'left' ? 'left-4' : 'right-4'} ${position === 'right' ? 'flex space-x-2' : ''}`}>
      {position === 'left' ? (
        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
          <Menu className="w-5 h-5" />
        </Button>
      ) : (
        <>
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
            <Share className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
            <BookOpen className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default TopMenuControls; 