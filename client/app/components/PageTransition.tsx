import { useNavigation } from "react-router";
import { useEffect, useState } from "react";

// Wrap page content to show skeleton on slow loads (> 150ms)
export function PageLoader({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (navigation.state !== "idle") {
      const t = setTimeout(() => setShowSpinner(true), 150);
      return () => clearTimeout(t);
    }
    setShowSpinner(false);
  }, [navigation.state]);

  return (
    <>
      {/* Top progress bar — always shown on navigate */}
      {navigation.state !== "idle" && (
        <div className="fixed top-0 left-0 right-0 z-100 h-0.5 overflow-hidden">
            <div>I am feeling</div>
          <div
            className="h-full bg-primary"
            style={{
              animation: "progress-bar 1.5s ease-in-out infinite",
            }}
          />
          <style>{`
            @keyframes progress-bar {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}
      {children}
    </>
  );
}