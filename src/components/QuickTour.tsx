// src/components/QuickTour.tsx
"use client";

// REMOVED: useState and useEffect, as parent now controls state
import { /* useState, useEffect */ } from "react";

// Define the steps of our tour
const tourSteps = [
  {
    id: "step-1",
    title: "Welcome to Umbil!",
    text: "Let's take a 1-minute tour to see how to get the most out of your new clinical co-pilot.",
    highlightId: null, // No specific element for the welcome message
  },
  {
    id: "step-2",
    title: "1. Ask Your Question",
    text: "This is where you ask anything—clinical, educational, or reflective. Let's see what happens.",
    highlightId: "tour-highlight-askbar", // ID of the ask bar container
  },
  {
    id: "step-3",
    title: "2. Get Your Answer",
    text: "Umbil provides a concise, evidence-based answer. Now for the best part: turning this into CPD.",
    highlightId: "tour-highlight-message", // ID of the dummy message
  },
  {
    id: "step-4",
    title: "3. Add to CPD",
    text: "Click 'Log learning (CPD)' on any of Umbil's answers to open the reflection modal.",
    highlightId: "tour-highlight-cpd-button", // ID of the dummy CPD button
  },
  {
    id: "step-5",
    title: "4. Reflect & Save",
    text: "You can write your own reflection, or click 'Generate' to let AI create a GMC-style reflection and suggest tags for you. Click 'Save' to log it.",
    highlightId: "tour-highlight-modal", // ID of the (now open) modal
  },
  {
    id: "step-6",
    title: "5. Explore Your Logs",
    text: "That's it! You can find all your saved entries, export them, and track your learning streaks from the navigation menu.",
    highlightId: "tour-highlight-sidebar", // ID for the sidebar (will be opened)
  },
  {
    id: "step-7",
    title: "You're all set!",
    text: "You can re-take this tour any time from the 'Quick Tour' button in the navigation menu. Happy learning!",
    highlightId: null,
  },
];

type QuickTourProps = {
  isOpen: boolean;
  currentStep: number; // <-- UPDATED: This is now a prop
  onClose: () => void;
  onStepChange: (stepIndex: number) => void; // To tell HomeContent to update
};

export default function QuickTour({ 
  isOpen, 
  currentStep, // <-- UPDATED: Read from props
  onClose, 
  onStepChange 
}: QuickTourProps) {
  // REMOVED: Internal state for currentStep
  // const [currentStep, setCurrentStep] = useState(0);

  // REMOVED: useEffect that reset internal state
  
  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < tourSteps.length) {
      // Tell parent to update the step
      onStepChange(nextStep); 
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    const prevStep = currentStep - 1;
    if (prevStep >= 0) {
      // Tell parent to update the step
      onStepChange(prevStep);
    }
  };

  const handleClose = () => {
    // Parent will handle resetting state
    onClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const highlightElement = step.highlightId ? document.getElementById(step.highlightId) : null;
  const rect = highlightElement?.getBoundingClientRect();

  // Calculate position for the tour box
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1002,
  };

  if (rect) {
    if (step.id === 'step-6') {
      boxStyle.top = `${rect.top + 20}px`;
      boxStyle.left = `${rect.right + 20}px`;
    } else if (rect.top > window.innerHeight / 2) {
      boxStyle.bottom = `${window.innerHeight - rect.top + 20}px`;
      boxStyle.left = `${rect.left}px`;
    } else {
      boxStyle.top = `${rect.bottom + 20}px`;
      boxStyle.left = `${rect.left}px`;
    }
    if (rect.left + 320 > window.innerWidth) {
      boxStyle.right = '20px';
      boxStyle.left = 'auto';
    }
  } else {
    boxStyle.top = '50%';
    boxStyle.left = '50%';
    boxStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      <div className="tour-overlay" onClick={handleClose}>
        {rect && (
          <div
            className="tour-highlight-box"
            style={{
              top: `${rect.top - 8}px`, // 8px padding
              left: `${rect.left - 8}px`,
              width: `${rect.width + 16}px`,
              height: `${rect.height + 16}px`,
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