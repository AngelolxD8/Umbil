// src/components/QuickTour.tsx
"use client";

import { useState, useLayoutEffect, useCallback, useRef } from "react";

// Define the steps of our tour
const tourSteps = [
  { 
    id: "step-0", 
    title: "1. Ask Your Question", 
    text: "Start here. You can ask anything—clinical questions, drug dosages, or reflective prompts.", 
    highlightId: "tour-highlight-askbar" 
  },
  { 
    id: "step-1", 
    title: "2. Medical Tools", 
    text: "Find specialized tools here like the Referral Writer, Safety Netting generator, and SBAR handover tool to speed up your documentation.", 
    highlightId: "tour-highlight-tools-dropdown" 
  },
  { 
    id: "step-2", 
    title: "3. Choose Your Depth", 
    text: "Need a quick answer for the ward or a detailed explanation for study? Switch between 'Clinic', 'Standard', and 'Deep Dive' modes here.", 
    highlightId: "tour-highlight-style-dropdown" 
  },
  { 
    id: "step-3", 
    title: "4. Get Your Answer", 
    text: "Umbil provides a concise, evidence-based answer. Now, let's turn this knowledge into a permanent record.", 
    highlightId: "tour-highlight-message" 
  },
  { 
    id: "step-4", 
    title: "5. Log Learning", 
    text: "Click 'Log learning (CPD)' to save this interaction. This keeps your streak alive and builds your professional portfolio automatically.", 
    highlightId: "tour-highlight-cpd-button" 
  },
  { 
    id: "step-5", 
    title: "6. Reflect & Save (Multilingual)", 
    text: "Write your notes or let AI generate them. You can even write in your native language and click 'Translate' to convert it to English for your appraisal. Add tags and click 'Save' to finish.", 
    highlightId: "tour-highlight-modal" 
  },
  { 
    id: "step-6", 
    title: "7. Automated PDP Goals", 
    text: "Umbil works in the background. If you tag a topic (e.g., 'Asthma') 7 times, we'll automatically suggest a Personal Development Plan goal to help formalize your learning.", 
    highlightId: null 
  },
  { 
    id: "step-7", 
    title: "8. Explore Analytics", 
    text: "Open the menu to see your learning turn into visual charts. Track your GMC domain coverage, clinical topics, and maintain your streaks!", 
    highlightId: "tour-highlight-sidebar" 
  },
  { 
    id: "step-8", 
    title: "You're all set!", 
    text: "You can re-take this tour anytime from the menu. Happy learning!", 
    highlightId: null 
  },
];

type QuickTourProps = {
  isOpen: boolean;
  currentStep: number;
  onClose: () => void;
  onStepChange: (stepIndex: number) => void; 
};

export default function QuickTour({ 
  isOpen, 
  currentStep, 
  onClose, 
  onStepChange 
}: QuickTourProps) {
  
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  
  // Use a ref to access the tour box dimensions if needed in future, 
  // but for now we use fixed CSS width.
  const boxRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return;

    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);

    const step = tourSteps[currentStep];
    if (!step?.highlightId) {
      setHighlightRect(null);
      return;
    }
    const element = document.getElementById(step.highlightId);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        setHighlightRect(rect);
      }
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    // Debounce/interval to catch layout shifts (e.g. keyboard appearing)
    const timer = setInterval(updatePosition, 500); 
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < tourSteps.length) {
      onStepChange(nextStep); 
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    const prevStep = currentStep - 1;
    if (prevStep >= 0) {
      onStepChange(prevStep);
    }
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isMobile = windowWidth < 768; 
  
  // Base styles
  const boxStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1002,
    width: isMobile ? '90%' : '320px', // Responsive width
    maxWidth: '95vw',
  };

  // --- POSITIONING LOGIC ---
  if (highlightRect) {
    if (isMobile) {
        // MOBILE STRATEGY: Top or Bottom based on element position
        // Center horizontally
        boxStyle.left = '50%';
        boxStyle.transform = 'translateX(-50%)';

        // If the element is in the bottom half of the screen, put box at the TOP
        if (highlightRect.top > windowHeight / 2) {
            boxStyle.top = '20px';
            boxStyle.bottom = 'auto';
        } else {
            // If element is in top half, put box at the BOTTOM
            boxStyle.bottom = '20px';
            boxStyle.top = 'auto';
        }

        // Special override for the Modal step (center it)
        if (step.highlightId === 'tour-highlight-modal') {
            boxStyle.top = '50%';
            boxStyle.bottom = 'auto';
            boxStyle.transform = 'translate(-50%, -50%)';
        }

    } else {
        // DESKTOP STRATEGY: Near the element, but clamped to screen edges
        
        // 1. Calculate ideal Left (aligned with element)
        let safeLeft = highlightRect.left;
        
        // 2. Sidebar special case (put to the right of it)
        if (step.id === 'step-7') {
            safeLeft = highlightRect.right + 20;
        }

        // 3. CLAMP Horizontal: Ensure box doesn't go off right edge
        const boxWidthApprox = 320; 
        const margin = 20;
        
        if (safeLeft + boxWidthApprox > windowWidth - margin) {
            safeLeft = windowWidth - boxWidthApprox - margin;
        }
        if (safeLeft < margin) {
            safeLeft = margin;
        }
        
        boxStyle.left = `${safeLeft}px`;

        // 4. Vertical Positioning
        // Default: Below the element
        let topPos = highlightRect.bottom + 15;
        
        // Check if there is space below
        if (topPos + 200 > windowHeight) { // Assuming approx 200px height for box
             // If not enough space below, put ABOVE
             // Use bottom property to pin it above
             boxStyle.bottom = `${windowHeight - highlightRect.top + 15}px`;
             boxStyle.top = 'auto';
        } else {
             boxStyle.top = `${topPos}px`;
             boxStyle.bottom = 'auto';
        }

        // Modal Override for Desktop too
        if (step.highlightId === 'tour-highlight-modal') {
            boxStyle.top = '50%';
            boxStyle.left = '50%';
            boxStyle.transform = 'translate(-50%, -50%)';
            boxStyle.bottom = 'auto';
        }
    }
  } else {
    // Fallback if no element found: Absolute Center
    boxStyle.top = '50%';
    boxStyle.left = '50%';
    boxStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      <div className="tour-overlay" onClick={onClose}>
        {highlightRect && (
          <div
            className="tour-highlight-box"
            style={{
              top: `${highlightRect.top - 4}px`, 
              left: `${highlightRect.left - 4}px`,
              width: `${highlightRect.width + 8}px`,
              height: `${highlightRect.height + 8}px`,
              position: 'fixed', // Fixed to match the overlay/box
            }}
          ></div>
        )}
      </div>

      <div ref={boxRef} className="tour-content-box" style={boxStyle}>
        <button onClick={onClose} className="tour-close-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h4 className="tour-title">{step.title}</h4>
        <p className="tour-text">{step.text}</p>
        
        <div className="tour-footer">
          <span className="tour-step-counter">
            {currentStep + 1} / {tourSteps.length}
          </span>
          <div className="tour-buttons">
            {currentStep > 0 && (
              <button className="tour-button-back" onClick={handleBack}>
                Back
              </button>
            )}
            <button className="tour-button-next" onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}