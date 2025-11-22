import * as RadixSwitch from '@radix-ui/react-switch';
import clsx from 'clsx';

export function Switch({ checked, onCheckedChange, className = "" }: {
    checked: boolean,
    onCheckedChange: (checked: boolean) => void,
    className?: string
}) {
    return (
        <RadixSwitch.Root
            checked={checked}
            onCheckedChange={onCheckedChange}
            className={clsx(
                "w-10 h-6 bg-gray-300 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                checked ? "bg-blue-600" : "bg-gray-300",
                className
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <RadixSwitch.Thumb
                className={clsx(
                    "block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200",
                    checked ? "translate-x-4" : "translate-x-1"
                )}
            />
        </RadixSwitch.Root>
    );
} 