'use client';

import { useState, useEffect, useRef } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export type SelectOption = {
    value: string;
    label: string;
};

type CustomSelectProps = {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    id?: string;
    name?: string;
    error?: string;
};

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Please select',
    label,
    required = false,
    id,
    name,
    error,
}: CustomSelectProps) {
    const [selectedOption, setSelectedOption] = useState<SelectOption | undefined>(undefined);
    const listboxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Find the selected option based on value
        const option = options.find(opt => opt.value === value);
        setSelectedOption(option || undefined);
    }, [value, options]);

    const handleChange = (option: SelectOption) => {
        setSelectedOption(option);
        onChange(option.value);
    };

    return (
        <div className="relative">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <Listbox value={selectedOption} onChange={handleChange} ref={listboxRef}>
                <div className="relative">
                    <ListboxButton
                        className="relative w-full cursor-default rounded-md bg-white dark:bg-[#3A3A3A] py-3 pl-4 pr-10 text-left border border-gray-300 dark:border-[#333333] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-gray-900 dark:text-white"
                        id={id}
                        name={name}
                        aria-required={required}
                        aria-invalid={!!error}
                    >
                        <span className={`block truncate ${!selectedOption ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                    </ListboxButton>

                    <ListboxOptions
                        transition
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-[#2C2C2C] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:ring-[#333333] border dark:border-[#333333] transition duration-100 ease-in data-[leave]:opacity-0"
                    >
                        {options.map((option) => (
                            <ListboxOption
                                key={option.value}
                                className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary/10 dark:bg-primary/20 text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-200'
                                    }`
                                }
                                value={option}
                            >
                                {({ selected, active }) => (
                                    <>
                                        <span
                                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                }`}
                                        >
                                            {option.label}
                                        </span>
                                        {selected ? (
                                            <span
                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-primary' : 'text-primary'
                                                    }`}
                                            >
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
} 