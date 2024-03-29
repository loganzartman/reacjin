export function FAB({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className="fixed bottom-8 right-8">
      <button
        className="p-2 min-w-[4rem] min-h-[4rem] rounded-3xl text-[2rem] transition-colors bg-brand-300 hover:bg-brand-100 text-background shadow-xl shadow-[rgba(0,0,0,0.5)] flex items-center justify-center"
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  );
}
