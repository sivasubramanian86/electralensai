/**
 * ElectraLensAI — Civic Knowledge Mocks.
 * Fallback data for instant UI population while agents stream.
 */

export const CIVIC_MOCKS = {
  timeline: {
    US: {
      next_event: "Voter Registration Deadline",
      date: "October 7, 2026",
      days_left: 165,
      phases: [
        { id: 1, label: "Registration Phase", status: "active", dates: "Sept - Oct" },
        { id: 2, label: "Early Voting", status: "upcoming", dates: "Oct - Nov" },
        { id: 3, label: "Election Day", status: "upcoming", dates: "Nov 3, 2026" }
      ]
    },
    IN: {
      next_event: "State Assembly Registration",
      date: "May 15, 2026",
      days_left: 20,
      phases: [
        { id: 1, label: "Draft Roll Publication", status: "completed", dates: "Jan - Feb" },
        { id: 2, label: "Claims & Objections", status: "active", dates: "Mar - May" },
        { id: 3, label: "Final Roll Release", status: "upcoming", dates: "May 25, 2026" }
      ]
    }
  },
  rumors: [
    {
      claim: "You can vote via text message in 2026.",
      verdict: "FALSE",
      explanation: "No jurisdiction in the US or India allows voting via SMS. All votes must be cast in person or via official mail-in/absentee ballots.",
      source: "Election Commission / Secretary of State"
    },
    {
      claim: "Election Day is being moved to Wednesday.",
      verdict: "FALSE",
      explanation: "Election Day remains the first Tuesday after the first Monday in November for US Federal elections.",
      source: "Federal Law"
    }
  ],
  flashcards: [
    {
      id: 1,
      question: "What is a 'Voter ID'?",
      answer: "A government-issued document (like a driver's license or Aadhar card) used to verify your identity at the polls.",
      category: "Basics"
    },
    {
      id: 2,
      question: "What does 'Gerrymandering' mean?",
      answer: "The practice of drawing electoral district boundaries to give one political party an unfair advantage.",
      category: "Advanced"
    },
    {
      id: 3,
      question: "What is an 'Absentee Ballot'?",
      answer: "A ballot completed and typically mailed in advance of an election by a voter who is unable to be present at the polls.",
      category: "Basics"
    }
  ],
  quiz: [
    {
      id: 1,
      question: "Which of these is NOT a valid form of voter ID in most states?",
      options: ["Passport", "Driver's License", "Library Card", "Military ID"],
      correct: 2,
      explanation: "In most jurisdictions, a library card is not considered a valid government-issued photo ID for voting."
    },
    {
      id: 2,
      question: "At what age are you eligible to register to vote in most regions?",
      options: ["16", "18", "21", "25"],
      correct: 1,
      explanation: "The standard voting age is 18 in the vast majority of modern democracies."
    }
  ]
};
