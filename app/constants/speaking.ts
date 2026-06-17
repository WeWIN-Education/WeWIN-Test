export interface IELTSQuestionSet {
  part1: string[];
  part2: { topic: string; bullets: string[]; followUp: string };
  part3: { reading: string; questions: string[] };
}

const FALLBACK_SETS: IELTSQuestionSet[] = [
  {
    part1: [
      "What do you like to do in your free time?",
      "Do you prefer spending time alone or with others? Why?",
      "Has your free time changed compared to when you were younger?",
    ],
    part2: {
      topic: "Describe a place you enjoy visiting.",
      bullets: [
        "where it is",
        "how often you go there",
        "what you do there",
        "why you enjoy it",
      ],
      followUp: "Would you recommend this place to a friend?",
    },
    part3: {
      reading:
        "Many people today travel more frequently than in the past. Tourism has become an important part of modern life and local economies.",
      questions: [
        "What are the benefits of tourism for a country?",
        "Do you think tourism can have negative effects? Why?",
      ],
    },
  },
  {
    part1: [
      "Do you enjoy reading books? What kind of books do you like?",
      "Did you read a lot when you were a child?",
      "Do you think reading is important for students?",
    ],
    part2: {
      topic: "Describe a skill you would like to learn.",
      bullets: [
        "what the skill is",
        "why you want to learn it",
        "how you would learn it",
        "how useful it would be for you",
      ],
      followUp: "Is it easy to learn new skills as an adult?",
    },
    part3: {
      reading:
        "Lifelong learning is becoming more common as technology and jobs change quickly. Many adults return to study to improve their careers.",
      questions: [
        "Why is continuous learning important in modern society?",
        "Should governments support adult education? How?",
      ],
    },
  },
];

export function getFallbackSpeakingQuestions(): IELTSQuestionSet {
  const index = Math.floor(Math.random() * FALLBACK_SETS.length);
  return FALLBACK_SETS[index];
}
