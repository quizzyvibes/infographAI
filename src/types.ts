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

const STEM = [
  "Aerospace Engineering", "Algebra", "Algorithms", "Anatomy", "Artificial Intelligence", "Astronomy", "Astrophysics", "Atmospheric Science", "Biochemistry", "Bioinformatics", "Biology", "Biomechanics", "Biotechnology", "Botany", "Calculus", "Cell Biology", "Chemistry", "Civil Engineering", "Climate Science", "Computer Science", "Cybersecurity", "Data Science", "Ecology", "Electrical Engineering", "Environmental Science", "Genetics", "Geology", "Geometry", "Mathematics", "Microbiology", "Neuroscience", "Nuclear Physics", "Oceanography", "Organic Chemistry", "Physics", "Quantum Mechanics", "Robotics", "Software Engineering", "Space Science", "Statistics", "Thermodynamics", "Virology", "Zoology"
];

const HUMANITIES = [
  "African History", "American Literature", "Ancient History", "Anthropology", "Archaeology", "Art History", "Classical Studies", "Communication Studies", "Comparative Literature", "Creative Writing", "Cultural Studies", "Ethics", "European History", "Film Studies", "History", "Linguistics", "Literature", "Media Studies", "Medieval History", "Music Theory", "Mythology", "Philosophy", "Political Science", "Religious Studies", "Rhetoric", "World History"
];

const SOCIAL_SCIENCES = [
  "Criminology", "Demography", "Economics", "Education", "Human Geography", "International Relations", "Jurisprudence", "Law", "Macroeconomics", "Microeconomics", "Psychology", "Sociology", "Urban Planning", "Women's Studies"
];

const PROFESSIONAL = [
  "Accounting", "Advertising", "Architecture", "Banking", "Business Ethics", "Digital Marketing", "Finance", "Graphic Design", "Hospitality Management", "Industrial Design", "Management", "Marketing", "Medicine", "Nursing", "Public Health", "Public Policy", "Real Estate", "Social Work", "Sports Medicine"
];

const ARTS_TRADES = [
  "Animation", "Acting", "Carpentry", "Culinary Arts", "Fashion Design", "Interior Design", "Journalism", "Photography", "Sculpture", "Textile Arts", "Theater History", "Web Development"
];

export const SUBJECT_GROUPS = [
  { label: "STEM (Science, Tech, Engineering, Math)", options: STEM },
  { label: "Humanities & Arts", options: HUMANITIES },
  { label: "Social Sciences", options: SOCIAL_SCIENCES },
  { label: "Business & Professional", options: PROFESSIONAL },
  { label: "Creative Arts & Trades", options: ARTS_TRADES }
];

export const SUBJECTS = [...new Set([...STEM, ...HUMANITIES, ...SOCIAL_SCIENCES, ...PROFESSIONAL, ...ARTS_TRADES])].sort();

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
