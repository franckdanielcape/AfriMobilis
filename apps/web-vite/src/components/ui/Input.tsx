import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <input
                className={`
                    w-full px-4 py-2 rounded-lg border
                    ${error 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                    }
                    focus:outline-none focus:ring-2
                    disabled:bg-slate-100 disabled:cursor-not-allowed
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-slate-500">{helperText}</p>
            )}
        </div>
    );
};

export default Input;
