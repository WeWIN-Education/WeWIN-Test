export const CAMBRIDGE_LEVELS = [
  "Starters",
  "Movers",
  "Flyers",
  "KET",
] as const;

export type CambridgeLevel = (typeof CAMBRIDGE_LEVELS)[number];

export const CAMBRIDGE_QUESTION_BANK: Record<CambridgeLevel, string[]> = {
  Starters: [
    "I have a brother and a sister.",
    "I like playing football with my friends.",
  ],
  Movers: [
    "There is a big playground near my school, and I often play there after class.",
    "Yesterday, I helped my mother make dinner and set the table.",
  ],
  Flyers: [
    "When I have free time, I enjoy reading books because they help me learn new things.",
    "Last summer, my family travelled to the beach, and we spent several days swimming and taking photos.",
  ],
  KET: [
    "I have recently joined an English club, and it has helped me improve my communication skills.",
    "Although I was nervous at first, I felt much more confident after speaking in front of my class.",
  ],
};
