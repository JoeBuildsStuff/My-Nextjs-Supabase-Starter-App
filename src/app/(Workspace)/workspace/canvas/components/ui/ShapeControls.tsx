'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Square } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCanvasStore } from '@/app/(Workspace)/workspace/canvas/lib/store/canvas-store';

const ShapeControls = () => {
  const { borderRadius, setBorderRadius, strokeColor, fillColor } = useCanvasStore();

  // Function to get HSL value from color name (similar to getCurrentColorHsl in ColorControls)
  const getColorHsl = (colorName: string): string => {
    if (colorName === 'none') return '0 0% 0%';
    
    const parts = colorName.split('-');
    if (parts.length === 2) {
      const [base, shade] = parts;
      
      // Handle special cases
      if (base === 'white') {
        // White shades
        const whiteShades: Record<string, string> = {
          '100': '0 0% 100%', // Pure white
          '200': '0 0% 98%',
          '300': '0 0% 96%',
          '400': '0 0% 94%',
          '500': '0 0% 92%',
          '600': '0 0% 88%',
          '700': '0 0% 84%',
          '800': '0 0% 80%',
          '900': '0 0% 75%',
          '950': '0 0% 70%',  // Light gray
        };
        return whiteShades[shade] || '0 0% 100%';
      }
      
      if (base === 'black') {
        // Black shades
        const blackShades: Record<string, string> = {
          '100': '0 0% 90%',  // Very light gray
          '200': '0 0% 80%',
          '300': '0 0% 70%',
          '400': '0 0% 60%',
          '500': '0 0% 50%',  // Medium gray
          '600': '0 0% 40%',
          '700': '0 0% 30%',
          '800': '0 0% 20%',
          '900': '0 0% 10%',  // Very dark gray
          '950': '0 0% 0%',   // Pure black
        };
        return blackShades[shade] || '0 0% 0%';
      }
      
      // Tailwind color shades with HSL values
      const colorShades: Record<string, Record<string, string>> = {
        slate: {
          '100': '210 40% 96.1%',
          '200': '214 32% 91.0%',
          '300': '213 27% 84.3%',
          '400': '215 20% 65.1%',
          '500': '215 16% 47.0%',
          '600': '215 19% 35.3%',
          '700': '215 25% 27.5%',
          '800': '217 33% 17.3%',
          '900': '222 47% 11.2%',
          '950': '229 84% 5%',
        },
        gray: {
          '100': '220 14% 96.1%',
          '200': '220 13% 91.0%',
          '300': '216 12% 83.9%',
          '400': '218 11% 65.1%',
          '500': '220 9% 46.1%',
          '600': '215 14% 34.1%',
          '700': '217 19% 27.1%',
          '800': '215 28% 17.3%',
          '900': '221 39% 11.0%',
          '950': '224 71% 4%',
        },
        zinc: {
          '100': '240 5% 96.1%',
          '200': '240 6% 90.0%',
          '300': '240 5% 84.0%',
          '400': '240 5% 65.1%',
          '500': '240 4% 46.1%',
          '600': '240 5% 34.0%',
          '700': '240 5% 26.0%',
          '800': '240 4% 16.0%',
          '900': '240 6% 10.0%',
          '950': '240 10% 4%',
        },
        neutral: {
          '100': '0 0% 96.1%',
          '200': '0 0% 90.0%',
          '300': '0 0% 83.1%',
          '400': '0 0% 64.7%',
          '500': '0 0% 45.9%',
          '600': '0 0% 32.2%',
          '700': '0 0% 25.1%',
          '800': '0 0% 14.9%',
          '900': '0 0% 9.0%',
          '950': '0 0% 4%',
        },
        stone: {
          '100': '60 5% 96.1%',
          '200': '20 6% 90.0%',
          '300': '24 6% 83.1%',
          '400': '24 5% 64.7%',
          '500': '25 6% 45.9%',
          '600': '33 5% 32.2%',
          '700': '30 6% 25.1%',
          '800': '12 6% 15.1%',
          '900': '24 10% 10.0%',
          '950': '20 14% 4%',
        },
        red: {
          '100': '0 86% 97.3%',
          '200': '0 93% 94.1%',
          '300': '0 96% 89.0%',
          '400': '0 91% 71.4%',
          '500': '0 84% 60.0%',
          '600': '0 72% 50.6%',
          '700': '0 74% 42.0%',
          '800': '0 70% 35.3%',
          '900': '0 63% 31.0%',
          '950': '0 80% 17%',
        },
        orange: {
          '100': '34 100% 97.1%',
          '200': '32 98% 83.5%',
          '300': '31 97% 72.2%',
          '400': '27 96% 61.0%',
          '500': '25 95% 53.1%',
          '600': '21 90% 48.0%',
          '700': '17 88% 40.0%',
          '800': '15 79% 33.7%',
          '900': '15 75% 28.4%',
          '950': '14 80% 14%',
        },
        amber: {
          '100': '48 96% 89.0%',
          '200': '48 97% 77.1%',
          '300': '46 97% 65.1%',
          '400': '43 96% 56.1%',
          '500': '38 92% 50.0%',
          '600': '32 95% 44.0%',
          '700': '26 90% 37.1%',
          '800': '23 83% 31.8%',
          '900': '22 78% 26.1%',
          '950': '21 80% 12%',
        },
        yellow: {
          '100': '55 92% 95.1%',
          '200': '53 98% 77.1%',
          '300': '50 98% 64.1%',
          '400': '48 96% 53.1%',
          '500': '48 96% 53.1%',
          '600': '45 93% 47.5%',
          '700': '35 92% 33.1%',
          '800': '32 81% 29.0%',
          '900': '28 73% 26.5%',
          '950': '28 80% 13%',
        },
        lime: {
          '100': '73 92% 93.9%',
          '200': '77 76% 85.1%',
          '300': '81 67% 74.9%',
          '400': '82 77% 61.2%',
          '500': '84 81% 44.1%',
          '600': '85 85% 35.3%',
          '700': '86 78% 26.9%',
          '800': '86 69% 22.7%',
          '900': '88 61% 20.2%',
          '950': '89 80% 10%',
        },
        green: {
          '100': '142 77% 94.9%',
          '200': '141 79% 85.1%',
          '300': '142 77% 73.3%',
          '400': '142 69% 58.0%',
          '500': '142 71% 45.1%',
          '600': '142 76% 36.3%',
          '700': '142 72% 29.0%',
          '800': '143 64% 24.3%',
          '900': '144 61% 20.2%',
          '950': '145 80% 10%',
        },
        emerald: {
          '100': '152 81% 95.9%',
          '200': '149 80% 90.0%',
          '300': '152 76% 80.4%',
          '400': '156 72% 67.1%',
          '500': '152 69% 31.0%',
          '600': '153 74% 26.9%',
          '700': '155 66% 23.1%',
          '800': '156 66% 19.2%',
          '900': '157 61% 15.9%',
          '950': '160 84% 7%',
        },
        teal: {
          '100': '166 76% 97.1%',
          '200': '168 84% 93.9%',
          '300': '171 77% 64.1%',
          '400': '172 66% 50.4%',
          '500': '173 80% 40.0%',
          '600': '175 84% 32.2%',
          '700': '175 77% 26.1%',
          '800': '176 69% 22.0%',
          '900': '176 61% 18.6%',
          '950': '180 85% 8%',
        },
        cyan: {
          '100': '183 100% 96.1%',
          '200': '185 96% 90.0%',
          '300': '186 94% 82.0%',
          '400': '186 93% 61.0%',
          '500': '186 94% 41.0%',
          '600': '186 91% 32.9%',
          '700': '187 92% 26.5%',
          '800': '188 91% 22.2%',
          '900': '186 91% 18.6%',
          '950': '184 91% 10%',
        },
        sky: {
          '100': '204 93% 93.9%',
          '200': '200 94% 86.1%',
          '300': '199 95% 73.9%',
          '400': '198 93% 60.0%',
          '500': '199 89% 48.0%',
          '600': '200 98% 39.4%',
          '700': '201 96% 32.2%',
          '800': '201 90% 27.5%',
          '900': '202 80% 24.0%',
          '950': '204 80% 16%',
        },
        blue: {
          '100': '214 100% 96.1%',
          '200': '213 97% 87.1%',
          '300': '212 96% 78.0%',
          '400': '213 94% 68.0%',
          '500': '217 91% 60.0%',
          '600': '221 83% 53.3%',
          '700': '224 76% 48.0%',
          '800': '226 71% 40.0%',
          '900': '224 64% 33.0%',
          '950': '226 57% 21%',
        },
        indigo: {
          '100': '226 100% 96.1%',
          '200': '228 96% 88.8%',
          '300': '230 94% 82.4%',
          '400': '234 89% 73.9%',
          '500': '239 84% 67.1%',
          '600': '243 75% 58.6%',
          '700': '245 58% 51.0%',
          '800': '244 55% 41.0%',
          '900': '242 47% 34.3%',
          '950': '244 47% 21%',
        },
        violet: {
          '100': '240 100% 96.1%',
          '200': '243 100% 90.0%',
          '300': '246 100% 84.1%',
          '400': '248 96% 76.5%',
          '500': '250 83% 71.0%',
          '600': '252 62% 64.5%',
          '700': '256 48% 56.0%',
          '800': '260 44% 47.3%',
          '900': '258 43% 39.4%',
          '950': '256 45% 25%',
        },
        purple: {
          '100': '270 100% 95.9%',
          '200': '268 100% 91.8%',
          '300': '269 97% 85.1%',
          '400': '270 95% 75.3%',
          '500': '270 91% 65.1%',
          '600': '271 81% 55.9%',
          '700': '272 72% 47.1%',
          '800': '273 67% 39.4%',
          '900': '274 66% 32.2%',
          '950': '276 60% 21%',
        },
        fuchsia: {
          '100': '287 100% 95.9%',
          '200': '288 96% 91.0%',
          '300': '291 93% 82.9%',
          '400': '292 91% 72.5%',
          '500': '292 91% 69.0%',
          '600': '293 69% 58.8%',
          '700': '295 72% 47.5%',
          '800': '295 70% 40.0%',
          '900': '297 64% 32.9%',
          '950': '297 90% 20%',
        },
        pink: {
          '100': '326 100% 95.9%',
          '200': '326 100% 90.0%',
          '300': '327 87% 81.8%',
          '400': '329 86% 70.2%',
          '500': '330 81% 60.0%',
          '600': '333 71% 50.6%',
          '700': '335 78% 42.0%',
          '800': '336 74% 35.1%',
          '900': '336 69% 30.4%',
          '950': '336 80% 17%',
        },
        rose: {
          '100': '356 100% 96.1%',
          '200': '353 100% 91.8%',
          '300': '353 95% 81.8%',
          '400': '351 94% 71.4%',
          '500': '350 89% 60.0%',
          '600': '347 77% 50.0%',
          '700': '345 83% 41.0%',
          '800': '343 80% 34.5%',
          '900': '342 75% 30.4%',
          '950': '343 88% 16%',
        },
      };
      
      return colorShades[base]?.[shade] || '0 0% 46%';
    }
    
    // Handle basic colors
    if (colorName === 'white') return '0 0% 100%';
    if (colorName === 'black') return '0 0% 0%';
    
    // Base color options (without shade) for direct lookup
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
    
    // Find in base colors
    const baseColor = baseColorOptions.find(c => c.name === colorName);
    return baseColor?.hsl || '0 0% 46%';
  };

  // Get stroke and fill colors in HSL format
  const strokeHsl = getColorHsl(strokeColor);
  const fillHsl = getColorHsl(fillColor);

  // Determine if stroke is "none"
  const hasStroke = strokeColor !== 'none';
  
  // Determine if fill is "none"
  const hasFill = fillColor !== 'none';

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <Label className="text-sm font-medium text-muted-foreground">Edge</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Square className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-fit" sideOffset={15} align="start">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Border Radius</Label>
            <span className="text-sm text-muted-foreground">{borderRadius}px</span>
          </div>
          {/* Preset Toggle Group */}
          <ToggleGroup 
            className="w-full justify-between mb-4" 
            type="single" 
            value={borderRadius.toString()} 
            onValueChange={(value) => setBorderRadius(parseInt(value))}
          >
            <ToggleGroupItem value="0" aria-label="No radius">
              <div 
                className="w-6 h-6 rounded-none" 
                style={{
                  backgroundColor: hasFill ? `hsl(${fillHsl})` : 'transparent',
                  border: hasStroke ? `2px solid hsl(${strokeHsl})` : 'none',
                }}
              ></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="4" aria-label="Small radius">
              <div 
                className="w-6 h-6 rounded-sm" 
                style={{
                  backgroundColor: hasFill ? `hsl(${fillHsl})` : 'transparent',
                  border: hasStroke ? `2px solid hsl(${strokeHsl})` : 'none',
                }}
              ></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="8" aria-label="Medium radius">
              <div 
                className="w-6 h-6 rounded-md" 
                style={{
                  backgroundColor: hasFill ? `hsl(${fillHsl})` : 'transparent',
                  border: hasStroke ? `2px solid hsl(${strokeHsl})` : 'none',
                }}
              ></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="12" aria-label="Large radius">
              <div 
                className="w-6 h-6 rounded-lg" 
                style={{
                  backgroundColor: hasFill ? `hsl(${fillHsl})` : 'transparent',
                  border: hasStroke ? `2px solid hsl(${strokeHsl})` : 'none',
                }}
              ></div>
            </ToggleGroupItem>
            <ToggleGroupItem value="9999" aria-label="Full radius">
              <div 
                className="w-6 h-6 rounded-full" 
                style={{
                  backgroundColor: hasFill ? `hsl(${fillHsl})` : 'transparent',
                  border: hasStroke ? `2px solid hsl(${strokeHsl})` : 'none',
                }}
              ></div>
            </ToggleGroupItem>
          </ToggleGroup>
          {/* Custom Slider */}
          <Slider
            value={[borderRadius]}
            onValueChange={([value]) => setBorderRadius(value)}
            max={50}
            step={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ShapeControls; 