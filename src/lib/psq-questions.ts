// src/lib/psq-questions.ts

export const PSQ_QUESTIONS = [
  // SECTION 1: Access & Setting
  {
    id: 'q1',
    section: 'Access & Setting',
    text: 'Was the clinical setting appropriate for your consultation?',
    type: 'radio',
    options: ['Yes', 'No', 'Not sure']
  },
  {
    id: 'q2',
    section: 'Access & Setting',
    text: 'Did the consultation happen at a suitable time for you?',
    type: 'radio',
    options: ['Yes', 'No', 'Not applicable']
  },

  // SECTION 2: Communication & Listening
  {
    id: 'q3',
    section: 'Communication & Listening',
    text: 'Did the doctor listen carefully to you?',
    type: 'rating', // Special handling for scoring if needed, but treated as radio here
    options: ['Yes, definitely', 'Yes, to some extent', 'No']
  },
  {
    id: 'q4',
    section: 'Communication & Listening',
    text: 'Did the doctor explain things in a way you could understand?',
    type: 'rating',
    options: ['Yes, definitely', 'Yes, to some extent', 'No']
  },
  {
    id: 'q5',
    section: 'Communication & Listening',
    text: 'Did you feel you had enough time to discuss your concerns?',
    type: 'radio',
    options: ['Yes', 'No']
  },

  // SECTION 3: Trust, Respect & Professionalism
  {
    id: 'q6',
    section: 'Trust & Respect',
    text: 'Did the doctor treat you with kindness and respect?',
    type: 'rating',
    options: ['Yes, always', 'Yes, mostly', 'No']
  },
  {
    id: 'q7',
    section: 'Trust & Respect',
    text: 'Did you feel confident in the doctor’s care and decisions?',
    type: 'rating',
    options: ['Yes, definitely', 'Yes, to some extent', 'No']
  },

  // SECTION 4: Involvement
  {
    id: 'q8',
    section: 'Involvement',
    text: 'Were you involved as much as you wanted to be in decisions about your care?',
    type: 'radio',
    options: ['Yes', 'No', 'Not applicable']
  },
  {
    id: 'q9',
    section: 'Involvement',
    text: 'Did you feel able to ask questions or raise concerns?',
    type: 'radio',
    options: ['Yes', 'No']
  },

  // SECTION 5: Overall
  {
    id: 'q10',
    section: 'Overall Experience',
    text: 'Overall, how would you rate your experience of this consultation?',
    type: 'scale',
    options: ['Very good', 'Good', 'Neither good nor poor', 'Poor', 'Very poor']
  },

  // SECTION 6: Free Text
  {
    id: 'q11',
    section: 'Feedback',
    text: 'What did the doctor do particularly well?',
    type: 'text',
    placeholder: 'e.g. They explained the treatment clearly...'
  },
  {
    id: 'q12',
    section: 'Feedback',
    text: 'Is there anything the doctor could improve?',
    type: 'text',
    placeholder: 'e.g. I would have liked more time...'
  }
];

// Helper to map ratings to scores for analytics (Optional)
export const getScore = (answer: string) => {
    const map: Record<string, number> = {
        'Yes, definitely': 3, 'Yes, always': 3, 'Very good': 5,
        'Yes, to some extent': 2, 'Yes, mostly': 2, 'Good': 4,
        'No': 0, 'Neither good nor poor': 3, 'Poor': 2, 'Very poor': 1
    };
    return map[answer] || 0;
};