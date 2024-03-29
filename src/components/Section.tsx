import React from 'react';

export function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm p-2 mt-4">
      <div className="flex flex-row items-center gap-1 mb-3">
        <div className="flex-1 h-0.5 bg-brand-100/20" />
        <div className="text-xs text-brand-100/50 font-bold text-center">
          {label}
        </div>
        <div className="flex-1 h-0.5 bg-brand-100/20" />
      </div>
      <div>{children}</div>
    </div>
  );
}
