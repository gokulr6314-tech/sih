# Bharat TULIP — Developer & Setup Guide

**Bharat TULIP (Artisan Voice Studio)** is an AI-powered, voice-first commerce platform designed to empower rural and traditional Indian artisans with multilingual voice onboarding, automated studio photography enhancement, SEO catalog generation, fair market valuation, and direct marketplace linkage.

---

## 1. System Requirements & Recommendations

- **Runtime**: [Node.js](https://nodejs.org/) v18+ (tested on Node v24.x) & npm v9+
- **Recommended Browsers**: **Google Chrome** or **Microsoft Edge**
  > [!IMPORTANT]
  > The voice assistant and microphone speech recognition rely on the native **Web Speech API** (`window.speechSynthesis` and `webkitSpeechRecognition`). These are fully supported in Chromium browsers (Chrome and Edge). Browsers like Firefox or certain mobile webviews have limited or disabled speech recognition support.

---

## 2. Quick Start Guide

### Step 1: Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### Step 2: Configure Environment Variables (Optional)
Copy the example environment file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux/macOS/Git Bash:
cp .env.example .env
```
Open `.env` and add your keys (see [API Keys Configuration](#3-api-keys-configuration) below).

> [!NOTE]
> The application has built-in offline fallbacks! If you do not have API keys immediately, the server and app will still run in local fallback mode using realistic mock data and instant curated studio backdrops.

### Step 3: Start the Local Development Server
```bash
npm run dev
```
This runs `tsx server.ts`, which boots:
1. The **Express API server** on `http://localhost:3000`
2. The **Vite SPA middleware** for the React 19 frontend

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 3. API Keys Configuration

| Variable | Required? | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key from [Google AI Studio](https://aistudio.google.com/). Powers real-time catalog generation, image lighting notes, valuation, and regional voice advice. |
| `SUPABASE_URL` | Optional | Supabase project URL (e.g., `https://your-project.supabase.co`). Synchronizes listings and artisan profiles to the cloud. |
| `SUPABASE_ANON_KEY` | Optional | Public anonymous key for your Supabase project. |
| `APP_URL` | Optional | Base URL for deployed environments (defaults to `http://localhost:3000`). |

### Getting a Free Gemini API Key:
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account and click **Get API key**.
3. Create a new key and paste it into `.env`:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```
4. Restart the server (`Ctrl+C` then `npm run dev`).

---

## 4. Voice Assistant & Audio Playback (FAQ & Troubleshooting)

### Why doesn't the voice assistant speak automatically when the page opens?

1. **Browser Autoplay Security Policy (Most Common)**:
   - Modern browsers (Chrome, Edge, Safari) strictly block programmatic audio or speech playback before the user has interacted with the page.
   - **Solution**: Simply click anywhere on the screen, select a language button (e.g., *हिन्दी*), or click the **"सुनें (Repeat Audio)"** button. Once you perform a single user gesture, voice guidance will play freely.

2. **Voices Loading Asynchronously**:
   - In Chromium browsers, `window.speechSynthesis.getVoices()` is initialized asynchronously in the background. On the very first tick of page load, the voice list may briefly be empty until the browser loads its voice table.

3. **Mute State & Audio Toggle**:
   - Check the speaker icon in the top header:
     - 🔊 Green Speaker: Audio enabled.
     - 🔇 Amber Muted: Audio paused. Click to toggle.
   - Verify that your browser tab isn't muted (right-click tab -> *Unmute tab*) and that system volume is turned on.

4. **Microphone Permissions**:
   - When clicking the microphone orb (**"Tap to Speak"**), your browser will prompt: *"Allow localhost:3000 to use your microphone"*. Click **Allow**.
   - If accidentally blocked, click the tune/lock icon on the left side of Chrome's address bar and set **Microphone** to **Allow**.

---

## 5. Architecture & Project Structure

```
├── server.ts                    # Express backend + Vite dev server middleware
├── index.html                   # HTML entry point
├── package.json                 # Project dependencies & npm scripts
├── vite.config.ts               # Vite configuration (Tailwind & React plugins)
├── tsconfig.json                # TypeScript compiler configuration
└── src/
    ├── main.tsx                 # React app entry point
    ├── App.tsx                  # Main orchestration component & workflow state
    ├── index.css                # Tailwind CSS v4 & custom glassmorphism styles
    ├── types.ts                 # TypeScript interfaces (Artisan, Product, Language)
    ├── components/
    │   ├── VoiceAssistantOrb.tsx       # Interactive AI voice waveform & mic controller
    │   ├── LanguageSelectorModal.tsx   # 11 Indian regional language selector
    │   ├── ProductImageCapture.tsx     # Camera capture & photo upload component
    │   ├── SmartSellingWizard.tsx      # Multi-step voice listing creation flow
    │   ├── SellerDashboard.tsx         # Artisan profile, metrics, orders & listings
│   ├── MarketLinkageView.tsx        # ONDC/Etsy/Amazon/GeM sync + Buyer Storefront toggle
    │   ├── BuyerMarketplaceView.tsx     # Customer-facing marketplace & checkout (localized copy)
    │   ├── ArtisanOnboardingVoice.tsx  # Voice onboarding walkthrough
    │   ├── voice/                      # MODULE 1 & 2: voice engine & listing assistant
    │   │   ├── vad.ts                  #   Voice Activity Detection hook (energy + silence segmentation)
    │   │   ├── languageStrings.ts      #   Interview prompts & UI copy in all 11 languages
    │   │   ├── VoiceListingTrigger.tsx #   Floating docked trigger pill
    │   │   └── VoiceListingAssistant.tsx # 4-turn voice interview → SEO/pricing/publish
    │   └── vision/                     # MODULE 3: smart camera suite
    │       ├── lightingDetector.ts     #   Luminance Y=0.299R+0.587G+0.114B, dark<80/glare>220
    │       ├── CameraStudio.tsx        #   Live framing guide + luminance meter + capture
    │       ├── removeBackground.ts     #   Async canvas edge-differencing background eraser
    │       └── BackgroundRemover.tsx   #   Progress UI + AI studio enhance pass
    ├── services/
    │   ├── seo/                        # MODULE 4: machine-first SEO engine
    │   │   ├── types.ts                #   ListingDraftInput / SeoOutput contracts
    │   │   ├── altText.ts              #   [Type]+[Material]+[Style]+[Color/Dimension] alt text
    │   │   ├── seoEngine.ts            #   ≤60-char meta title, structured 160-char preview,
    │   │   │                           #   exactly 13 search tags, category/price inference
    │   │   ├── jsonld.ts               #   schema.org Product + Offer structured data
    │   │   └── promptTemplates.ts      #   Gemini prompt builders (also used by server.ts)
    │   └── pricing/                    # MODULE 5: real-time market pricing agent
    │       ├── types.ts                #   PricingIntelligence contract
    │       ├── craftData.ts            #   Per-craft cost floor & benchmark profiles
    │       ├── marketPricing.ts        #   floor=material+labor, median, competitive target
    │       └── anomaly.ts              #   >40%-below-median anomaly warnings + range
    │   └── translate/                   # BUYER LANGUAGES: listing translation agent
    │       └── translate.ts            #   Gemini /api/ai/translate + deterministic 11-language
    │                                   #   localizer (templates + material glossary fallback)
    └── lib/
        ├── speech.ts            # SpeechService wrapper (SpeechSynthesis & SpeechRecognition)
        ├── languages.ts         # 11 Indian languages dictionary, prompts & greetings
        ├── voiceLanguage.ts     # Script-based language auto-detection & TTS voice fallback
        ├── assistantKnowledge.ts # Regional artisan knowledge base (GI tag, pricing, schemes)
        ├── supabase.ts          # Supabase client setup & local storage fallback
        └── mockData.ts          # Pre-populated artisanal listings & metrics
```

> The services/ folders are **dependency-free** (no React/DOM imports needed at runtime
> beyond guarded `window` checks) and are reused *both* client-side and by the Express
> server, guaranteeing deterministic parity whenever Gemini is unavailable.

---

## 6. Backend API Endpoints

All backend routes are hosted by [`server.ts`](file:///c:/Users/91902/Desktop/sih/server.ts):

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/db/health` | Checks server status, Gemini key status, and Supabase connection. |
| `POST` | `/api/ai/enhance-image` | Enhances product photos with category-specific studio backdrops & lighting notes. |
| `POST` | `/api/ai/describe` | Converts raw artisan voice transcripts into high-converting SEO titles, descriptions, and story. |
| `POST` | `/api/ai/price-suggest` | Generates fair price calculation and suggested retail pricing. |
| `POST` | `/api/ai/voice-agent` | Drives the multilingual voice listing dialogue & field extraction. |
| `POST` | `/api/ai/seo-generate` | **Module 4** — machine-first SEO: ≤60-char meta title, exactly 13 tags, structured 160-char description, alt-text & JSON-LD. Deterministic engine fallback when Gemini is offline. |
| `POST` | `/api/ai/market-price` | **Module 5** — real-time market pricing: material+labor floor, 40%-below-median anomaly detection, platform comparison table, fair-price evaluation. |
| `POST` | `/api/ai/artisan-voice-chat` | Delivers contextual, spoken audio advice in the artisan's chosen regional language. |
| `POST` | `/api/ai/translate` | **Buyer languages** — translates listing title/description/culturalStory/materials into the buyer's language via Gemini; client falls back to the deterministic localizer when the AI is offline. |

---

## 7. Supported Regional Languages

Bharat TULIP currently supports **11 languages**:
- **Hindi** (`hi`) — हिन्दी
- **Tamil** (`ta`) — தமிழ்
- **Telugu** (`te`) — తెలుగు
- **Bengali** (`bn`) — বাংলা
- **Marathi** (`mr`) — मराठी
- **Gujarati** (`gu`) — ગુજરાતી
- **Kannada** (`kn`) — ಕನ್ನಡ
- **Malayalam** (`ml`) — മലയാളം
- **Odia** (`or`) — ଓଡ଼ିଆ
- **Punjabi** (`pa`) — ਪੰਜਾਬੀ
- **English** (`en`) — Indian English

---

## 8. Common Troubleshooting

### Error: `Address already in use :::3000`
If port 3000 is occupied by another process:
```bash
# On Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Voice input doesn't transcribe
Ensure you are using **Google Chrome** or **Microsoft Edge**. Chromium's speech recognition engine connects to the speech recognition service. If on a restricted corporate VPN or offline, speech recognition may fail.

### Health check verification
To test that your backend is healthy in PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/db/health"
```
You should see:
```json
{
  "status": "online",
  "hasGeminiKey": false,
  "hasSupabaseUrl": false,
  "timestamp": "..."
}
```
*(Once you supply your `.env` keys, `hasGeminiKey` and `hasSupabaseUrl` will change to `true`)*.
