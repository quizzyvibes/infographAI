
export enum AppStep {
  CONFIG = 'CONFIG',
  TOPICS = 'TOPICS',
  PREVIEW = 'PREVIEW',
  RESULT = 'RESULT',
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
  topic: Topic;
  subject: string;
  level: string;
  base64Image: string;
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
  "Geography",
  "Science",
  "History",
  "Mathematics",
  "Literature",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Psychology",
  "Sociology",
  "Art History",
  "Music Theory",
  "Health & Wellness",
  "Business & Marketing",
  "Environmental Science",
  "Astronomy",
  "Philosophy",
  "Political Science",
  "Engineering",
  "Medicine & Anatomy",
  "Law & Legal Studies",
  "Architecture",
  "Anthropology",
  "Linguistics",
  "Education",
  "Media Studies",
  "Performing Arts",
  "Religious Studies",
  "Gender Studies",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Culinary Arts",
  "Fashion Design",
  "Film Studies",
  "Journalism",
  "Sports Science",
  "Public Health"
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
