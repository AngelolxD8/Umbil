// src/components/QuickTour.tsx
"use client";

import { useState, useLayoutEffect, useCallback } from "react";

// Define the steps of our tour
const tourSteps = [
  { id: "step-0", title: "1. Ask Your Question", text: "Start here. You can ask anything—clinical questions, drug dosages, or reflective prompts.", highlightId: "tour-highlight-askbar" },
  { id: "step-1", title: "2. Choose Your Depth", text: "Need a quick answer for the ward or a detailed explanation for study? Switch between 'Clinic', 'Standard', and 'Deep Dive' modes here.", highlightId: "tour-highlight-style-dropdown" },
  { id: "step-2", title: "3. Get Your Answer", text: "Umbil provides a concise, evidence-based answer. Now, let's turn this knowledge into a permanent record.", highlightId: "tour-highlight-message" },
  { id: "step-3", title: "4. Log Learning", text: "Click 'Log learning (CPD)' to save this interaction. This keeps your streak alive and builds your professional portfolio automatically.", highlightId: "tour-highlight-cpd-button" },
  { id: "step-4", title: "5. Reflect & Save", text: "Write your own notes, add tags to organise your learning, or click 'Generate' to let AI create a GMC-compliant reflection for you. Click 'Save' to finish.", highlightId: "tour-highlight-modal" },
  { id: "step-5", title: "6. Automated PDP Goals", text: "Umbil works in the background. If you tag a topic (e.g., 'Asthma') 7 times, we'll automatically suggest a Personal Development Plan goal to help formalize your learning.", highlightId: null },
  { id: "step-6", title: "7. Explore Analytics", text: "Open the menu to see your learning turn into visual charts. Track your GMC domain coverage, clinical topics, and maintain your streaks!", highlightId: "tour-highlight-sidebar" },
  { id: "step-7", title: "You're all set!", text: "You can re-take this tour anytime from the menu. Happy learning!", highlightId: null },
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

  // FIX: Wrap in useCallback so it can be a dependency
  const updatePosition = useCallback(() => {
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
    const timer = setTimeout(updatePosition, 200);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]); // FIX: Added updatePosition to dependencies

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

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1002,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  if (highlightRect) {
    boxStyle.transform = 'none'; 

    if (step.highlightId === 'tour-highlight-modal') {
       boxStyle.top = '50%';
       boxStyle.left = '50%';
       boxStyle.transform = 'translate(-50%, -50%)';
    } 
    else if (step.id === 'step-6') { 
      boxStyle.top = `${highlightRect.top + 20}px`;
      boxStyle.left = `${highlightRect.right + 20}px`;
      boxStyle.right = 'auto';
      boxStyle.bottom = 'auto';
    } 
    else if (highlightRect.top > window.innerHeight / 2) { 
      boxStyle.bottom = `${window.innerHeight - highlightRect.top + 20}px`;
      boxStyle.left = `${highlightRect.left}px`;
      boxStyle.top = 'auto';
    } else { 
      boxStyle.top = `${highlightRect.bottom + 20}px`;
      boxStyle.left = `${highlightRect.left}px`;
      boxStyle.bottom = 'auto';
    }

    if (highlightRect.left + 320 > window.innerWidth) {
      boxStyle.right = '20px';
      boxStyle.left = 'auto';
    }
  }

  return (
    <>
      <div className="tour-overlay" onClick={handleClose}>
        {highlightRect && (
          <div
            className="tour-highlight-box"
            style={{
              top: `${highlightRect.top - 8}px`, 
              left: `${highlightRect.left - 8}px`,
              width: `${highlightRect.width + 16}px`,
              height: `${highlightRect.height + 16}px`,
            }}
          ></div>
        )}
      </div>

      <div className="tour-content-box" style={boxStyle}>
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