
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

export const SUBJECTS = [
  "Science (General)", "Geography", "History", "Mathematics", "Biology", "Chemistry", "Physics", 
  "English Literature", "Computer Science", "Art & Design", "Economics", "Business Studies",
  "Accounting", "Acoustics", "Advertising", "Aeronautics", "Aerospace Engineering", "African Studies", 
  "Agricultural Science", "Agriculture", "Agronomy", "American History", "American Literature", 
  "Anatomy", "Ancient History", "Animal Science", "Animation", "Anthropology", "Applied Mathematics", 
  "Archaeology", "Architecture", "Art History", "Artificial Intelligence", "Asian Studies", "Astronomy", 
  "Astrophysics", "Atmospheric Science", "Audiology", "Bacteriology", "Banking", "Behavioral Science", 
  "Biblical Studies", "Biochemistry", "Bioethics", "Bioinformatics", "Biomechanics", 
  "Biomedical Engineering", "Biophysics", "Biotechnology", "Botany", "Business Administration", 
  "Business Analytics", "Business Ethics", "Business Law", "Calculus", "Cardiology", "Cartography", 
  "Cell Biology", "Ceramics", "Chemical Engineering", "Child Development", "Chinese", 
  "Cinematography", "Civil Engineering", "Civil Rights", "Classical Civilization", "Classical Studies", 
  "Climate Change", "Cognitive Science", "Communications", "Comparative Literature", "Computer Engineering", 
  "Computer Graphics", "Conflict Resolution", "Conservation Biology", "Construction Management", 
  "Consumer Behavior", "Corporate Finance", "Counseling", "Creative Writing", "Criminal Justice", 
  "Criminology", "Cryptography", "Culinary Arts", "Cultural Studies", "Cybersecurity", "Dance", 
  "Dance Theory", "Data Science", "Demography", "Dentistry", "Dermatology", "Design Thinking", 
  "Developmental Psychology", "Digital Marketing", "Diplomacy", "Early Childhood Education", "Earth Science", 
  "Ecology", "Econometrics", "Education Policy", "Educational Psychology", "Electrical Engineering", 
  "Electronics", "Embryology", "Emergency Management", "Endocrinology", "Energy Policy", "Engineering", 
  "Engineering Management", "Entomology", "Entrepreneurship", "Environmental Engineering", 
  "Environmental Law", "Environmental Science", "Epidemiology", "Ethics", "Ethnic Studies", "Ethology", 
  "European History", "Evolutionary Biology", "Exercise Physiology", "Family Studies", "Fashion Design", 
  "Fashion Merchandising", "Film Studies", "Finance", "Fine Arts", "Fluid Dynamics", "Food Science", 
  "Forensic Psychology", "Forensic Science", "Forestry", "French", "Game Design", "Game Theory", 
  "Gastroenterology", "Gender Studies", "Genetics", "Geochemistry", 
  "Geology", "Geometry", "Geophysics", "Gerontology", "German", "Global Health", "Global Studies", 
  "Graphic Design", "Health Administration", "Health Education", "Health Science", "Hematology", 
  "Herpetology", "Horticulture", "Hospitality Management", "Human Computer Interaction", "Human Geography", "Human Resources", 
  "Human Rights", "Hydrology", "Ichthyology", "Immunology", "Industrial Design", "Industrial Engineering", 
  "Information Systems", "Information Technology", "Inorganic Chemistry", "Instructional Design", 
  "Interior Design", "International Business", "International Law", "International Relations", 
  "Investment Banking", "Italian", "Japanese", "Journalism", "Kinesiology", "Labor Studies", 
  "Landscape Architecture", "Latin", "Latin American Studies", "Law", "Leadership Studies", "Library Science", 
  "Linguistics", "Literature", "Logic", "Logistics", "Macroeconomics", "Mammalogy", "Management", 
  "Marine Biology", "Marketing", "Materials Science", "Mechanical Engineering", 
  "Media Studies", "Medicine", "Medieval Studies", "Metallurgy", "Meteorology", "Microbiology", 
  "Microeconomics", "Middle Eastern Studies", "Military History", "Military Science", "Mineralogy", 
  "Molecular Biology", "Museum Studies", "Music Composition", "Music Education", "Music History", 
  "Music Performance", "Music Theory", "Music Therapy", "Mycology", "Mythology", "Nanotechnology", 
  "Nephrology", "Neuroscience", "Nuclear Engineering", "Nuclear Physics", "Nursing", "Nutrition", 
  "Oceanography", "Oncology", "Operations Management", "Operations Research", "Optometry", 
  "Organic Chemistry", "Organizational Behavior", "Ornithology", "Paleontology", "Parasitology", 
  "Pathology", "Peace Studies", "Pediatrics", "Performing Arts", "Petroleum Engineering", 
  "Pharmaceutical Sciences", "Pharmacology", "Pharmacy", "Philosophy", "Photography", "Physical Chemistry", 
  "Physical Education", "Physical Therapy", "Physiology", "Planetary Science", 
  "Plant Pathology", "Political Economy", "Political Science", "Polymer Science", "Probability", 
  "Project Management", "Psychiatry", "Psychology", "Public Administration", "Public Health", 
  "Public Policy", "Public Relations", "Quantum Mechanics", "Radiology", "Real Estate", "Religious Studies", 
  "Renewable Energy", "Rheumatology", "Robotics", "Russian", "Science Education", "Sculpture", 
  "Social Psychology", "Social Work", "Sociology", "Software Engineering", "Soil Science", "Space Science", 
  "Spanish", "Special Education", "Speech Pathology", "Sports Management", "Sports Medicine", 
  "Sports Science", "Statistics", "Strategic Management", "Supply Chain Management", "Sustainability", 
  "Systems Engineering", "Taxation", "Telecommunications", "Textile Science", "Theater", "Theology", 
  "Theoretical Physics", "Thermodynamics", "Tourism", "Toxicology", "Transportation Planning", 
  "Urban Planning", "Urology", "Veterinary Science", "Virology", "Web Development", "Wildlife Biology", 
  "Women's Studies", "World Religions", "Writing", "Zoology"
];

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























