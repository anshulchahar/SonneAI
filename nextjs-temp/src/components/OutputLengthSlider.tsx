'use client';

import { useState, useEffect, useRef } from 'react';

interface OutputLengthSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function OutputLengthSlider({
  value,
  onChange,
  min = 100,
  max = 3000,
  step = 100
}: OutputLengthSliderProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Check screen size and adjust layout
  useEffect(() => {
    const checkScreenSize = () => {
      // For tablets and phones (screen width less than 768px)
      setIsSmallScreen(window.innerWidth < 768);
    };

    // Check on initial load
    checkScreenSize();

    // Add listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setCurrentValue(newValue);
    onChange(newValue);
  };

  // Calculate the percentage for dynamic styling
  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className="relative w-full" ref={containerRef}>
      {isSmallScreen ? (
        // Small screen layout (without labels)
        <div className="flex flex-col">
          {/* Slider */}
          <div className="h-8 flex items-center">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={currentValue}
              onChange={handleChange}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`,
              }}
            />
          </div>
        </div>
      ) : (
        // Original layout for laptop and larger (without labels)
        <div className="relative h-8 flex items-center">
          {/* Slider track and thumb */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}