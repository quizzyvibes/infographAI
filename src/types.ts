
export enum AppStep {
  CONFIG = 'CONFIG',
  TOPICS = 'TOPICS',
  PREVIEW = 'PREVIEW',
  RESULT = 'RESULT',
}

export enum AppView {
  HOME = 'HOME',
  GENERATOR = 'GENERATOR',
  PRICING = 'PRICING',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN'
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
  WIDE = '16:9',
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
}

export const SUBJECTS = [
  "Accounting",
  "Aerospace Engineering",
  "African History",
  "Agriculture & Farming",
  "American History",
  "Anatomy",
  "Ancient Civilizations",
  "Anthropology",
  "Archaeology",
  "Architecture",
  "Art History",
  "Artificial Intelligence",
  "Asian Studies",
  "Astronomy",
  "Astrophysics",
  "Automotive Engineering",
  "Aviation",
  "Biochemistry",
  "Biology",
  "Biomedical Engineering",
  "Biotechnology",
  "Blockchain & Crypto",
  "Botany",
  "Business Administration",
  "Business Law",
  "Calculus",
  "Chemical Engineering",
  "Chemistry",
  "Child Development",
  "Civil Engineering",
  "Classical Studies",
  "Climate Change",
  "Cloud Computing",
  "Communications",
  "Computer Science",
  "Consumer Behavior",
  "Creative Writing",
  "Criminal Justice",
  "Criminology",
  "Cryptography",
  "Culinary Arts",
  "Cybersecurity",
  "Data Science",
  "Dentistry",
  "Dermatology",
  "Digital Marketing",
  "Diplomacy",
  "Early Childhood Education",
  "Earth Science",
  "Ecology",
  "Economics (Macro)",
  "Economics (Micro)",
  "Education Policy",
  "Electrical Engineering",
  "Energy Policy",
  "Engineering",
  "English Literature",
  "Entrepreneurship",
  "Environmental Science",
  "Epidemiology",
  "Ethics",
  "European History",
  "Evolutionary Biology",
  "Fashion Design",
  "Film Studies",
  "Finance",
  "Food Science",
  "Forensic Science",
  "Game Development",
  "Gender Studies",
  "Genetics",
  "Geography (Human)",
  "Geography (Physical)",
  "Geology",
  "Geometry",
  "Global Health",
  "Graphic Design",
  "Health & Wellness",
  "History",
  "Horticulture",
  "Human Resources",
  "Human Rights",
  "Immunology",
  "Industrial Design",
  "Information Systems",
  "Interior Design",
  "International Business",
  "International Relations",
  "Journalism",
  "Kinesiology",
  "Law",
  "Leadership",
  "Linguistics",
  "Literature",
  "Logistics",
  "Machine Learning",
  "Macroeconomics",
  "Management",
  "Marine Biology",
  "Marketing",
  "Materials Science",
  "Mathematics",
  "Mechanical Engineering",
  "Media Studies",
  "Medicine",
  "Mental Health",
  "Meteorology",
  "Microbiology",
  "Microeconomics",
  "Military History",
  "Music Theory",
  "Mythology",
  "Nanotechnology",
  "Neuroscience",
  "Nuclear Physics",
  "Nursing",
  "Nutrition",
  "Oceanography",
  "Operations Management",
  "Organic Chemistry",
  "Paleontology",
  "Pathology",
  "Performing Arts",
  "Pharmacology",
  "Philosophy",
  "Photography",
  "Physical Education",
  "Physics",
  "Physiology",
  "Political Science",
  "Project Management",
  "Psychiatry",
  "Psychology",
  "Public Administration",
  "Public Health",
  "Public Relations",
  "Quantum Mechanics",
  "Real Estate",
  "Religious Studies",
  "Renewable Energy",
  "Robotics",
  "Social Media Marketing",
  "Social Work",
  "Sociology",
  "Software Engineering",
  "Space Exploration",
  "Special Education",
  "Sports Management",
  "Sports Science",
  "Statistics",
  "Supply Chain Management",
  "Sustainability",
  "Systems Engineering",
  "Taxation",
  "Telecommunications",
  "Theater Arts",
  "Theology",
  "Tourism",
  "Toxicology",
  "Urban Planning",
  "User Experience (UX)",
  "Veterinary Science",
  "Virology",
  "Visual Arts",
  "Web Development",
  "Women's Studies",
  "World History",
  "Zoology"
].sort();

export const LEVELS = [
  "Grade 1-3 (Early Elementary)",
  "Grade 4-6 (Upper Elementary)",
  "Grade 7-9 (Middle School)",
  "Grade 10-12 (High School)",
  "Undergraduate",
  "Graduate / PhD",
  "Adult / General Audience",
  "Professional / Specialist"
];

export const ASPECT_RATIOS = [
  { value: AspectRatio.SQUARE, label: "Square (1:1)" },
  { value: AspectRatio.PORTRAIT, label: "Portrait (3:4)" },
  { value: AspectRatio.LANDSCAPE, label: "Landscape (4:3)" },
  { value: AspectRatio.TALL, label: "Mobile / Story (9:16)" },
  { value: AspectRatio.WIDE, label: "Presentation (16:9)" },
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

export const TOPIC_COUNTS = [
  { value: "2", label: "2 Topics" },
  { value: "4", label: "4 Topics" },
  { value: "6", label: "6 Topics" },
];

export const QR_POSITIONS = [
  { value: QrPosition.BOTTOM_RIGHT, label: "Bottom Right" },
  { value: QrPosition.BOTTOM_LEFT, label: "Bottom Left" },
  { value: QrPosition.TOP_RIGHT, label: "Top Right" },
  { value: QrPosition.TOP_LEFT, label: "Top Left" },
];
