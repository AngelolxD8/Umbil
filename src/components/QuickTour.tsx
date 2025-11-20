// src/components/QuickTour.tsx
"use client";

// Define the steps of our tour
const tourSteps = [
  // STEP 0: Ask
  {
    id: "step-0",
    title: "1. Ask Your Question",
    text: "Start here. You can ask anything—clinical questions, drug dosages, or reflective prompts.",
    highlightId: "tour-highlight-askbar", 
  },
  // STEP 1: Styles
  {
    id: "step-1",
    title: "2. Choose Your Depth",
    text: "Need a quick answer for the ward or a detailed explanation for study? Switch between 'Clinic', 'Standard', and 'Deep Dive' modes here.",
    highlightId: "tour-highlight-style-dropdown", 
  },
  // STEP 2: Answer
  {
    id: "step-2",
    title: "3. Get Your Answer",
    text: "Umbil provides a concise, evidence-based answer. Now, let's turn this knowledge into a permanent record.",
    highlightId: "tour-highlight-message", 
  },
  // STEP 3: Log (UPDATED TEXT)
  {
    id: "step-3",
    title: "4. Log Learning",
    text: "Click 'Log learning (CPD)' to save this interaction. This keeps your streak alive and builds your professional portfolio automatically.",
    highlightId: "tour-highlight-cpd-button", 
  },
  // STEP 4: Reflect
  {
    id: "step-4",
    title: "5. Reflect & Save",
    text: "Write your own notes or click 'Generate' to let AI create a GMC-compliant reflection for you. Click 'Save' to finish.",
    highlightId: "tour-highlight-modal", 
  },
  // STEP 5: PDP Info
  {
    id: "step-5",
    title: "6. Automated PDP Goals",
    text: "Umbil works in the background. If you tag a topic (e.g., 'Asthma') 7 times, we'll automatically suggest a Personal Development Plan goal to help formalize your learning.",
    highlightId: null, 
  },
  // STEP 6: Sidebar (UPDATED TEXT)
  {
    id: "step-6",
    title: "7. Explore Analytics",
    text: "Open the menu to see your learning turn into visual charts. Track your GMC domain coverage, clinical topics, and maintain your streaks!",
    highlightId: "tour-highlight-sidebar", 
  },
  // STEP 7: Finish
  {
    id: "step-7",
    title: "You're all set!",
    text: "You can re-take this tour anytime from the menu. Happy learning!",
    highlightId: null,
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
  const highlightElement = step.highlightId ? document.getElementById(step.highlightId) : null;
  const rect = highlightElement?.getBoundingClientRect();

  // Calculate position for the tour box
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1002,
  };

  if (rect) {
    if (step.id === 'step-6') { // Sidebar specific positioning
      boxStyle.top = `${rect.top + 20}px`;
      boxStyle.left = `${rect.right + 20}px`;
    } else if (rect.top > window.innerHeight / 2) {
      boxStyle.bottom = `${window.innerHeight - rect.top + 20}px`;
      boxStyle.left = `${rect.left}px`;
    } else {
      boxStyle.top = `${rect.bottom + 20}px`;
      boxStyle.left = `${rect.left}px`;
    }
    // Prevent overflow on right edge
    if (rect.left + 320 > window.innerWidth) {
      boxStyle.right = '20px';
      boxStyle.left = 'auto';
    }
  } else {
    // Center screen fallback
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
              top: `${rect.top - 8}px`, 
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