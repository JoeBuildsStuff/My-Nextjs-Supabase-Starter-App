'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useCanvasStore } from '../../lib/store/canvas-store';

// This is a placeholder for the icon library
// In a real implementation, you would import your icon library here
const placeholderIcons = [
  { id: 'icon1', name: 'User', component: '👤' },
  { id: 'icon2', name: 'Home', component: '🏠' },
  { id: 'icon3', name: 'Settings', component: '⚙️' },
  { id: 'icon4', name: 'Star', component: '⭐' },
  { id: 'icon5', name: 'Heart', component: '❤️' },
  { id: 'icon6', name: 'Bell', component: '🔔' },
  { id: 'icon7', name: 'Mail', component: '✉️' },
  { id: 'icon8', name: 'Calendar', component: '📅' },
  { id: 'icon9', name: 'Clock', component: '🕒' },
  { id: 'icon10', name: 'Document', component: '📄' },
  { id: 'icon11', name: 'Image', component: '🖼️' },
  { id: 'icon12', name: 'Video', component: '🎬' },
];

const IconSheet = () => {
  const { isIconSheetOpen, toggleIconSheet } = useCanvasStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter icons based on search query
  const filteredIcons = placeholderIcons.filter(icon => 
    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={isIconSheetOpen} onOpenChange={toggleIconSheet}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 overflow-y-auto">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Icon Library</SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </SheetHeader>
        
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredIcons.map(icon => (
            <Card 
              key={icon.id} 
              className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => {
                // Here you would add the icon to the canvas
                console.log('Selected icon:', icon.name);
                // Close the sheet after selection
                toggleIconSheet();
              }}
            >
              <div className="text-3xl mb-2">{icon.component}</div>
              <div className="text-sm text-center">{icon.name}</div>
            </Card>
          ))}
          
          {filteredIcons.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No icons found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IconSheet; 