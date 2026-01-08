
export enum AppStep {
  CONFIG = 'CONFIG',
  TOPICS = 'TOPICS',
  RESULT = 'RESULT',
}

export enum AppView {
  HOME = 'HOME',
  GENERATOR = 'GENERATOR',
  PRICING = 'PRICING',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN',
  QUIZ = 'QUIZ'
}

export interface Topic {
  id: string;
  title: string;
  description: string;
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  TALL = '9:16',
  WIDE = '16:9'
}

export enum InfographicFormat {
  STANDARD = 'Standard',
  MINDMAP = 'Mindmap',
  FLOWCHART = 'Flowchart'
}

export enum ImageResolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K'
}

export enum QrPosition {
  TOP_LEFT = 'Top Left',
  TOP_RIGHT = 'Top Right',
  BOTTOM_LEFT = 'Bottom Left',
  BOTTOM_RIGHT = 'Bottom Right'
}

export interface QrConfig {
  enabled: boolean;
  url: string;
  footnote: string;
  position: QrPosition;
}

// Mimic Firebase User interface to avoid import errors
export interface FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface HistoryItem {
  id: string;
  userId?: string;
  topic: Topic;
  subject: string;
  level: string;
  imageUrl: string;
  storagePath?: string; 
  prompt: string;
  timestamp: number;
  format: InfographicFormat;
  articleData?: {
    summary: string;
    article: string;
  };
  transcript?: string;
  qrConfig?: QrConfig;
  quizData?: QuizQuestion[];
}

export interface SystemConfig {
  systemPrompt: string;
  temperature: number;
  safetyThreshold: string;
  imageModel: string;
  maintenanceMode: boolean;
}

export const SUBJECTS = [
  "Accounting", "Aeronautics", "Agriculture", "Anatomy", "Anthropology", "Archaeology", 
  "Architecture", "Art History", "Artificial Intelligence", "Astronomy", "Astrophysics", 
  "Biochemistry", "Biology", "Botany", "Business Administration", "Calculus", "Chemistry", 
  "Civil Engineering", "Classics", "Communications", "Computer Science", "Criminal Justice", 
  "Cybersecurity", "Data Science", "Dentistry", "Design", "Earth Science", "Ecology", 
  "Economics", "Education", "Electrical Engineering", "Engineering", "Entomology", 
  "Entrepreneurship", "Environmental Science", "Ethics", "Film Studies", "Finance", 
  "Forensic Science", "Forestry", "Genetics", "Geography", "Geology", "Geometry", 
  "Global Studies", "Graphic Design", "Health Science", "History - Ancient", 
  "History - Medieval", "History - Modern", "History - World", "Human Rights", 
  "Information Technology", "International Relations", "Journalism", "Kinesiology", "Law", 
  "Linguistics", "Literature", "Logistics", "Macroeconomics", "Management", "Marketing", 
  "Materials Science", "Mathematics", "Mechanical Engineering", "Media Studies", "Medicine", 
  "Meteorology", "Microbiology", "Microeconomics", "Music Theory", "Mythology", 
  "Neuroscience", "Nursing", "Nutrition", "Oceanography", "Paleontology", "Pharmacology", 
  "Philosophy", "Photography", "Physics", "Physiology", "Political Science", 
  "Project Management", "Psychology", "Public Health", "Public Relations", "Religious Studies", 
  "Robotics", "Social Work", "Sociology", "Software Engineering", "Space Science", 
  "Sports Science", "Statistics", "Sustainability", "Theater", "Theology", "Tourism", 
  "Urban Planning", "Veterinary Science", "Web Development", "Women's Studies", "Zoology"
].sort();

export const LEVELS = [
  "Grade 1-3", "Grade 4-6", "Middle School", "High School", "Undergraduate", "Graduate", "Professional"
];

export const ASPECT_RATIOS = [
  { value: AspectRatio.SQUARE, label: "Square (1:1)" },
  { value: AspectRatio.PORTRAIT, label: "Portrait (3:4)" },
  { value: AspectRatio.LANDSCAPE, label: "Landscape (4:3)" },
  { value: AspectRatio.TALL, label: "Story (9:16)" },
  { value: AspectRatio.WIDE, label: "Presentation (16:9)" },
];

export const QR_POSITIONS = [
  { value: QrPosition.BOTTOM_RIGHT, label: "Bottom Right" },
  { value: QrPosition.BOTTOM_LEFT, label: "Bottom Left" },
  { value: QrPosition.TOP_RIGHT, label: "Top Right" },
  { value: QrPosition.TOP_LEFT, label: "Top Left" },
];

export const FORMATS = [
  { value: InfographicFormat.STANDARD, label: "Standard Infographic" },
  { value: InfographicFormat.MINDMAP, label: "Mindmap (Pro)" },
  { value: InfographicFormat.FLOWCHART, label: "Flowchart (Pro)" },
];

export const RESOLUTIONS = [
  { value: ImageResolution.RES_1K, label: "Standard (1K)" },
  { value: ImageResolution.RES_2K, label: "High Definition (2K) - Pro" },
  { value: ImageResolution.RES_4K, label: "Ultra HD (4K) - Pro" },
];






