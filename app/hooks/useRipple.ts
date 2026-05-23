import { useCallback } from "react";

/**
 * Returns an onPointerDown handler that creates a Material-style ripple.
 * Attach to any element with position:relative and overflow:hidden.
 */
export function useRipple(color = "rgba(0,0,0,0.12)") {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el   = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;

    const ripple       = document.createElement("span");
    ripple.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      left:${x}px;top:${y}px;
      border-radius:50%;
      background:${color};
      pointer-events:none;
      transform:scale(0);
      animation:ripple-expand 500ms cubic-bezier(0.4,0,0.2,1) forwards;
    `;

    // Ensure parent is positioned
    if (getComputedStyle(el).position === "static") {
      el.style.position = "relative";
    }
    el.style.overflow = "hidden";
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, [color]);
}