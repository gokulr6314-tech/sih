# KarigarSetu (Wortex) 🎨🎙️

**Empowering Indian Artisans with Real-Time Multilingual Voice Commerce, Computer Vision & AI Market Intelligence.**

KarigarSetu is an artisan-first progressive web application engineered to bridge traditional Indian craftspeople directly to global marketplaces (ONDC, Etsy, Amazon Karigar, and Government e-Marketplace GeM) through 100% voice-driven interactions.

---

## 🌟 Key Architecture & Production Modules

### 1. 🎙️ Multilingual Real-Time Voice Engine
- **Full Regional Dialect Support**: Automatic recognition and synthesis for Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi, and English.
- **Dynamic Locale Matching**: Seamless runtime reconfiguration of `SpeechRecognition` and `SpeechSynthesis`.
- **Intelligent Speech Fallbacks**: Graceful fallback routing to ensure crisp audio delivery across all devices and browsers.
- **Voice Activity Detection (VAD)**: Smart 1.5-second silence turn-taking and 6-second auto-prompting.

### 2. ⚡ Voice Listing Assistant State Machine
- **Hands-Free Conversational Listing**: Turn-by-turn interview eliminating form typing:
  - **Turn 1 (Product Identification)**: Captures handicraft name, category, and regional heritage.
  - **Turn 2 (Materials & Craft Technique)**: Extracts traditional techniques, raw materials, and GI tag lineage.
  - **Turn 3 (Visual Capture Hand-Off)**: Triggers the computer vision camera suite.
  - **Turn 4 (Price Negotiation & Final Approval)**: Reviews AI pricing suggestions, conducts voice negotiation, detects price anomalies, and publishes.
- **Mid-Interview Language Persistence**: Retains all catalogued form states even if the user switches languages mid-interview.

### 3. 📷 Computer Vision & Smart Camera Suite
- **Live Camera Viewport**: Direct `<video>` stream via `navigator.mediaDevices.getUserMedia`.
- **Real-Time Lighting & Glare Detection**: Canvas pixel analysis using luminance formula $Y = 0.299R + 0.587G + 0.114B$:
  - $Y < 80$: *"⚠️ Lighting too dark. Move closer to a light source."*
  - $Y > 220$: *"⚠️ Glare detected. Soften the light."*
  - $80 \le Y \le 220$: *"✓ Lighting Perfect. Hold steady."* (Green bounding indicator).
- **Framing & Centering Guide**: SVG dashed centering box and rule-of-thirds grid.
- **Automated Studio Background Isolation**: Client-side canvas segmentation producing clean, neutral studio backdrops suitable for premium marketplace standards.

### 4. 🔍 Machine-First SEO Generation Engine
- **Algorithmic Meta & Alt-Text**: `[Product Type] + [Artisan Material] + [Craft Style] + [Color/Dimension]`.
- **High-CTR Meta Titles**: Optimized under 60 characters for search index engines.
- **13 High-Intent Search Tags**: Tailored for algorithms across Etsy, Amazon Karigar, and ONDC.
- **Crawler Snippets**: 160-character high-density preview text with structured craft provenance and care bullets.
- **JSON-LD Schema Markup**: Valid Schema.org `Product` and `Offer` schema ready for instant crawler indexing.

### 5. 🏷️ Real-Time Dynamic Pricing Intelligence
- **Marketplace Benchmarks**: Indexed comparative pricing across Indian handicraft categories.
- **Cost Metrics**:
  - **Floor Price**: Raw material cost + minimum artisan labor rate.
  - **Market Median**: Average listing price of similar artisan items.
  - **Competitive Target**: Optimal conversion price balancing fair artisan earnings and buyer conversion.
- **Price Anomaly Detection**: Warns artisans if their requested price is $>40\%$ below median to protect their craft value.

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Audio & Vision**: Web Speech API, Web Audio API (`AnalyserNode`), HTML5 Canvas Image Processing
- **Backend / Sync**: Express server with WebSocket bridge, Supabase client integration
