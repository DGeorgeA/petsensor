// src/lib/voice.ts

export type SupportedLanguage = 'en' | 'hi' | 'ml' | 'ta' | 'fr' | 'es' | 'zh' | 'ja';

interface VoiceConfig {
  langCode: string;
  premiumIdentifiers: string[];
  pitch: number;
  rate: number;
}

// Meticulously curated voice profiles to ensure a warm, gentle, and native tone.
const VOICE_PROFILES: Record<SupportedLanguage, VoiceConfig> = {
  'en': {
    langCode: 'en-US', // or en-GB for a softer tone
    premiumIdentifiers: ['Google US English', 'Samantha', 'Victoria', 'Microsoft Zira', 'Google UK English Female'],
    pitch: 1.05,
    rate: 0.85
  },
  'hi': {
    langCode: 'hi-IN',
    premiumIdentifiers: ['Google हिन्दी', 'Lekha', 'Microsoft Swara'],
    pitch: 1.1,
    rate: 0.9
  },
  'ml': {
    langCode: 'ml-IN',
    premiumIdentifiers: ['Google മലയാളം', 'Microsoft Ananya'],
    pitch: 1.0,
    rate: 0.9
  },
  'ta': {
    langCode: 'ta-IN',
    premiumIdentifiers: ['Google தமிழ்', 'Microsoft Pallavi'],
    pitch: 1.05,
    rate: 0.9
  },
  'fr': {
    langCode: 'fr-FR',
    premiumIdentifiers: ['Google français', 'Amelie', 'Thomas', 'Microsoft Hortense'],
    pitch: 1.1,
    rate: 0.9
  },
  'es': {
    langCode: 'es-ES',
    premiumIdentifiers: ['Google español', 'Monica', 'Microsoft Laura'],
    pitch: 1.05,
    rate: 0.9
  },
  'zh': {
    langCode: 'zh-CN',
    premiumIdentifiers: ['Google 普通话', 'Ting-Ting', 'Microsoft Xiaoxiao'],
    pitch: 1.1,
    rate: 0.85
  },
  'ja': {
    langCode: 'ja-JP',
    premiumIdentifiers: ['Google 日本語', 'Kyoko', 'Microsoft Nanami'],
    pitch: 1.15,
    rate: 0.85
  }
};

/**
 * World-class emotional voice synthesizer.
 * In a full production environment with API keys, this would route to ElevenLabs/Google Cloud TTS.
 * Here, it dynamically hunts for the most premium OS-level voices available.
 */
export async function speakWarmly(message: string, language: SupportedLanguage = 'en'): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }

  // Ensure voices are loaded (Chrome sometimes delays this)
  let voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    await new Promise<void>(resolve => {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve();
      };
    });
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  const config = VOICE_PROFILES[language];
  
  utterance.lang = config.langCode;
  utterance.pitch = config.pitch; // Soften and warm the pitch
  utterance.rate = config.rate;   // Slow, comforting, meditative pace
  utterance.volume = 0.95;

  // Search for the most premium female voice available
  let selectedVoice = voices.find(v => 
    config.premiumIdentifiers.some(id => v.name.includes(id)) && v.lang.startsWith(config.langCode.split('-')[0])
  );

  // Fallback to any local female voice for the language
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith(config.langCode.split('-')[0]) && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')));
  }

  // Final fallback to just matching the language
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith(config.langCode.split('-')[0]));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
