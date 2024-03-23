import clsx from 'clsx';

export function PanelRow({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={clsx(className)}>
      <div className="flex flex-row gap-2">
        <div className="px-2 flex-none self-center rounded-full bg-brand-100/10">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}
