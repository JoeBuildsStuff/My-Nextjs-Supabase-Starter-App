import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { AArrowDown, AArrowUp, ALargeSmall, AlignCenter, AlignLeft, AlignRight, Type, Square, Slash } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCanvasStore } from "@/app/(Workspace)/workspace/canvas/lib/store/canvas-store"

// Color options from ColorControls
const baseColorOptions = [
  { name: "none", hsl: "0 0% 0%", special: true },
  { name: "white", hsl: "0 0% 100%" },
  { name: "black", hsl: "0 0% 0%" },
  { name: "slate", hsl: "215 16% 47%" },
  { name: "gray", hsl: "220 9% 46%" },
  { name: "zinc", hsl: "240 4% 46%" },
  { name: "neutral", hsl: "0 0% 46%" },
  { name: "stone", hsl: "25 6% 46%" },
  { name: "red", hsl: "0 84% 60%" },
  { name: "orange", hsl: "25 95% 53%" },
  { name: "amber", hsl: "38 92% 50%" },
  { name: "yellow", hsl: "48 96% 53%" },
  { name: "lime", hsl: "84 81% 44%" },
  { name: "green", hsl: "142 71% 45%" },
  { name: "emerald", hsl: "152 69% 31%" },
  { name: "teal", hsl: "173 80% 40%" },
  { name: "cyan", hsl: "186 94% 41%" },
  { name: "sky", hsl: "199 89% 48%" },
  { name: "blue", hsl: "217 91% 60%" },
  { name: "indigo", hsl: "239 84% 67%" },
  { name: "violet", hsl: "250 83% 71%" },
  { name: "purple", hsl: "270 91% 65%" },
  { name: "fuchsia", hsl: "292 91% 69%" },
  { name: "pink", hsl: "330 81% 60%" },
  { name: "rose", hsl: "355 90% 67%" },
];

// Map color names to Tailwind text color classes
// This ensures all classes are included in the build
const colorClassMap: Record<string, string> = {
  none: "text-foreground",
  white: "text-white",
  black: "text-black",
  slate: "text-slate-500",
  gray: "text-gray-500",
  zinc: "text-zinc-500",
  neutral: "text-neutral-500",
  stone: "text-stone-500",
  red: "text-red-500",
  orange: "text-orange-500",
  amber: "text-amber-500",
  yellow: "text-yellow-500",
  lime: "text-lime-500",
  green: "text-green-500",
  emerald: "text-emerald-500",
  teal: "text-teal-500",
  cyan: "text-cyan-500",
  sky: "text-sky-500",
  blue: "text-blue-500",
  indigo: "text-indigo-500",
  violet: "text-violet-500",
  purple: "text-purple-500",
  fuchsia: "text-fuchsia-500",
  pink: "text-pink-500",
  rose: "text-rose-500",
};

export default function TextControls() {
  const { nodes, textColor, setTextColor, setFontSize, setTextAlign, setVerticalAlign } = useCanvasStore()

  // Get the selected text node
  const selectedTextNode = nodes.find(node => node.selected && node.type === 'text')
  const textStyle = selectedTextNode?.style || {}

  // Helper function to convert HSL value to color name
  const getColorNameFromHsl = (hslValue: string): string => {
    if (!hslValue) return "none";
    
    // Handle the foreground variable case
    if (hslValue === 'hsl(var(--foreground))') return "none";
    
    // For other HSL values, try to match with baseColorOptions
    for (const color of baseColorOptions) {
      if (hslValue === `hsl(${color.hsl})`) {
        return color.name;
      }
    }
    
    return "none"; // Default to none if no match found
  };

  // Initialize state from the selected node or defaults
  const [fontSize, setLocalFontSize] = useState(
    textStyle.fontSize ? textStyle.fontSize.toString().replace('px', '') : "14"
  )
  const [horizontalAlignment, setLocalHorizontalAlignment] = useState(textStyle.textAlign?.toString() || "left")
  const [verticalAlignment, setLocalVerticalAlignment] = useState(textStyle.verticalAlign?.toString() || "top")
  const [selectedColorBase, setSelectedColorBase] = useState<string>(
    getColorNameFromHsl(textStyle.textColor as string || textColor)
  )

  // Get the appropriate Tailwind class for the selected color
  const getColorClass = (colorName: string): string => {
    return colorClassMap[colorName] || "text-foreground";
  };

  // Handle font size change
  const handleFontSizeChange = (value: string) => {
    setLocalFontSize(value)
    setFontSize(parseInt(value))
  }

  // Handle horizontal alignment change
  const handleHorizontalAlignmentChange = (value: string) => {
    setLocalHorizontalAlignment(value)
    setTextAlign(value as 'left' | 'center' | 'right')
  }

  // Handle vertical alignment change
  const handleVerticalAlignmentChange = (value: string) => {
    setLocalVerticalAlignment(value)
    setVerticalAlign(value as 'top' | 'middle' | 'bottom')
  }

  // Handle color change
  const handleColorChange = (colorBase: string) => {
    setSelectedColorBase(colorBase)
    setTextColor(colorBase)
  }

  // Render color buttons
  const renderColorButtons = () => {
    // Group colors into rows of 5
    const rows = [];
    for (let i = 0; i < baseColorOptions.length; i += 5) {
      rows.push(baseColorOptions.slice(i, i + 5));
    }
    
    return (
      <div>
        <ToggleGroup type="single" className="justify-start" value={selectedColorBase} onValueChange={handleColorChange}>
          <div className="flex flex-col gap-1">
            {rows.map((row, rowIndex) => (
              <div key={`color-row-${rowIndex}`} className="flex gap-1">
                {row.map((color) => (
                  <ToggleGroupItem 
                    key={`color-${color.name}`} 
                    value={color.name}
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-sm"
                  >
                    {color.name === "none" ? (
                      <div className="relative w-4 h-4">
                        <Square className="h-4 w-4 absolute" style={{ stroke: "hsl(var(--border))", fill: "transparent" }} />
                        <Slash className="h-4 w-4 absolute text-muted-foreground" />
                      </div>
                    ) : (
                      <div 
                        className="w-4 h-4 rounded-sm" 
                        style={{ 
                          background: `hsl(${color.hsl})`,
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                    )}
                  </ToggleGroupItem>
                ))}
              </div>
            ))}
          </div>
        </ToggleGroup>
      </div>
    );
  };

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <Label htmlFor="fill-color" className="text-sm font-medium text-muted-foreground mr-2">Text</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Type className={`w-4 h-4 ${getColorClass(selectedColorBase)}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" sideOffset={15} align="start" className="w-auto p-2">

          {/* Color selection */}
          <Card className="p-2 border-none">
            <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
            {renderColorButtons()}
          </Card>

          {/* Size selection */}
          <Card className="p-2 border-none">
            <Label className="text-xs text-muted-foreground mb-2 block">Size</Label>
            <ToggleGroup type="single" value={fontSize} onValueChange={handleFontSizeChange} className="justify-start">
              <ToggleGroupItem variant="outline" value="14" className="shadow-none">S</ToggleGroupItem>
              <ToggleGroupItem variant="outline" value="16" className="shadow-none">M</ToggleGroupItem>
              <ToggleGroupItem variant="outline" value="18" className="shadow-none">L</ToggleGroupItem>
              <ToggleGroupItem variant="outline" value="20" className="shadow-none">XL</ToggleGroupItem>
            </ToggleGroup>
          </Card>

          {/* Horizontal Alignment */}
          <Card className="p-2 border-none">
            <Label className="text-xs text-muted-foreground mb-2 block">Horizontal Alignment</Label>
            <ToggleGroup type="single" value={horizontalAlignment} onValueChange={handleHorizontalAlignmentChange} className="justify-start">
              <ToggleGroupItem variant="outline" value="left" className="shadow-none"><AlignLeft className="w-4 h-4" /></ToggleGroupItem>
              <ToggleGroupItem variant="outline" value="center" className="shadow-none"><AlignCenter className="w-4 h-4" /></ToggleGroupItem>
              <ToggleGroupItem variant="outline" value="right" className="shadow-none"><AlignRight className="w-4 h-4" /></ToggleGroupItem>
            </ToggleGroup>
          </Card>

          {/* Vertical Alignment */}
          <Card className="p-2 border-none">
            <Label className="text-xs text-muted-foreground mb-2 block">Vertical Alignment</Label>
            <ToggleGroup type="single" value={verticalAlignment} onValueChange={handleVerticalAlignmentChange} className="justify-start">
              <ToggleGroupItem variant="outline" value="top" className="justify-start items-start pt-1 shadow-none"><AArrowUp className="w-4 h-4" /></ToggleGroupItem>
              <ToggleGroupItem variant="outline" value="middle" className="justify-center items-center shadow-none"><ALargeSmall className="w-4 h-4" /></ToggleGroupItem>
              <ToggleGroupItem variant="outline" value="bottom" className="justify-end items-end pb-1 shadow-none"><AArrowDown className="w-4 h-4" /></ToggleGroupItem>
            </ToggleGroup>
          </Card>

        </PopoverContent>
      </Popover>
    </div>      
  )
}