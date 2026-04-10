export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden animate-in fade-in duration-500 fill-mode-both">
      {children}
    </div>
  );
}
