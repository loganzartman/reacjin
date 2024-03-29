import clsx from 'clsx';
import * as React from 'react';

type ButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'md' | 'lg';
};

const sizeClasses = {
  md: 'text-md py-1 px-2',
  lg: 'text-lg py-2 px-3',
};

export const Button = React.forwardRef(
  (
    {children, disabled, icon, size = 'md', ...attrs}: ButtonProps,
    ref: React.Ref<HTMLButtonElement>,
  ) => (
    <button
      ref={ref}
      className={clsx(
        'py-1 px-2 flex flex-row items-center justify-center gap-1 ring-2 ring-brand-200/50 rounded-md transition-colors hover:ring-brand-400 hover:bg-brand-400 hover:text-background',
        disabled
          ? 'opacity-50 cursor-default pointer-events-none'
          : 'cursor-pointer',
        sizeClasses[size],
      )}
      {...attrs}
    >
      {icon && <div>{icon}</div>}
      {children && <div>{children}</div>}
    </button>
  ),
);
Button.displayName = 'Button';
