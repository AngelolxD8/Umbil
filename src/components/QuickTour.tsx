// src/components/QuickTour.tsx
"use client";

import { useState, useLayoutEffect, useCallback, useRef } from "react";

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
  const tourBoxRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    // Only run in client
    if (typeof window === "undefined") return;

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
      // Ensure we have valid dimensions
      if (rect.width > 0 || rect.height > 0) {
        setHighlightRect(rect);
      }
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    
    // Using multiple delays to catch layout shifts (e.g. mobile keyboard closing)
    const t1 = setTimeout(updatePosition, 100);
    const t2 = setTimeout(updatePosition, 500);
    
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < tourSteps.length) {
      onStepChange(nextStep); 
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    const prevStep = currentStep - 1;
    if (prevStep >= 0) {
      onStepChange(prevStep);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isMobile = windowWidth < 768; 
  const boxWidth = 320; 
  const margin = 16; // Safe margin from screen edges

  // --- POSITIONING LOGIC ---
  const boxStyle: React.CSSProperties = {
    position: 'fixed', 
    zIndex: 1002,
    maxWidth: `calc(100vw - ${margin * 2}px)`, 
    maxHeight: '80vh', // Prevent vertical cutoff by allowing scroll
    overflowY: 'auto', // Enable scroll inside the box if content is tall
  };

  if (highlightRect) {
    if (isMobile) {
        // --- MOBILE STRATEGY ---
        // Center Horizontally
        boxStyle.left = '50%';
        boxStyle.transform = 'translateX(-50%)';
        boxStyle.width = '90%'; 
        
        // Modal Step: Center Screen
        if (step.highlightId === 'tour-highlight-modal') {
            boxStyle.top = '50%';
            boxStyle.transform = 'translate(-50%, -50%)';
        } 
        // Vertical Logic: Use available space
        else {
            const spaceAbove = highlightRect.top;
            const spaceBelow = windowHeight - highlightRect.bottom;
            
            // If element is in bottom half (or covered by keyboard), force placement ABOVE
            // We use a threshold (e.g., if > 60% down the screen)
            if (highlightRect.top > windowHeight * 0.5) {
                boxStyle.bottom = `${windowHeight - highlightRect.top + 20}px`;
                boxStyle.top = 'auto';
            } else {
                // Otherwise place BELOW
                boxStyle.top = `${highlightRect.bottom + 20}px`;
                boxStyle.bottom = 'auto';
            }
        }
    } else {
        // --- DESKTOP STRATEGY ---
        
        // 1. Horizontal Positioning (Clamping)
        // Try to align left edges first
        let leftPos = highlightRect.left;
        
        // If sidebar (step 7), explicitly put it to the right of the sidebar
        if (step.id === 'step-7') {
             leftPos = highlightRect.right + 20;
        }

        // Clamp: Ensure it doesn't go off right edge
        if (leftPos + boxWidth > windowWidth - margin) {
            leftPos = windowWidth - boxWidth - margin;
        }
        // Clamp: Ensure it doesn't go off left edge
        if (leftPos < margin) {
            leftPos = margin;
        }
        
        boxStyle.left = `${leftPos}px`;

        // 2. Vertical Positioning
        if (step.highlightId === 'tour-highlight-modal') {
           boxStyle.top = '50%';
           boxStyle.left = '50%';
           boxStyle.transform = 'translate(-50%, -50%)';
        } 
        else if (step.id === 'step-7') { // Analytics/Sidebar
           boxStyle.top = `${highlightRect.top + 10}px`;
        }
        else {
            // Check space below vs above
            const spaceBelow = windowHeight - highlightRect.bottom;
            const boxHeightEstimate = 200; // rough estimate of card height

            // If not enough space below, or if element is very low, flip up
            if (spaceBelow < boxHeightEstimate && highlightRect.top > boxHeightEstimate) {
                boxStyle.bottom = `${windowHeight - highlightRect.top + 16}px`;
                boxStyle.top = 'auto';
            } else {
                boxStyle.top = `${highlightRect.bottom + 16}px`;
                boxStyle.bottom = 'auto';
            }
        }
    }
  } else {
    // Fallback: Center screen
    boxStyle.top = '50%';
    boxStyle.left = '50%';
    boxStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      <div className="tour-overlay" onClick={handleClose}>
        {highlightRect && (
          <div
            className="tour-highlight-box"
            style={{
              top: `${highlightRect.top - 4}px`, 
              left: `${highlightRect.left - 4}px`,
              width: `${highlightRect.width + 8}px`,
              height: `${highlightRect.height + 8}px`,
              position: 'fixed' // Must match fixed content box
            }}
          ></div>
        )}
      </div>

      <div ref={tourBoxRef} className="tour-content-box" style={boxStyle}>
        <button onClick={handleClose} className="tour-close-button">
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