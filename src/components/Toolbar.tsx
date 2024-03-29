import React from 'react';

export function Toolbar({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row items-center bg-brand-100/10 rounded-lg">
      <div className="bg-brand-100/10 self-stretch flex items-center px-2 mr-2 rounded-l-lg">
        <div>{label}</div>
      </div>
      <div className="flex flex-row items-center gap-2 p-2">{children}</div>
    </div>
  );
}
