"use client";

import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: string;
  label?: string;
  id: string;
};

const InputIcon = forwardRef<HTMLInputElement, Props>(function InputIcon(
  { leftIcon, rightSlot, error, label, id, className = "", ...rest },
  ref
) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="font-semibold text-sm text-gray-700 dark:text-gray-300 pb-1 block"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-4 text-slate-600 dark:text-slate-400 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          ref={ref}className={[
            "w-full h-[45px] rounded-[10px] border-2 border-transparent",
            "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "pl-12 pr-20 caret-[#2f4982] dark:caret-blue-400",
            "outline-none transition",
            "hover:border-[#2f4982] dark:hover:border-blue-500 focus:border-[#2f4982] dark:focus:border-blue-500",
            "hover:bg-white dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-700",
            "hover:shadow-[0_0_0_5px_rgba(47,73,130,.30)] dark:hover:shadow-[0_0_0_5px_rgba(96,165,250,.30)]",
            "focus:shadow-[0_0_0_5px_rgba(47,73,130,.30)] dark:focus:shadow-[0_0_0_5px_rgba(96,165,250,.30)]",
            className,
          ].join(" ")}
          {...rest}
        />

        {rightSlot && (
          <span className="absolute right-3 flex items-center">
            {rightSlot}
          </span>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});

export default InputIcon;
