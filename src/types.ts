
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
  HOME = 'HOME', 
  GENERATOR = 'GENERATOR',
  PRICING = 'PRICING',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN',
  PRODUCT = 'PRODUCT',
  CART = 'CART'
}

export enum CreationMode {
  EXPLORER = 'EXPLORER',
  TRANSFORMER = 'TRANSFORMER'
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  sourceContent?: string; 
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  TALL = '9:16',
  WIDE = '16:9',
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

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; 
  explanation: string;
}

export interface PresentationSlide {
  title: string;
  content: string[]; 
  speakerNotes: string; 
  visualPrompt: string; 
  imageUrl?: string; 
  type: 'title' | 'content' | 'section' | 'conclusion';
}

export interface ShortsScene {
  id: number;
  headline: string; 
  voiceScript: string; 
  visualPrompt: string;
  imageUrl?: string;
  audioUrl?: string; 
  duration?: number; 
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
  thumbnailUrl: string; 
  gallery: string[]; 
  description: string;
  features: string[];
}

export interface CartItem {
  bundle: ShopBundle;
  quantity: number;
}

const COMMON_SUBJECTS = [
  "General Science", 
  "Geography", 
  "History", 
  "Mathematics", 
  "Biology", 
  "Chemistry", 
  "Physics", 
  "Computer Science", 
  "Economics", 
  "Business Studies",
  "English Literature",
  "Art & Design",
  "Environmental Science",
  "Social Studies"
];

const OTHER_SUBJECTS = [
  "Accounting", "Acoustics", "Advertising", "Aeronautics", "African History", "Agriculture", 
  "Algebra", "American Literature", "Anatomy", "Ancient Civilizations", "Animal Behavior", 
  "Anthropology", "Applied Ethics", "Applied Mathematics", "Archaeology", "Architecture", 
  "Artificial Intelligence", "Asian Studies", "Astronomy", "Astrophysics", "Atmospheric Science", 
  "Bacteriology", "Behavioral Economics", "Biochemistry", "Bioethics", "Bioinformatics", 
  "Biomedical Science", "Biophysics", "Biotechnology", "Botany", "Calculus", "Cardiology", 
  "Cell Biology", "Chemical Engineering", "Chinese Language", "Cinematography", "Civil Engineering", 
  "Classical Literature", "Climate Change", "Cognitive Psychology", "Communications", 
  "Comparative Politics", "Construction Management", "Cosmology", "Creative Writing", 
  "Criminal Justice", "Criminology", "Cryptography", "Cultural Anthropology", "Cybersecurity", 
  "Data Science", "Demography", "Dentistry", "Developmental Biology", "Digital Marketing", 
  "Earth Science", "Ecology", "Education Policy", "Electrical Engineering", "Electronics", 
  "Embryology", "Endocrinology", "Engineering Design", "Entomology", "Epidemiology", 
  "Ethnomusicology", "European History", "Evolutionary Biology", "Family Law", "Fashion Design", 
  "Film Theory", "Finance", "Fine Arts", "Fluid Dynamics", "Food Science", "Forensic Science", 
  "Forestry", "French Literature", "Game Design", "Game Theory", "Gender Studies", "Genetics", 
  "Geology", "Geophysics", "German Language", "Global Health", "Graphic Design", "Human Anatomy", 
  "Human Geography", "Human Rights", "Hydrology", "Immunology", "Industrial Design", 
  "Infectious Diseases", "Information Technology", "International Law", "International Relations", 
  "Japanese Language", "Journalism", "Kinesiology", "Latin Language", "Linguistics", 
  "Macroeconomics", "Marine Biology", "Marketing", "Materials Science", "Mechanical Engineering", 
  "Media Studies", "Medical Ethics", "Medicine", "Medieval History", "Meteorology", 
  "Microbiology", "Microeconomics", "Military Science", "Molecular Biology", "Museum Studies", 
  "Music Theory", "Mythology", "Nanotechnology", "Neuroscience", "Nuclear Physics", 
  "Nursing", "Nutrition", "Oceanography", "Oncology", "Operations Research", "Optics", 
  "Organic Chemistry", "Organizational Behavior", "Paleontology", "Parasitology", "Pathology", 
  "Performing Arts", "Petroleum Engineering", "Pharmacology", "Philosophy", "Photography", 
  "Physical Chemistry", "Physical Education", "Physical Therapy", "Physiology", "Planetary Science", 
  "Plant Science", "Political Science", "Polymer Science", "Probability", "Psychiatry", 
  "Psychology", "Public Health", "Public Policy", "Quantum Mechanics", "Radiology", "Real Estate", 
  "Religious Studies", "Renewable Energy", "Robotics", "Social Work", "Sociology", 
  "Software Engineering", "Soil Science", "Space Exploration", "Spanish Literature", 
  "Sports Medicine", "Statistics", "Sustainability", "Systems Engineering", "Taxation", 
  "Telecommunications", "Theater History", "Theology", "Theoretical Physics", "Thermodynamics", 
  "Toxicology", "Urban Planning", "Veterinary Medicine", "Virology", "Web Development", 
  "Wildlife Biology", "Women's Studies", "World History", "World Religions", "Zoology"
].sort();

export const SUBJECTS = [...COMMON_SUBJECTS, ...OTHER_SUBJECTS];

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


























