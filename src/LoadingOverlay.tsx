export function LoadingOverlay() {
  return (
    <div className="absolute left-0 top-0 right-0 bottom-0 flex items-center justify-center bg-background/80">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}
