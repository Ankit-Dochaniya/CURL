# CURL 📖



**[🌐 Visit the Website!](https://curl-blush.vercel.app)**
<br>
**[📱 Download the Android App!](https://github.com/Ankit-Dochaniya/CURL/raw/main/CURL-Android-App.apk)**
<br>
**[🍏 Download the iOS App!](https://github.com/Ankit-Dochaniya/CURL/actions/workflows/ios.yml)**

CURL is a modern, cross-platform PDF reading application featuring beautiful page-flip animations and reading progress tracking. Built as a web application and packaged as a native Android app using Capacitor.

## ✨ Features

- **Interactive Page Flipping**: Experience realistic book-like page turning animations.
- **Cross-Platform**: Run it in your browser or install the native Android APK.
- **Reading Progress Tracking**: Never lose your place. Your reading progress is saved automatically.
- **Secure Backend**: Powered by Supabase for fast, reliable, and secure database and authentication management.

## 🚀 Getting Started

### 📱 Installing on Android

Simply click the **"Download the Android App!"** link at the top of the page. Once downloaded, tap the `CURL-Android-App.apk` file on your device to install it directly!

### 🍎 Installing on iOS (iPad/iPhone)

Apple's security policies require a slightly different process for installing apps outside the App Store. You can easily install CURL using a free sideloading tool:

1. **Download the App**: Click the **"Download the iOS App!"** link at the top of this page. This will take you to the GitHub Actions page. Click the latest successful build and download the `CURL-iOS-Unsigned` artifact. Extract the `.zip` to get the `.ipa` file.
2. **Download Sideloadly**: Install [Sideloadly](https://sideloadly.io/) on your Windows or Mac computer.
3. **Connect your Device**: Plug your iPad or iPhone into your computer using a USB cable.
4. **Install**: Open Sideloadly, drag the downloaded `.ipa` file into the window, enter your Apple ID, and click **Start**. 
5. **Trust the App**: On your iOS device, go to *Settings > General > VPN & Device Management*, tap your Apple ID, and select "Trust".

*Note: Because this uses a free personal Apple ID, Apple requires you to quickly re-sync the app via Sideloadly every 7 days.*

### 💻 Running on Windows (Web Version)

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

## 🛠️ Built With

- **Vite** - Next Generation Frontend Tooling
- **Capacitor** - Cross-platform native runtime
- **Supabase** - Open source Firebase alternative
- **Vanilla JS/CSS** - Lightweight and blazing fast frontend
