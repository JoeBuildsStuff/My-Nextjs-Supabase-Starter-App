'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Undo, Redo } from 'lucide-react';

const UndoRedoControls = () => {
  return (
    <div className="absolute bottom-4 right-4">
      <Card className="flex items-center bg-background/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon">
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Redo className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
};

export default UndoRedoControls; 