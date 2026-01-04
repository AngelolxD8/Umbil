export type PSQQuestion = {
  id: string;
  text: string;
  domain: string;
  description: string;
};

export const PSQ_QUESTIONS: PSQQuestion[] = [
  {
    id: "1",
    text: "Making you feel at ease...",
    domain: "Interpersonal Skills",
    description: "Being friendly and warm towards you, treating you with respect; not cold or abrupt.",
  },
  {
    id: "2",
    text: "Letting you tell 'your' story...",
    domain: "Communication",
    description: "Giving you time to fully describe your illness in your own words; not interrupting or diverting you.",
  },
  {
    id: "3",
    text: "Really listening...",
    domain: "Communication",
    description: "Paying close attention to what you were saying; not looking at the notes or computer as you were talking.",
  },
  {
    id: "4",
    text: "Being interested in you as a whole person...",
    domain: "Empathy",
    description: "Asking/knowing relevant details about your life, your situation; not treating you as 'just a number'.",
  },
  {
    id: "5",
    text: "Fully understanding your concerns...",
    domain: "Communication",
    description: "Communicating that he/she had accurately understood your concerns; not overlooking or dismissing anything.",
  },
  {
    id: "6",
    text: "Showing care and compassion...",
    domain: "Empathy",
    description: "Seeming genuinely concerned, connecting with you on a human level; not being indifferent or detached.",
  },
  {
    id: "7",
    text: "Being positive...",
    domain: "Professionalism",
    description: "Having a positive approach and a positive attitude; being honest but not negative about your problems.",
  },
  {
    id: "8",
    text: "Explaining things clearly...",
    domain: "Clinical Care",
    description: "Fully answering your questions, explaining clearly, giving you adequate information; not being vague.",
  },
  {
    id: "9",
    text: "Helping you to take control...",
    domain: "Management",
    description: "Exploring with you what you can do to improve your health yourself; encouraging rather than lecturing you.",
  },
  {
    id: "10",
    text: "Making a plan of action with you...",
    domain: "Management",
    description: "Discussing the options, involving you in decisions as much as you want to be involved; not ignoring your views.",
  },
  {
    id: "11",
    text: "Did you have confidence in the doctor?",
    domain: "Trust",
    description: "Feeling that the doctor was competent and that you could trust their judgment regarding your care.",
  },
  {
    id: "12",
    text: "Overall satisfaction with this consultation",
    domain: "General",
    description: "Taking all factors into account, how would you rate your experience with this doctor today?",
  },
];