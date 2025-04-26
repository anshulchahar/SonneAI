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

  // Labels for the slider
  const lengthLabels = {
    [min]: 'Brief',
    [max]: 'Detailed'
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full flex items-center mb-1">
        {/* Brief label aligned with left edge of the capsule */}
        <span className="text-xs text-gray-500 dark:text-gray-400 absolute left-0">{lengthLabels[min]}</span>

        <div className="w-full" style={{ paddingLeft: "2rem", paddingRight: "3rem" }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`
            }}
          />
        </div>

        {/* Detailed label aligned with right edge of the capsule */}
        <span className="text-xs text-gray-500 dark:text-gray-400 absolute right-0">{lengthLabels[max]}</span>
      </div>
    </div>
  );
}