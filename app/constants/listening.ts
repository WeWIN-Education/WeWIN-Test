export const listeningTable = [
  {
    name: { text: "The Junction" },
    location: { text: "Greyson Street, near the station" },
    reason: [
      { text: "Good for people who are especially keen on __________", q: 1 },
    ],
    comments: [
      { text: "Quite expensive" },
      { text: "The __________ is a good place for a drink", q: 2 },
    ],
  },
  {
    name: { text: "Paloma" },
    location: { text: "In Bow Street next to the cinema" },
    reason: [{ text: "__________ food, good for sharing", q: 3 }],
    comments: [
      { text: "Need to pay £50 deposit" },
      { text: "A limited selection of __________ food on menu", q: 4 },
    ],
  },
  {
    name: { text: "The __________", q: 5 },
    location: { text: "At the top of a __________", q: 6 },
    reason: [
      { text: "A famous chef" },
      { text: "All the __________ are very good", q: 7 },
      { text: "Only uses __________ ingredients", q: 8 },
    ],
    comments: [
      { text: "Set lunch costs £ __________ per person", q: 9 },
      { text: "Portions probably of __________ size", q: 10 },
    ],
  },
];

export const listeningPart2 = {
  questions11to16: [
    {
      q: 11,
      question:
        "Heather says pottery differs from other art forms because ____.",
      options: {
        A: "it lasts longer in the ground.",
        B: "it is practised by more people.",
        C: "it can be repaired more easily.",
      },
    },
    {
      q: 12,
      question:
        "Archaeologists sometimes identify the use of ancient pottery from",
      options: {
        A: "the clay it was made with.",
        B: "the marks that are on it.",
        C: "the basic shape of it.",
      },
    },
    {
      q: 13,
      question: "Some people join Heather’s pottery class because they want to",
      options: {
        A: "create an item that looks very old.",
        B: "find something that they are good at.",
        C: "make something that will outlive them.",
      },
    },
    {
      q: 14,
      question: "What does Heather value most about being a potter?",
      options: {
        A: "its calming effect",
        B: "its messy nature",
        C: "its physical benefits",
      },
    },
    {
      q: 15,
      question: "Most of the visitors to Edelman Pottery",
      options: {
        A: "bring friends to join courses.",
        B: "have never made a pot before.",
        C: "try to learn techniques too quickly.",
      },
    },
    {
      q: 16,
      question: "Heather reminds her visitors that they should",
      options: {
        A: "put on their aprons.",
        B: "change their clothes.",
        C: "take off their jewellery.",
      },
    },
  ],

  questions17to18: {
    title: "Which TWO things does Heather explain about kilns?",
    options: {
      A: "what their function is",
      B: "when they were invented",
      C: "ways of keeping them safe",
      D: "where to put one in your home",
      E: "what some people use instead of one",
    },
    answers: [17, 18],
  },

  questions19to20: {
    title: "Which TWO points does Heather make about a potter’s tools?",
    options: {
      A: "Some are hard to hold.",
      B: "Some are worth buying.",
      C: "Some are essential items.",
      D: "Some have memorable names.",
      E: "Some are available for use by participants.",
    },
    answers: [19, 20],
  },
};
