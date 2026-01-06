# InfographAI 🎨

An intelligent infographic generator powered by Google Gemini 3 (Flash & Pro Image). Create beautiful, educational infographics for any subject, level, or topic in seconds.

## ✨ Features

- **Topic Generation**: Brainstorms creative topics based on subject and difficulty level.
- **Smart Formatting**: Choose between Standard Infographics, Mindmaps, or Flowcharts.
- **Pro Features**:
  - **QR Code Integration**: Embeds scannable links directly into the artwork.
  - **High Resolution**: Supports up to 4K generation.
- **Extensions**:
  - **Article Generator**: Writes a 500-word educational summary.
  - **Podcast Generator**: Creates a 2-person audio discussion about the topic using AI TTS.
- **Library**: Saves your generation history locally.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Cloud Project with the Gemini API enabled.

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/infographai.git
   cd infographai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API Key:
   - Create a `.env` file in the root directory.
   - Add your key: `API_KEY=AIzaSy...`

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Google Gemini API (@google/genai)
  - `gemini-3-flash-preview` (Logic & Text)
  - `gemini-3-pro-image-preview` (Image Generation)
  - `gemini-2.5-flash-preview-tts` (Audio/Podcast)

## 📄 License

This project is open source.
