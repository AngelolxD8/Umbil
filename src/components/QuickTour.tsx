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
    if (typeof window === 'undefined') return;

    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);

    const step = tourSteps[currentStep];
    
    // Explicitly handle steps with no highlight (like Step 8)
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
    } else {
      // If element not found, fallback to null (center screen)
      setHighlightRect(null);
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    // Aggressive interval to catch layout shifts on mobile (keyboard, url bar)
    const timer = setInterval(updatePosition, 300);
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
  
  // -- BASE STYLES --
  // We use fixed positioning to avoid scrolling issues
  const boxStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1002, // Higher than everything else
    width: isMobile ? '90%' : '320px',
    maxWidth: 'calc(100vw - 32px)', // Never overflow screen width
    maxHeight: '80vh', // Allow scrolling if content is too tall
    overflowY: 'auto',
  };

  // -- POSITIONING CALCULATIONS --
  if (highlightRect) {
    if (isMobile) {
        // MOBILE: Simple Top/Bottom Logic to avoid being "gone"
        
        // Center Horizontally
        boxStyle.left = '50%';
        boxStyle.transform = 'translateX(-50%)';

        // Modal Step: Dead Center
        if (step.highlightId === 'tour-highlight-modal') {
            boxStyle.top = '50%';
            boxStyle.bottom = 'auto';
            boxStyle.transform = 'translate(-50%, -50%)';
        } 
        // If element is in the bottom half -> Place Box at TOP with margin
        else if (highlightRect.top > windowHeight / 2) {
            boxStyle.top = '70px'; // Clear of header
            boxStyle.bottom = 'auto';
        } 
        // If element is in the top half -> Place Box at BOTTOM with margin
        else {
            boxStyle.bottom = '40px'; 
            boxStyle.top = 'auto';
        }

    } else {
        // DESKTOP: Follow element but stay on screen
        
        // 1. Horizontal: Align left, but clamp to edges
        let leftPos = highlightRect.left;
        
        // Special case for Sidebar (Step 7): Push to right
        if (step.id === 'step-7') leftPos = highlightRect.right + 20;

        // Clamp Right
        if (leftPos + 340 > windowWidth) leftPos = windowWidth - 340; 
        // Clamp Left
        if (leftPos < 16) leftPos = 16;
        
        boxStyle.left = `${leftPos}px`;

        // 2. Vertical
        if (step.highlightId === 'tour-highlight-modal') {
            boxStyle.top = '50%';
            boxStyle.left = '50%';
            boxStyle.transform = 'translate(-50%, -50%)';
        } else {
            // Default below
            let topPos = highlightRect.bottom + 15;
            
            // If going off bottom, flip to above
            if (topPos + 250 > windowHeight) {
                boxStyle.bottom = `${windowHeight - highlightRect.top + 15}px`;
                boxStyle.top = 'auto';
            } else {
                boxStyle.top = `${topPos}px`;
                boxStyle.bottom = 'auto';
            }
        }
    }
  } else {
    // FALLBACK (Step 8 / No Element): Absolute Center
    // This fixes "Step 8 is gone" by forcing it to the middle of the viewport
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
              position: 'fixed', // Use fixed to match the tour box context
            }}
          ></div>
        )}
      </div>

      <div ref={tourBoxRef} className="tour-content-box" style={boxStyle}>
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