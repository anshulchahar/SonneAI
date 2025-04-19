'use client';

import { useState, useEffect } from 'react';

interface OutputLengthSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export default function OutputLengthSlider({
  value,
  onChange,
  min = 100,
  max = 3000,
  step = 100,
  label = 'Output Length'
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
    <div className="flex flex-col items-center h-full">
      <div className="relative h-64 flex flex-col items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">{lengthLabels[max]}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          className="w-2 h-full bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to bottom, var(--color-primary) 0%, var(--color-primary) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`,
            transform: 'rotate(0deg)',
            WebkitAppearance: 'slider-vertical'
          }}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{lengthLabels[min]}</span>
      </div>
    </div>
  );
}