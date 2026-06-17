// =======================
// 🔹 Interfaces
// =======================
export interface Student {
  id: string;
  name: string;
  dob: Date;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
}

export interface Resource {
  id: string;
  title: string;
  type: string;
  link: string;
  description: string;
}

export interface Class {
  id: string;
  name: string;
  category: string;
  teacher1: string | null;
  teacher2?: string | null;
  ta1?: string | null;
  ta2?: string | null;
  schedule: Array<string> | string;
  students: Student[];
  resources?: Resource[];
}

export const colorClasses: Record<string, string> = {
  blue: "bg-blue-500 hover:bg-blue-600",
  yellow: "bg-yellow-500 hover:bg-yellow-600",
  orange: "bg-orange-500 hover:bg-orange-600",
};

// 🔹 Danh sách Category mẫu
export const categoryOptions = [
  "Phonics 1",
  "Phonics 2",
  "Phonics 3",
  "Movers",
  "Flyers",
  "Pre-IELTS",
  "IELTS Foundation",
  "IELTS Advanced",
];

// =======================
// 🔹 Dữ liệu lớp học mẫu
// =======================
export const initialData: Class[] = [
  {
    id: "CLS-001",
    name: "IELTS Foundation A",
    category: "IELTS Foundation",
    teacher1: "Ms. Vy",
    teacher2: "Mr. Quang",
    ta1: "Ms. Hanh",
    schedule: ["Mon 17:30–19:00", "Thu 17:30–19:00"],
    students: [
      {
        id: "STU-001",
        name: "Nguyen Minh Anh",
        dob: new Date(2007, 5, 10),
        gender: "Female",
        email: "wewineduca@gmail.com",
        phone: "0905123456",
        address: "District 3, HCMC",
        status: "Active",
      },
      {
        id: "STU-002",
        name: "Tran Duc Nam",
        dob: new Date(2008, 1, 20),
        gender: "Male",
        email: "nam.tran@example.com",
        phone: "0906789123",
        address: "District 5, HCMC",
        status: "Active",
      },
      {
        id: "STU-003",
        name: "Le Bao Han",
        dob: new Date(2006, 11, 8),
        gender: "Female",
        email: "han.le@example.com",
        phone: "0903456789",
        address: "District 10, HCMC",
        status: "Inactive",
      },
    ],
    resources: [
      {
        id: "RES-001",
        title: "IELTS Foundation - Vocabulary Set 1",
        type: "Google Drive",
        link: "https://drive.google.com/ielts-vocab-set1",
        description: "Essential vocabulary for IELTS Foundation learners.",
      },
      {
        id: "RES-002",
        title: "IELTS Listening Practice A1",
        type: "YouTube",
        link: "https://youtube.com/ielts-listening-a1",
        description: "Interactive listening practice with audio exercises.",
      },
      {
        id: "RES-003",
        title: "Writing Task 1 Samples",
        type: "Google Docs",
        link: "https://docs.google.com/ielts-writing-samples",
        description: "Model essays for Writing Task 1 with feedback.",
      },
    ],
  },
  {
    id: "CLS-002",
    name: "Phonics 3",
    category: "Phonics",
    teacher1: "Ms. Daisy",
    ta1: "Mr. Duy",
    schedule: ["Sat 08:00–09:30", "Sun 08:00–09:30"],
    students: [
      {
        id: "STU-004",
        name: "Pham Bao Tin",
        dob: new Date(2016, 3, 25),
        gender: "Male",
        phone: "0906789112",
        address: "Go Vap, HCMC",
        status: "Active",
      },
      {
        id: "STU-005",
        name: "Le My Anh",
        dob: new Date(2015, 9, 12),
        gender: "Female",
        phone: "0905123789",
        address: "Tan Binh, HCMC",
        status: "Active",
      },
    ],
    resources: [
      {
        id: "RES-010",
        title: "Phonics Flashcards A–Z",
        type: "PDF",
        link: "https://drive.google.com/phonics-flashcards",
        description: "Printable phonics cards with colorful pictures.",
      },
      {
        id: "RES-011",
        title: "Alphabet Song",
        type: "YouTube",
        link: "https://youtube.com/alphabet-song",
        description: "Sing-along video to learn English letter sounds.",
      },
    ],
  },
  {
    id: "CLS-003",
    name: "Movers 2",
    category: "Cambridge Movers",
    teacher1: "Mr. Hung",
    ta1: "Ms. Linh",
    schedule: ["Tue 17:00–18:30", "Fri 17:00–18:30"],
    students: [
      {
        id: "STU-006",
        name: "Hoang Gia Bao",
        dob: new Date(2014, 7, 22),
        gender: "Male",
        status: "Active",
      },
      {
        id: "STU-007",
        name: "Tran Khanh Vy",
        dob: new Date(2013, 10, 3),
        gender: "Female",
        status: "Active",
      },
    ],
    resources: [
      {
        id: "RES-020",
        title: "Cambridge Movers Flashcards",
        type: "PDF",
        link: "https://drive.google.com/movers-flashcards",
        description: "Vocabulary flashcards for Cambridge Movers students.",
      },
      {
        id: "RES-021",
        title: "Listening Practice Set 2",
        type: "YouTube",
        link: "https://youtube.com/movers-listening2",
        description: "Fun listening lessons for young learners.",
      },
    ],
  },
  {
    id: "CLS-004",
    name: "Pre-IELTS B",
    category: "IELTS",
    teacher1: "Mr. John",
    ta1: "Ms. Hoa",
    schedule: ["Wed 18:00–19:30", "Sat 09:00–10:30"],
    students: [
      {
        id: "STU-008",
        name: "Nguyen Thanh Phuc",
        dob: new Date(2007, 1, 9),
        gender: "Male",
        email: "phuc.nguyen@example.com",
        phone: "0906777788",
        address: "Thu Duc City",
        status: "Active",
      },
      {
        id: "STU-009",
        name: "Do Thi Lan Anh",
        dob: new Date(2006, 9, 4),
        gender: "Female",
        email: "lananh.do@example.com",
        phone: "0906888999",
        address: "District 4, HCMC",
        status: "Active",
      },
    ],
    resources: [
      {
        id: "RES-030",
        title: "Grammar Essentials for IELTS",
        type: "PDF",
        link: "https://drive.google.com/ielts-grammar",
        description: "Core grammar lessons with clear explanations.",
      },
      {
        id: "RES-031",
        title: "Speaking Practice - Common Topics",
        type: "Padlet",
        link: "https://padlet.com/ielts-speaking-topics",
        description: "Sample answers and topic vocabulary collection.",
      },
      {
        id: "RES-032",
        title: "IELTS Reading Practice Set 3",
        type: "Google Drive",
        link: "https://drive.google.com/ielts-reading3",
        description: "Reading comprehension passages with questions.",
      },
    ],
  },
];
