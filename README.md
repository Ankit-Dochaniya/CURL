# CURL 📖

CURL is a modern, cross-platform PDF reading application featuring beautiful page-flip animations and reading progress tracking. Built as a web application and packaged as a native Android app using Capacitor.

## ✨ Features

- **Interactive Page Flipping**: Experience realistic book-like page turning animations.
- **Cross-Platform**: Run it in your browser or install the native Android APK.
- **Reading Progress Tracking**: Never lose your place. Your reading progress is saved automatically.
- **Secure Backend**: Powered by Supabase for fast, reliable, and secure database and authentication management.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ankit-Dochaniya/CURL.git
   cd CURL
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Rename the `.env.example` file to `.env` and fill in your Supabase credentials.
   ```bash
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_KEY=your_supabase_key_here
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

### 📱 Android Development

This project uses Capacitor to generate the Android app. 

To build the web assets and sync them to Android:
```bash
npm run build
npx cap sync android
```

To compile the APK:
```bash
cd android
./gradlew assembleDebug
```

## 🛠️ Built With

- **Vite** - Next Generation Frontend Tooling
- **Capacitor** - Cross-platform native runtime
- **Supabase** - Open source Firebase alternative
- **Vanilla JS/CSS** - Lightweight and blazing fast frontend
