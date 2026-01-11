
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
  role?: string;
  status?: string;
  lastActive?: number;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  // New Enhanced Fields
  subscriptionTier?: 'Free' | 'Basic' | 'Pro';
  subscriptionStatus?: 'Active' | 'Cancelled' | 'Past Due';
  visits?: number;
  shopSpend?: number;
  subscriptionSpend?: number;
}

export interface UserPurchaseRecord {
  id: string;
  date: number;
  bundleTitle: string;
  amount: number;
  status: 'Completed' | 'Refunded';
  type: 'Shop' | 'Subscription'; // Added type
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

export interface Slide {
  id: string;
  url: string;
  type: 'image' | 'video';
  // New fields for text overlay
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaLink?: string;
  textPosition?: 'left' | 'center' | 'right';
  // New Font options
  fontFamily?: string;
  fontSize?: 'small' | 'medium' | 'large' | 'xl';
}

export interface SliderGlobalSettings {
  height: 'compact' | 'medium' | 'large' | 'cinematic';
  duration: number; // ms
  fullWidth: boolean;
  overlayOpacity: number; // 0 to 1
}

export interface SystemConfig {
  // Core & Image
  systemPrompt: string;
  thumbnailSystemPrompt?: string;
  
  // New Content Generators
  articleSystemPrompt?: string;
  visualDeckSystemPrompt?: string;
  quizSystemPrompt?: string;
  shortsSystemPrompt?: string;
  podcastSystemPrompt?: string;
  bannerSystemPrompt?: string; // New Banner Prompt

  // Slider Config
  sliders?: {
    landing?: Slide[];
    create?: Slide[];
    shop?: Slide[];
    learn?: Slide[];
  };
  sliderSettings?: SliderGlobalSettings;

  // Settings
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
  rating?: number;
  timestamp?: number;
  stats?: {
    sales: number;
    views: number;
    revenue: number;
  };
}

export interface CartItem {
  bundle: ShopBundle;
  quantity: number;
}

// Interfaces for Grouped Dropdowns
export interface SubjectGroup {
  label: string;
  options: string[];
}

const POPULAR = [
  "General Science", "Geography", "History", "Mathematics", "Biology", "Chemistry", "Physics", "English", "Computer Science", "Economics", "Psychology", "Business", "Marketing", "Artificial Intelligence"
];

const STEM = [
  "General Science", "Aerospace Engineering", "Agriculture", "Agronomy", "Algebra", "Algorithms", "Anatomy", "Animal Science", "Architecture", "Artificial Intelligence", "Astronomy", "Astrophysics", "Atmospheric Science", "Automotive Engineering", "Aviation",
  "Biochemistry", "Bioinformatics", "Biology", "Biomechanics", "Biomedical Engineering", "Biotechnology", "Blockchain Technology", "Botany", 
  "Calculus", "Cell Biology", "Chemical Engineering", "Chemistry", "Civil Engineering", "Climate Science", "Cloud Computing", "Computer Engineering", "Computer Science", "Cryptography", "Cybersecurity", 
  "Data Science", "Dentistry", "Earth Science", "Ecology", "Electrical Engineering", "Energy Systems", "Entomology", "Environmental Science", "Epidemiology", "Ethical Hacking",
  "Food Science", "Forensic Science", "Forestry", "Game Development",
  "Genetics", "Geology", "Geometry", "Geophysics", 
  "Health Sciences", "Horticulture", "Hydrology",
  "Immunology", "Information Technology", "Inorganic Chemistry",
  "Kinesiology",
  "Machine Learning", "Marine Biology", "Materials Science", "Mathematics", "Mechanical Engineering", "Mechatronics", "Medicine", "Meteorology", "Microbiology", "Molecular Biology", "Mycology",
  "Nanotechnology", "Neuroscience", "Nuclear Engineering", "Nuclear Physics", "Nursing", "Nutrition",
  "Oceanography", "Optometry", "Organic Chemistry", "Ornithology",
  "Paleontology", "Pathology", "Pharmacology", "Physical Geography", "Physics", "Physiology", "Planetary Science", "Plant Science", "Public Health",
  "Quantum Computing", "Quantum Mechanics", "Quantum Physics",
  "Radiology", "Renewable Energy", "Robotics", 
  "Seismology", "Software Engineering", "Space Science", "Statistics", "Structural Engineering", "Systems Engineering",
  "Telecommunications", "Thermodynamics", "Toxicology", "Trigonometry",
  "Veterinary Medicine", "Virology", "Virtual Reality (VR)", "Volcanology",
  "Web Development", "Zoology"
];

const HUMANITIES = [
  "African History", "African Studies", "American History", "American Literature", "Ancient History", "Anthropology of Religion", "Archaeology", "Art History", "Asian History", "Asian Studies",
  "Biblical Studies", "Buddhist Studies",
  "Classical Studies", "Comparative Literature", "Comparative Religion", "Contemporary Art", "Creative Writing",
  "Design History",
  "English Literature", "Ethics", "European History",
  "Film Studies", "Folklore", "French Literature",
  "Genealogy", "History", "History of Science", "Human Rights",
  "Islamic Studies",
  "Jewish Studies",
  "Latin American Studies", "Linguistics", "Literature", "Logic",
  "Medieval History", "Middle Eastern Studies", "Military History", "Modern History", "Museology", "Music History", "Music Theory", "Mythology",
  "Philosophy", "Philosophy of Mind", "Political Philosophy", "Prehistory",
  "Religious Studies", "Renaissance Studies", "Rhetoric", "Russian Studies",
  "Spanish Literature",
  "Theater History", "Theology",
  "Visual Culture",
  "Women's History", "World History", "World Literature"
];

const SOCIAL_SCIENCES = [
  "Anthropology", "Archaeology", "Area Studies",
  "Behavioral Economics", 
  "Cognitive Science", "Communication Studies", "Community Development", "Conflict Resolution", "Counseling", "Criminology", "Cultural Anthropology", "Cultural Studies",
  "Demography", "Development Studies",
  "Economics", "Education", "Environmental Policy", "Ethnic Studies",
  "Gender Studies", "Geography", "Gerontology", "Global Studies",
  "Human Geography",
  "International Development", "International Relations",
  "Journalism", "Jurisprudence",
  "Law", "Library Science", "Linguistics",
  "Macroeconomics", "Media Studies", "Microeconomics",
  "Organizational Behavior",
  "Peace Studies", "Political Economy", "Political Science", "Psychology", "Public Administration", "Public Policy",
  "Social Psychology", "Social Work", "Sociology", "Special Education", "Sustainability",
  "Urban Planning", "Urban Studies"
];

const PROFESSIONAL = [
  "Accounting", "Actuarial Science", "Advertising", "Agribusiness", "Agile Methodology",
  "Banking", "Business Administration", "Business Analytics", "Business Ethics", "Business Law", "Business Strategy",
  "Commerce", "Construction Management", "Corporate Finance", "Crisis Management",
  "Digital Marketing",
  "E-commerce", "Entrepreneurship", "Event Management",
  "Fashion Merchandising", "Finance", "Financial Planning", "Fintech",
  "Hospitality Management", "Human Resources",
  "Industrial Relations", "Information Systems", "Insurance", "International Business", "Investment Banking",
  "Leadership", "Logistics",
  "Management", "Management Consulting", "Marketing",
  "Negotiation", "Nonprofit Management",
  "Operations Management", "Organizational Leadership",
  "Product Management", "Project Management", "Property Management", "Public Relations",
  "Real Estate", "Retail Management", "Risk Management",
  "Sales", "Social Media Marketing", "Sports Management", "Strategic Management", "Supply Chain Management",
  "Taxation", "Tourism Management"
];

const ARTS_TRADES = [
  "2D Animation", "3D Animation", "3D Modeling", "Acting", "Animation", "Architecture", "Art Conservation",
  "Ballet",
  "Calligraphy", "Carpentry", "Ceramics", "Choreography", "Cinematography", "Concept Art", "Costume Design", "Culinary Arts",
  "Dance", "Digital Art", "Documentary Filmmaking", "Drawing",
  "Fashion Design", "Filmmaking", "Fine Arts", "Furniture Design",
  "Game Design", "Glassblowing", "Graphic Design",
  "Illustration", "Industrial Design", "Interior Design",
  "Jewelry Design",
  "Landscape Architecture",
  "Makeup Arts", "Metalworking", "Motion Graphics", "Music Composition", "Music Performance", "Music Production",
  "Painting", "Performing Arts", "Photography", "Pottery", "Printmaking", "Product Design",
  "Screenwriting", "Sculpture", "Sound Design", "Stage Design",
  "Textile Arts", "Theater Arts", "Typography",
  "User Experience (UX) Design", "User Interface (UI) Design",
  "Video Editing", "Visual Arts", "Vocal Performance",
  "Web Design", "Welding", "Woodworking"
];

const LIFESTYLE_HEALTH = [
  "Aromatherapy",
  "Beauty & Skincare",
  "Child Development", "Coaching", "Cooking", "Culinary Skills",
  "Dietetics", "DIY & Home Improvement",
  "Emergency Preparedness",
  "Fashion & Style", "First Aid", "Fitness Training",
  "Gardening",
  "Health & Wellness", "Holistic Health", "Home Organization",
  "Interior Design",
  "Meditation", "Mental Health", "Mindfulness",
  "Nutrition",
  "Parenting", "Personal Finance", "Personal Training", "Pet Care", "Physical Therapy", "Pilates", "Productivity", "Public Speaking",
  "Relationships",
  "Self-Defense", "Sleep Science", "Survival Skills", "Sustainable Living",
  "Time Management", "Travel Hacking",
  "Veganism",
  "Yoga"
];

const HOBBIES_INTERESTS = [
  "Astrology", "Astronomy (Amateur)", "Automotive",
  "Baking", "Bird Watching", "Board Games",
  "Camping", "Chess", "Collectibles", "Cosplay", "Crafting", "Cycling",
  "Dog Training", "Drone Flying",
  "Esports", "Extreme Sports",
  "Fishing", "Flower Arranging",
  "Gaming",
  "Hiking",
  "Knitting & Crochet",
  "Magic & Illusion", "Martial Arts", "Model Building", "Mountaineering",
  "Origami",
  "Painting (Hobby)", "Photography", "Poker",
  "Reading", "Running",
  "Sailing", "Scrapbooking", "Scuba Diving", "Sewing", "Skateboarding", "Skiing & Snowboarding", "Surfing", "Swimming",
  "Tarot", "Travel",
  "Videography",
  "Wine Tasting", "Writing"
];

export const SUBJECT_GROUPS: SubjectGroup[] = [
  { label: "✨ Popular", options: POPULAR },
  { label: "STEM (Science, Tech, Eng, Math)", options: STEM },
  { label: "Humanities & History", options: HUMANITIES },
  { label: "Social Sciences & Law", options: SOCIAL_SCIENCES },
  { label: "Business & Professional", options: PROFESSIONAL },
  { label: "Arts, Design & Media", options: ARTS_TRADES },
  { label: "Lifestyle, Health & Growth", options: LIFESTYLE_HEALTH },
  { label: "Hobbies, Sports & Interests", options: HOBBIES_INTERESTS }
];

export const SUBJECTS = [...new Set([
  ...STEM, 
  ...HUMANITIES, 
  ...SOCIAL_SCIENCES, 
  ...PROFESSIONAL, 
  ...ARTS_TRADES,
  ...LIFESTYLE_HEALTH,
  ...HOBBIES_INTERESTS
])].sort();

// Alias for Shop usage to ensure compatibility with Admin
export const SHOP_SUBJECTS = SUBJECTS;

export const LEVELS = [
  "Kindergarten", "Grade 1-3", "Grade 4-6", "Middle School", "High School", "Undergraduate", "Graduate", "Professional", "General Audience", "Expert / Technical"
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










