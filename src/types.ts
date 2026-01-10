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

export const SUBJECTS = [
  "Abnormal Psychology", "Accounting", "Acoustics", "Acting", "Aerospace Engineering", "Aesthetics", "African History", "Agriculture", 
  "Algebra", "Algorithms", "American Literature", "Anatomy", "Ancient History", "Animal Science", "Anthropology", "Applied Mathematics", 
  "Archaeology", "Architecture", "Art History", "Artificial Intelligence", "Asian Studies", "Astronomy", "Astrophysics", "Atmospheric Science", 
  "Biochemistry", "Bioethics", "Bioinformatics", "Biology", "Biomechanics", "Biomedical Engineering", "Biophysics", "Biotechnology", 
  "Botany", "Business Ethics", "Calculus", "Cardiology", "Cell Biology", "Chemical Engineering", "Chemistry", "Civil Engineering", 
  "Classical Studies", "Climate Science", "Cognitive Science", "Communication Studies", "Comparative Literature", "Computer Graphics", 
  "Computer Networks", "Computer Science", "Conservation Biology", "Cosmology", "Creative Writing", "Criminology", "Cryptography", 
  "Cultural Anthropology", "Cultural Studies", "Cybersecurity", "Data Science", "Databases", "Demography", "Dentistry", "Developmental Biology", 
  "Digital Marketing", "Discrete Mathematics", "Earth Science", "Ecology", "Econometrics", "Economics", "Education", "Electrical Engineering", 
  "Electromagnetism", "Embryology", "Endocrinology", "Entomology", "Environmental Science", "Epidemiology", "Epistemology", "Ethics", 
  "Ethnomusicology", "European History", "Evolutionary Biology", "Exercise Physiology", "Film Studies", "Finance", "Fluid Dynamics", 
  "Food Science", "Forensic Science", "Forestry", "Game Design", "Game Theory", "Gender Studies", "General Science", "Genetics", 
  "Geography", "Geology", "Geometry", "Geophysics", "Gerontology", "Global Health", "Graphic Design", "History", "Horticulture", 
  "Hospitality Management", "Human Geography", "Human Rights", "Hydrology", "Immunology", "Industrial Design", "Infectious Diseases", 
  "Information Theory", "Inorganic Chemistry", "International Law", "International Relations", "Journalism", "Jurisprudence", "Kinesiology", 
  "Law", "Library Science", "Linguistics", "Linear Algebra", "Literature", "Macroeconomics", "Marine Biology", "Marketing", "Materials Science", 
  "Mathematics", "Mechanical Engineering", "Media Studies", "Medicine", "Medieval History", "Meteorology", "Microbiology", "Microeconomics", 
  "Military Science", "Mineralogy", "Molecular Biology", "Music Theory", "Mythology", "Nanotechnology", "Neuroscience", "Nuclear Physics", 
  "Nursing", "Nutrition", "Oceanography", "Oncology", "Operations Research", "Optics", "Organic Chemistry", "Organizational Behavior", 
  "Paleontology", "Parasitology", "Pathology", "Pharmacology", "Philosophy", "Phonetics", "Photography", "Physical Chemistry", 
  "Physical Education", "Physics", "Physiology", "Planetary Science", "Plant Science", "Political Science", "Polymer Science", "Probability", 
  "Psychiatry", "Psychology", "Public Health", "Public Policy", "Quantum Mechanics", "Radiology", "Real Estate", "Religious Studies", 
  "Renewable Energy", "Rhetoric", "Robotics", "Russian Studies", "Social Work", "Sociology", "Software Engineering", "Soil Science", 
  "Space Science", "Spanish Literature", "Sports Medicine", "Statistics", "Structural Engineering", "Sustainability", "Systems Theory", 
  "Taxation", "Telecommunications", "Theology", "Thermodynamics", "Toxicology", "Urban Planning", "Veterinary Medicine", "Virology", 
  "Volcanology", "Web Development", "Women's Studies", "World History", "Zoology"
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
