import { ProductListing, SupportedLanguageCode } from '../../types';

export interface LocalizedCopy {
  title: string;
  description: string;
  culturalStory: string;
  materials: string[];
}

interface LangTpl {
  titlePrefix: string;
  mk: (name: string, mats: string, tech: string, region: string) => string;
  story: (name: string, village: string, state: string) => string;
}

export const TRANSLATE_LANGUAGES: SupportedLanguageCode[] = [
  'hi',
  'ta',
  'te',
  'bn',
  'mr',
  'gu',
  'kn',
  'ml',
  'or',
  'pa',
  'en',
];

const TPL: Record<SupportedLanguageCode, LangTpl> = {
  hi: {
    titlePrefix: 'हस्तनिर्मित',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'पारंपरिक सामग्री'}, ${tech || 'पारंपरिक कौशल'} से बारीक हस्तनिर्मित। ${region || 'प्रामाणिक कारीगरों'} द्वारा निष्पक्ष मूल्य पर सीधे आप तक पहुँचाया गया।`,
    story: (n, village, state) =>
      `${n} हमारी विरासत की कहानी है — ${village || 'इस क्षेत्र'}, ${state || 'भारत'} की पीढ़ियों का शिल्प जो आज आपके घर में नया जीवन पाता है।`,
  },
  ta: {
    titlePrefix: 'கைவினை',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'பாரம்பரிய பொருட்கள்'}, ${tech || 'பாரம்பரிய நுட்பம்'} உள்ளிட்ட நுணுக்கமான கைவினை. ${region || 'நம்பகமான கைவினைஞர்களால்'} நேரடியாக நியாயமான விலையில் உங்களுக்கு.`,
    story: (n, village, state) =>
      `${n} என்பது நமது பாரம்பரியத்தின் கதை — ${village || 'இந்த பகுதி'}, ${state || 'இந்தியா'} தலைமுறைகளின் கைவினை, இன்று உங்கள் வீட்டில் புதிய வாழ்க்கையைப் பெறுகிறது.`,
  },
  te: {
    titlePrefix: 'చేతితో తయారు',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'సాంప్రదాయిక పదార్థాలు'}, ${tech || 'సాంప్రదాయ నైపుణ్యం'}తో సూక్ష్మంగా చేతితో తయారు. ${region || 'ప్రామాణిక కళాకారుల నుండి'} న్యాయమైన ధరకు నేరుగా మీ వద్దకు.`,
    story: (n, village, state) =>
      `${n} మన వారసత్వ కథ — ${village || 'ఈ ప్రాంతం'}, ${state || 'భారతదేశం'} తరాల శిల్పకళ, ఈరోజు మీ ఇంటిలో కొత్త జీవితం.`,
  },
  bn: {
    titlePrefix: 'হাতে তৈরি',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'ঐতিহ্যবাহী উপকরণ'}, ${tech || 'ঐতিহ্যবাহী কারিগরি'} দিয়ে সূক্ষ্ম হস্তশিল্প। ${region || 'প্রামাণিক কারিগরদের কাছ থেকে'} ন্যায্য মূল্যে সরাসরি আপনার কাছে।`,
    story: (n, village, state) =>
      `${n} আমাদের ঐতিহ্যের গল্প — ${village || 'এই অঞ্চল'}, ${state || 'ভারত'} প্রজন্মের শিল্প, আজ আপনার বাড়িতে নতুন জীবন পায়।`,
  },
  mr: {
    titlePrefix: 'हस्तनिर्मित',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'पारंपरिक साहित्य'}, ${tech || 'पारंपरिक कौशल्य'} यांनी बारकाईने हस्तनिर्मित. ${region || 'प्रामाणिक कारागिरांकडून'} थेट वाजवी किमतीत आपल्यापर्यंत.`,
    story: (n, village, state) =>
      `${n} ही आपल्या वारशाची गोष्ट आहे — ${village || 'या भागातील'}, ${state || 'भारत'} च्या पिढ्यांची शिल्पकला, आज आपल्या घरात नव्याने जिवंत होते.`,
  },
  gu: {
    titlePrefix: 'હસ્તનિર્મિત',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'પરંપરાગત સામગ્રી'}, ${tech || 'પરંપરાગત કૌશલ્ય'} વડે સૂક્ષ્મ હસ્તકલા. ${region || 'અધિકૃત કારીગરો તરફથી'} વાજબી ભાવે સીધા તમારા સુધી.`,
    story: (n, village, state) =>
      `${n} એ આપણા વારસાની વાર્તા છે — ${village || 'આ પ્રદેશ'}, ${state || 'ભારત'} ની પેઢી દર પેઢીની કળા, આજે તમારા ઘરમાં નવું જીવન મેળવે છે.`,
  },
  kn: {
    titlePrefix: 'ಕೈಮಾಡಿದ',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'ಸಾಂಪ್ರದಾಯಿಕ ಸಾಮಗ್ರಿ'}, ${tech || 'ಸಾಂಪ್ರದಾಯಿಕ ಕೌಶಲ್ಯ'} ದಿಂದ ಸೂಕ್ಷ್ಮ ಹಸ್ತಕಲೆ. ${region || 'ಪ್ರಮಾಣೀಕೃತ ಕುಶಲಕರ್ಮಿಗಳಿಂದ'} ನೇರ ನ್ಯಾಯಯುತ ದರದಲ್ಲಿ ನಿಮ್ಮ ಬಳಿಗೆ.`,
    story: (n, village, state) =>
      `${n} ನಮ್ಮ ಪರಂಪರೆಯ ಕಥೆ — ${village || 'ಈ ಪ್ರದೇಶ'}, ${state || 'ಭಾರತ'} ತಲೆಮಾರುಗಳ ಕರಕುಶಲ, ಇಂದು ನಿಮ್ಮ ಮನೆಯಲ್ಲಿ ಹೊಸ ಜೀವನ ಪಡೆಯುತ್ತದೆ.`,
  },
  ml: {
    titlePrefix: 'കൈകൊണ്ട് നിർമ്മിച്ച',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'പാരമ്പര്യ വസ്തുക്കൾ'}, ${tech || 'പാരമ്പര്യ നൈപുണ്യം'} എന്നിവയാൽ സൂക്ഷ്മമായ കൈവേല. ${region || 'ആധികാരിക കരകൗശല വിദഗ്ധരിൽ നിന്ന്'} നേരിട്ട് ന്യായമായ വിലയിൽ.`,
    story: (n, village, state) =>
      `${n} നമ്മുടെ പൈതൃകത്തിന്റെ കഥ — ${village || 'ഈ പ്രദേശം'}, ${state || 'ഇന്ത്യ'} യിലെ തലമുറകളുടെ കരകൗശലം, ഇന്ന് നിങ്ങളുടെ വീട്ടിൽ പുതിയ ജീവൻ കണ്ടെത്തുന്നു.`,
  },
  or: {
    titlePrefix: 'ହାତ ତିଆରି',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'ପାରମ୍ପରିକ ସାମଗ୍ରୀ'}, ${tech || 'ପାରମ୍ପରିକ ଦକ୍ଷତା'} ଦ୍ଵାରା ସୂକ୍ଷ୍ମ ହସ୍ତଶିଳ୍ପ। ${region || 'ପ୍ରାମାଣିକ କାରିଗରଙ୍କ ଠାରୁ'} ସିଧାସଳଖ ଉଚିତ ମୂଲ୍ୟରେ।`,
    story: (n, village, state) =>
      `${n} ଆମ ପରମ୍ପରାର କାହାଣୀ — ${village || 'ଏହି ଅଞ୍ଚଳ'}, ${state || 'ଭାରତ'} ର ପିଢ଼ି ପରେ ପିଢ଼ିର ଶିଳ୍ପକଳା, ଆଜି ଆପଣଙ୍କ ଘରେ ନୂଆ ଜୀବନ ପାଏ।`,
  },
  pa: {
    titlePrefix: 'ਦਸਤੀ ਬਣਾਇਆ',
    mk: (n, m, tech, region) =>
      `${n} — ${m || 'ਰਵਾਇਤੀ ਸਮੱਗਰੀ'}, ${tech || 'ਰਵਾਇਤੀ ਹੁਨਰ'} ਨਾਲ ਬਾਰੀਕ ਹੱਥ ਕਲਾ। ${region || 'ਪ੍ਰਮਾਣਿਕ ਕਾਰੀਗਰਾਂ ਤੋਂ'} ਸਿੱਧਾ ਨਿਰਪੱਖ ਮੁੱਲ 'ਤੇ ਤੁਹਾਡੇ ਤੱਕ।`,
    story: (n, village, state) =>
      `${n} ਸਾਡੀ ਵਿਰਾਸਤ ਦੀ ਕਹਾਣੀ ਹੈ — ${village || 'ਇਸ ਖੇਤਰ'}, ${state || 'ਭਾਰਤ'} ਦੀਆਂ ਪੀੜ੍ਹੀਆਂ ਦੀ ਕਲਾ, ਅੱਜ ਤੁਹਾਡੇ ਘਰ ਵਿੱਚ ਨਵਾਂ ਜੀਵਨ ਪਾਂਦੀ ਹੈ।`,
  },
  en: {
    titlePrefix: 'Handmade',
    mk: (n, m, tech, region) =>
      `${n} — finely handcrafted with ${m || 'traditional materials'} through ${tech || 'generational skill'}. Delivered directly from ${region || 'authentic rural artisans'} at a fair, trade-backed price.`,
    story: (n, village, state) =>
      `${n} carries the living story of ${village || 'this region'}, ${state || 'India'} craftsmanship across generations of master artisans.`,
  },
};

// Small bilingual glossary of common craft materials so listings stay fully
// readable in every buyer language even with the AI server offline.
const MAT_GLOSSARY: Record<string, Partial<Record<SupportedLanguageCode, string>>> = {
  clay: { hi: 'मिट्टी', ta: 'களிமண்', te: 'మట్టి', bn: 'মাটি', mr: 'माती', gu: 'માટી', kn: 'ಜೇಡಿಮಣ್ಣು', ml: 'മണ്ണ്', or: 'ମାଟି', pa: 'ਮਿੱਟੀ', en: 'clay' },
  alluvial: { hi: 'कछारी', ta: 'வண்டல்', te: 'గౌరు', bn: 'পলি', mr: 'गाळाची', gu: 'કાંપ', kn: 'ಮೆಕ್ಕಲು', ml: 'എക്കൽ', or: 'ପଟା', pa: 'ਪੱਤਣ', en: 'alluvial' },
  terracotta: { hi: 'टेराकोटा', ta: 'டெரகோட்டா', te: 'టెర్రకోటా', bn: 'টেরাকোটা', mr: 'टेराकोटा', gu: 'ટેરાકોટા', kn: 'ಟೆರಾಕೋಟಾ', ml: 'ടെരാക്കോട്ട', or: 'ଟେରାକୋଟା', pa: 'ਟੇਰਾਕੋਟਾ', en: 'terracotta' },
  silk: { hi: 'रेशम', ta: 'பட்டு', te: 'పట్టు', bn: 'রেশম', mr: 'रेशीम', gu: 'રેશમ', kn: 'ರೇಷ್ಮೆ', ml: 'പട്ട്', or: 'ରେଶମ', pa: 'ਰੇਸ਼ਮ', en: 'silk' },
  cotton: { hi: 'कपास', ta: 'பருத்தி', te: 'పత్తి', bn: 'তুলা', mr: 'कापूस', gu: 'કપાસ', kn: 'ಹತ್ತಿ', ml: 'പരുത്തി', or: 'ସୂତା', pa: 'ਕਪਾਹ', en: 'cotton' },
  wool: { hi: 'ऊन', ta: 'கம்பளி', te: 'ఉన్ని', bn: 'উল', mr: 'लोकर', gu: 'ಊನ', kn: 'ಉಣ್ಣೆ', ml: 'കമ്പിളി', or: 'ପଶମ', pa: 'ਊਨ', en: 'wool' },
  brass: { hi: 'पीतल', ta: 'பித்தளை', te: 'ఇత్తడి', bn: 'পিতল', mr: 'पितळ', gu: 'પિત્તળ', kn: 'ಹಿತ್ತಾಳೆ', ml: 'പിത്തള', or: 'ପିତ୍ତଳ', pa: 'ਪਿੱਤਲ', en: 'brass' },
  wood: { hi: 'लकड़ी', ta: 'மரம்', te: 'చెక్క', bn: 'কাঠ', mr: 'लाकूड', gu: 'લાકડું', kn: 'ಮರ', ml: 'മരം', or: 'କାଠ', pa: 'ਲੱਕੜ', en: 'wood' },
  bamboo: { hi: 'बांस', ta: 'மூங்கில்', te: 'వెదురు', bn: 'বাঁশ', mr: 'बांबू', gu: 'વાંસ', kn: 'ಬಿದಿರು', ml: 'മുള', or: 'ବାଉଁଶ', pa: 'ਬਾਂਸ', en: 'bamboo' },
  cane: { hi: 'बेत', ta: 'பிரம்பு', te: 'తీగ', bn: 'বেত', mr: 'वेत', gu: 'વેતર', kn: 'ಬೆತ್ತ', ml: 'വേഴ', or: 'ବେତ', pa: 'ਬੇਤ', en: 'cane' },
  jute: { hi: 'जूट', ta: 'சணல்', te: 'జనపనార', bn: 'পাট', mr: 'ज्यूट', gu: 'જૂટ', kn: 'ಸೆಣಬು', ml: 'ചണം', or: 'ପାଟ', pa: 'ਜੂਟ', en: 'jute' },
  leather: { hi: 'चमड़ा', ta: 'தோல்', te: 'తోలు', bn: 'চামড়া', mr: 'चामडे', gu: 'ચામડું', kn: 'ಚರ್ಮ', ml: 'തോൽ', or: 'ଚମଡ଼ା', pa: 'ਚਮੜਾ', en: 'leather' },
  beads: { hi: 'मनके', ta: 'மணிகள்', te: 'పూసలు', bn: 'পুঁতি', mr: 'मणी', gu: 'મણકા', kn: 'ಮಣಿಗಳು', ml: 'മുത്തുകൾ', or: 'ମାଳି', pa: 'ਮਣਕੇ', en: 'beads' },
  bead: { hi: 'मनका', ta: 'மணி', te: 'పూస', bn: 'পুঁতি', mr: 'मणी', gu: 'મણકો', kn: 'ಮಣಿ', ml: 'മുത്ത്', or: 'ମାଳି', pa: 'ਮਣਕਾ', en: 'bead' },
  dye: { hi: 'रंग', ta: 'சாயம்', te: 'రంగు', bn: 'রং', mr: 'रंग', gu: 'રંગ', kn: 'ಬಣ್ಣ', ml: 'ചായം', or: 'ରଙ୍ଗ', pa: 'ਰੰਗ', en: 'dye' },
  dyeing: { hi: 'रंगाई', ta: 'சாயமிடுதல்', te: 'రంగు వేయడం', bn: 'রং করার', mr: 'रंगाई', gu: 'રંગાઈ', kn: 'ಬಣ್ಣ ಹಾಕುವ', ml: 'ചായമിടൽ', or: 'ରଙ୍ଗ', pa: 'ਰੰਗਾਈ', en: 'dyeing' },
  pigment: { hi: 'वर्णक', ta: 'நிறமி', te: 'రంగు పదార్థం', bn: 'রঙ্গক', mr: 'वर्णक', gu: 'રંજક', kn: 'ವರ್ಣದ್ರವ್ಯ', ml: 'വർണം', or: 'ରଙ୍ଗ', pa: 'ਪਿਗਮੈਂਟ', en: 'pigment' },
  thread: { hi: 'धागा', ta: 'நூல்', te: 'దారం', bn: 'সুতো', mr: 'दोरा', gu: 'દોરો', kn: 'ದಾರ', ml: 'നൂൽ', or: 'ସୂତା', pa: 'ਧਾਗਾ', en: 'thread' },
  stone: { hi: 'पत्थर', ta: 'கல்', te: 'రాయి', bn: 'পাথর', mr: 'दगड', gu: 'પથ્થર', kn: 'ಕಲ್ಲು', ml: 'കല്ല്', or: 'ପଥର', pa: 'ਪੱਥਰ', en: 'stone' },
  gold: { hi: 'सोना', ta: 'தங்கம்', te: 'బంగారం', bn: 'সোনা', mr: 'सोने', gu: 'સોનું', kn: 'ಚಿನ್ನ', ml: 'സ്വർണം', or: 'ସୁନା', pa: 'ਸੋਨਾ', en: 'gold' },
  silver: { hi: 'चांदी', ta: 'வெள்ளி', te: 'వెండి', bn: 'রূপা', mr: 'चांदी', gu: 'ચાંદી', kn: 'ಬೆಳ್ಳಿ', ml: 'വെള്ളി', or: 'ରୂପା', pa: 'ਚਾਂਦੀ', en: 'silver' },
  copper: { hi: 'तांबा', ta: 'செம்பு', te: 'రాగి', bn: 'তামা', mr: 'तांबे', gu: 'તાંબું', kn: 'ತಾಮ್ರ', ml: 'ചെമ്പ്', or: 'ତମ୍ବା', pa: 'ਤਾਂਬਾ', en: 'copper' },
  metal: { hi: 'धातु', ta: 'உலோகம்', te: 'లోహం', bn: 'ধাতু', mr: 'धातू', gu: 'ધાતુ', kn: 'ಲೋಹ', ml: 'ലോഹം', or: 'ଧାତୁ', pa: 'ਧਾਤ', en: 'metal' },
  fabric: { hi: 'कपड़ा', ta: 'துணி', te: 'బట్ట', bn: 'কাপড়', mr: 'कापड', gu: 'કાપડ', kn: 'ಬಟ್ಟೆ', ml: 'തുണി', or: 'କନା', pa: 'ਕੱਪੜਾ', en: 'fabric' },
  natural: { hi: 'प्राकृतिक', ta: 'இயற்கை', te: 'సహజ', bn: 'প্রাকৃতিক', mr: 'नैसर्गिक', gu: 'કુદરતી', kn: 'ನೈಸರ್ಗಿಕ', ml: 'പ്രകൃതിദത്ത', or: 'ପ୍ରାକୃତିକ', pa: 'ਕੁਦਰਤੀ', en: 'natural' },
  organic: { hi: 'जैविक', ta: 'கரிம', te: 'సేంద్రీయ', bn: 'জৈব', mr: 'सेंद्रिय', gu: 'કાર્બનિક', kn: 'ಸಾವಯವ', ml: 'ജൈവ', or: 'ଜୈବିକ', pa: 'ਜੈਵਿਕ', en: 'organic' },
  traditional: { hi: 'पारंपरिक', ta: 'பாரம்பரிய', te: 'సాంప్రదాయ', bn: 'ঐতিহ্যবাহী', mr: 'पारंपारिक', gu: 'પરંપરાગત', kn: 'ಸಾಂಪ್ರದಾಯಿಕ', ml: 'പാരമ്പര്യ', or: 'ପାରମ୍ପରିକ', pa: 'ਰਵਾਇਤੀ', en: 'traditional' },
};

function translateMaterialToken(token: string, lang: SupportedLanguageCode): string {
  const entry = MAT_GLOSSARY[token]; // token already lowercased
  if (!entry) return '';
  return entry[lang] || entry.en || '';
}

// Translates a material phrase word-by-word (unknown words are kept as-is so
// nothing meaningful is ever lost).
export function translateMaterial(phrase: string, lang: SupportedLanguageCode): string {
  if (!phrase) return '';
  const canonical = phrase.toLowerCase();
  const direct = MAT_GLOSSARY[canonical];
  if (direct) return direct[lang] || direct.en || phrase;
  const words = phrase.split(/\s+/);
  const translated = words.map((w) => {
    const t = translateMaterialToken(w.toLowerCase().replace(/[^a-z]/g, ''), lang);
    return t || w;
  });
  return translated.join(' ');
}

// Deterministic offline localizer: rebuilds the listing copy in the buyer's
// language from structured fields whenever live machine translation is off-line.
export function localizeProductFor(lang: SupportedLanguageCode, product: ProductListing): LocalizedCopy {
  const tpl = TPL[lang] || TPL.en;
  const rawName = (product.title || '')
    .replace(/^handmade\s+/i, '')
    .replace(/^authentic\s+handcrafted\s+/i, '')
    .replace(/^हस्तनिर्मित\s+/i, '')
    .trim();

  const materials = (product.materials || []).map((m) => translateMaterial(m, lang)).filter(Boolean);
  const matsText = materials.join(', ');
  const region = [product.artisanVillage, product.artisanState].filter(Boolean).join(', ');

  return {
    title: `${tpl.titlePrefix} ${rawName || product.title}`,
    description: tpl.mk(rawName || product.title, matsText, product.craftTechnique || '', region),
    culturalStory: tpl.story(rawName || product.title, product.artisanVillage, product.artisanState),
    materials,
  };
}

function toSanitizedCopy(raw: any): LocalizedCopy | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null;
  const description = typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : null;
  const culturalStory = typeof raw.culturalStory === 'string' && raw.culturalStory.trim() ? raw.culturalStory.trim() : null;
  const materials =
    Array.isArray(raw.materials) && raw.materials.length
      ? raw.materials.map((m: any) => String(m).trim()).filter(Boolean)
      : null;
  if (!title && !description && !culturalStory && !materials) return null;
  return {
    title: title || '',
    description: description || '',
    culturalStory: culturalStory || '',
    materials: materials || [],
  };
}

// Live machine translation with graceful offline fallback to the deterministic
// localizer, so the buyer storefront is always readable in the selected language.
export async function translateProductCopy(
  lang: SupportedLanguageCode,
  product: ProductListing
): Promise<LocalizedCopy> {
  const fallback = localizeProductFor(lang, product);

  try {
    const res = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lang,
        copy: {
          title: product.title,
          description: product.description,
          culturalStory: product.culturalStory,
          materials: product.materials || [],
        },
      }),
    });
    const data = await res.json();
    if (data && data.translated && data.copy) {
      const c = toSanitizedCopy(data.copy);
      if (c) {
        return {
          title: c.title || fallback.title,
          description: c.description || fallback.description,
          culturalStory: c.culturalStory || fallback.culturalStory,
          materials: c.materials && c.materials.length ? c.materials : fallback.materials,
        };
      }
    }
  } catch (err) {
    console.warn('Live translation unavailable, using deterministic localizer:', err);
  }
  return fallback;
}