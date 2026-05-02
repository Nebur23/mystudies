import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Render inline latex (for use within text)
const renderInline = (latex: string): string => {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
  } catch (err: any) {
    return `<span style="color:red;">${err.message}</span>`;
  }
};

// Render block latex (for standalone equations)
const renderBlock = (latex: string): string => {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
    });
  } catch (err: any) {
    return `<span style="color:red;">${err.message}</span>`;
  }
};

// Inline Latex - for math symbols within text
export const InlineLatex = ({ latex }: { latex: string }) => {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      containerRef.current.innerHTML = renderInline(latex);
    }
  }, [latex]);

  return <span ref={containerRef} />;
};

// Block Latex - for standalone equations (existing behavior)
export const BlockLatex = ({ latex }: { latex: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      containerRef.current.innerHTML = renderBlock(latex);
    }
  }, [latex]);

  return <div ref={containerRef} style={{ maxWidth: '100%' }} />;
};

// Parse text with inline latex markers {{...}}
// Usage: <LatexText text="The value of x^2 is {{x^2}} and y is {{y}}" />
export const LatexText = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    // Split by {{ }} delimiters to find latex segments
    const parts = text.split(/(\{\{.*?\}\})/g);
    
    containerRef.current.innerHTML = '';
    
    parts.forEach((part) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        // This is a latex segment
        const latex = part.slice(2, -2);
        const span = document.createElement('span');
        span.innerHTML = renderInline(latex);
        span.className = 'inline-latex';
        containerRef.current?.appendChild(span);
      } else if (part) {
        // Regular text
        const textNode = document.createTextNode(part);
        containerRef.current?.appendChild(textNode);
      }
    });
  }, [text]);

  return <div ref={containerRef} />;
};

// Solution Renderer - handles mixed inline and block LaTeX with proper formatting
// Lines that are purely LaTeX (no regular text) are rendered as block equations
// Lines with mixed content use inline LaTeX
export const SolutionRenderer = ({ solution }: { solution: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !solution) return;

    // Split by newlines to preserve formatting
    const lines = solution.split('\n');
    
    containerRef.current.innerHTML = '';
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - add spacing
        const spacer = document.createElement('div');
        spacer.className = 'h-2';
        containerRef.current?.appendChild(spacer);
        return;
      }

      // Check if line is purely LaTeX (starts with {{ and ends with }})
      const isPureLatex = trimmedLine.startsWith('{{') && trimmedLine.endsWith('}}');
      
      if (isPureLatex) {
        // Block equation
        const latex = trimmedLine.slice(2, -2);
        const div = document.createElement('div');
        div.className = 'my-3 py-2 px-3 bg-white/50 rounded-lg overflow-x-auto';
        div.innerHTML = renderBlock(latex);
        containerRef.current?.appendChild(div);
      } else {
        // Mixed content - use inline LaTeX
        const p = document.createElement('p');
        p.className = 'mb-2';
        
        const parts = line.split(/(\{\{.*?\}\})/g);
        parts.forEach((part) => {
          if (part.startsWith('{{') && part.endsWith('}}')) {
            const latex = part.slice(2, -2);
            const span = document.createElement('span');
            span.innerHTML = renderInline(latex);
            span.className = 'inline-latex font-medium';
            p.appendChild(span);
          } else if (part) {
            const textNode = document.createTextNode(part);
            p.appendChild(textNode);
          }
        });
        
        containerRef.current?.appendChild(p);
      }
    });
  }, [solution]);

  return <div ref={containerRef} />;
};

// Default export for backward compatibility
const LatexRenderer = ({ latex, displayMode = true }: { latex: string; displayMode?: boolean }) => {
  if (displayMode) {
    return <BlockLatex latex={latex} />;
  }
  return <InlineLatex latex={latex} />;
};



export default LatexRenderer;
//export { InlineLatex, BlockLatex, LatexText, SolutionRenderer };
