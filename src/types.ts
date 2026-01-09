
export enum AppDepartment {
  LANDING = 'LANDING',
  CREATE = 'CREATE',
  SHOP = 'SHOP',
  LEARN = 'LEARN'
}

export enum AppStep {
  CONFIG = 'CONFIG',
  TOPICS = 'TOPICS',
  RESULT = 'RESULT',
}

export enum AppView {
  HOME = 'HOME', // Now refers to the 'Create' dept home (slider)
  GENERATOR = 'GENERATOR',
  PRICING = 'PRICING',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN'
}

export enum CreationMode {
  EXPLORER = 'EXPLORER',
  TRANSFORMER = 'TRANSFORMER'
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  sourceContent?: string; // Extracted raw material from user input
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  TALL = '9:16',
  WIDE = '16:9',
  // Print Formats (Mapped to closest supported ratio in service)
  A4_PORTRAIT = 'A4_PORTRAIT',
  A4_LANDSCAPE = 'A4_LANDSCAPE',
  LETTER_PORTRAIT = 'LETTER_PORTRAIT',
  LETTER_LANDSCAPE = 'LETTER_LANDSCAPE'
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

// Simplified User interface for the app to use
export interface AppUser {
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
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}

export interface PresentationSlide {
  title: string;
  content: string[]; 
  speakerNotes: string; 
  visualPrompt: string; // The instruction for the image generator
  imageUrl?: string; // The generated base64 image for this specific slide
  type: 'title' | 'content' | 'section' | 'conclusion';
}

export interface ShortsScene {
  id: number;
  headline: string; // The big text on screen (visual anchor)
  voiceScript: string; // The exact spoken words (also shown as captions)
  visualPrompt: string;
  imageUrl?: string;
  audioUrl?: string; // Blob URL for the voiceover
  duration?: number; // Estimated duration
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
  quizData?: QuizQuestion[];
  presentationData?: PresentationSlide[];
  shortsData?: ShortsScene[];
  qrConfig?: QrConfig;
}

export interface SystemConfig {
  systemPrompt: string;
  temperature: number;
  safetyThreshold: string;
  imageModel: string;
  maintenanceMode: boolean;
}

// --- SHOP TYPES ---
export interface ShopBundle {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  subject: string;
  level: string;
  format: 'Infographics' | 'Mindmaps';
  itemCount: number;
  thumbnailUrl: string; // Main stack image
  gallery: string[]; // Preview images
  description: string;
  features: string[];
}

export const SUBJECTS = [
  "Accounting", "Advertising", "Aeronautics", "African Studies", "Agriculture", "Agronomy", 
  "American History", "Anatomy", "Animal Science", "Anthropology", "Archaeology", "Architecture", 
  "Art History", "Artificial Intelligence", "Asian Studies", "Astronomy", "Astrophysics", 
  "Atmospheric Science", "Banking", "Behavioral Science", "Biochemistry", "Bioethics", 
  "Biology", "Biomedical Engineering", "Biotechnology", "Botany", "Business Administration", 
  "Business Ethics", "Business Law", "Calculus", "Cardiology", "Cell Biology", "Chemical Engineering", 
  "Chemistry", "Child Development", "Cinematography", "Civil Engineering", "Civil Rights", 
  "Classical Civilization", "Climate Change", "Cognitive Science", "Communications", 
  "Comparative Literature", "Computer Engineering", "Computer Graphics", "Computer Science", 
  "Conflict Resolution", "Consumer Behavior", "Creative Writing", "Criminal Justice", 
  "Criminology", "Cryptography", "Cultural Studies", "Cybersecurity", "Dance Theory", 
  "Data Science", "Dentistry", "Dermatology", "Design Thinking", "Developmental Psychology", 
  "Digital Marketing", "Diplomacy", "Earth Science", "Ecology", "Econometrics", "Economics", 
  "Education Policy", "Educational Psychology", "Electrical Engineering", "Endocrinology", 
  "Energy Policy", "Engineering", "English Literature", "Entomology", "Entrepreneurship", 
  "Environmental Engineering", "Environmental Law", "Environmental Science", "Epidemiology", 
  "Ethics", "European History", "Evolutionary Biology", "Fashion Design", "Film Studies", 
  "Finance", "Fine Arts", "Food Science", "Forensic Science", "Forestry", "Game Design", 
  "Game Theory", "Gastroenterology", "Gender Studies", "General Science", "Genetics", "Geography", 
  "Geology", "Geometry", "Geophysics", "Gerontology", "Global Health", "Global Studies", 
  "Graphic Design", "Health Administration", "Health Science", "Hematology", "History - Ancient", 
  "History - Medieval", "History - Modern", "History - World", "Horticulture", "Hospitality Management", 
  "Human Computer Interaction", "Human Resources", "Human Rights", "Immunology", "Industrial Design", 
  "Industrial Engineering", "Information Systems", "Information Technology", "Inorganic Chemistry", 
  "International Business", "International Law", "International Relations", "Investment Banking", 
  "Journalism", "Kinesiology", "Landscape Architecture", "Latin American Studies", "Law", 
  "Leadership Studies", "Library Science", "Linguistics", "Literature", "Logic", "Logistics", 
  "Macroeconomics", "Management", "Marine Biology", "Marketing", "Materials Science", 
  "Mathematics", "Mechanical Engineering", "Media Studies", "Medicine", "Meteorology", 
  "Microbiology", "Microeconomics", "Military History", "Molecular Biology", "Music History", 
  "Music Theory", "Mythology", "Nanotechnology", "Nephrology", "Neuroscience", "Nuclear Physics", 
  "Nursing", "Nutrition", "Oceanography", "Oncology", "Operations Research", "Organic Chemistry", 
  "Organizational Behavior", "Ornithology", "Paleontology", "Pathology", "Pediatrics", 
  "Performing Arts", "Petroleum Engineering", "Pharmacology", "Philosophy", "Photography", 
  "Physical Education", "Physical Therapy", "Physics", "Physiology", "Planetary Science", 
  "Political Economy", "Political Science", "Probability", "Project Management", "Psychiatry", 
  "Psychology", "Public Administration", "Public Health", "Public Policy", "Public Relations", 
  "Quantum Mechanics", "Radiology", "Real Estate", "Religious Studies", "Renewable Energy", 
  "Robotics", "Social Work", "Sociology", "Software Engineering", "Soil Science", "Space Science", 
  "Special Education", "Sports Management", "Sports Science", "Statistics", "Strategic Management", 
  "Supply Chain Management", "Sustainability", "Systems Engineering", "Taxation", "Telecommunications", 
  "Theater", "Theology", "Thermodynamics", "Tourism", "Toxicology", "Urban Planning", "Urology", 
  "Veterinary Science", "Virology", "Web Development", "Women's Studies", "World Religions", 
  "Writing", "Zoology"
].sort();

export const LEVELS = [
  "Kindergarten", "Grade 1-3", "Grade 4-6", "Middle School", "High School", "Undergraduate", "Graduate", "Professional", "General Audience"
];

export const ASPECT_RATIOS = [
  { value: AspectRatio.SQUARE, label: "Square (1:1)" },
  { value: AspectRatio.PORTRAIT, label: "Portrait (3:4)" },
  { value: AspectRatio.LANDSCAPE, label: "Landscape (4:3)" },
  { value: AspectRatio.TALL, label: "Story (9:16)" },
  { value: AspectRatio.WIDE, label: "Presentation (16:9)" },
  { value: AspectRatio.A4_PORTRAIT, label: "A4 Portrait" },
  { value: AspectRatio.A4_LANDSCAPE, label: "A4 Landscape" },
  { value: AspectRatio.LETTER_PORTRAIT, label: "US Letter Portrait" },
  { value: AspectRatio.LETTER_LANDSCAPE, label: "US Letter Landscape" },
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


















