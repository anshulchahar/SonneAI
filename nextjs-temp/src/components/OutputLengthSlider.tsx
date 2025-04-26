'use client';

import { useState, useEffect } from 'react';

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

  // Update local state when prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setCurrentValue(newValue);
    onChange(newValue);
  };

  // Calculate the percentage for dynamic styling
  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className="relative w-full">
      {/* Container for both labels and slider */}
      <div className="relative h-8 flex items-center">
        {/* Left "Brief" label */}
        <div className="absolute left-0 text-xs text-gray-500 dark:text-gray-400 translate-y-0 transform -translate-x-12 flex items-center">
          <span className="inline-block">B</span>rief
        </div>

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

        {/* Right "Detailed" label */}
        <div className="absolute right-0 text-xs text-gray-500 dark:text-gray-400 translate-y-0 transform translate-x-14 flex items-center">
          Detaile<span className="inline-block">d</span>
        </div>
      </div>
    </div>
  );
}