'use client';

import { HeroCollage } from '@/components/ui/modern-hero-section';

// Demo component to showcase the HeroCollage as requested
export default function HeroCollageDemo() {
  return (
    <div className="w-full">
      <HeroCollage
        title={
          <>
            Eclectica <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Farewell Collage</span>
          </>
        }
        subtitle="Step back in time and turn the pages of our shared journey. Flip through college memories, late night laughter, and unforgettable moments captured over four amazing years."
      />
    </div>
  );
}
