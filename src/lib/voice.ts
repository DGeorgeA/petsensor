/**
 * src/lib/voice.ts
 *
 * Emotionally intelligent, localized TTS voice engine.
 *
 * Rules:
 * 1. SPEAK ONLY ONCE per unique detection (never repeat same key)
 * 2. Never speak on NO_DETECTION — only on confirmed detections
 * 3. Never hallucinate (only speaks messages passed from fingerprint engine)
 * 4. Calm, warm, native dialect TTS profiles
 * 5. 8 languages: EN, HI, ML, TA, FR, ES, ZH, JA
 */

export type SupportedLanguage = 'en' | 'hi' | 'ml' | 'ta' | 'fr' | 'es' | 'zh' | 'ja';

interface VoiceConfig {
  langCode: string;
  preferredVoiceNames: string[]; // ordered preference
  pitch: number;
  rate: number;
  volume: number;
}

// ── Voice profiles ─────────────────────────────────────────────────────────────
const VOICE_PROFILES: Record<SupportedLanguage, VoiceConfig> = {
  en: {
    langCode: 'en-US',
    preferredVoiceNames: [
      'Google US English', 'Samantha', 'Victoria',
      'Microsoft Aria Online', 'Microsoft Zira',
      'Google UK English Female', 'Karen',
    ],
    pitch: 1.04,
    rate: 0.82,
    volume: 0.92,
  },
  hi: {
    langCode: 'hi-IN',
    preferredVoiceNames: ['Google हिन्दी', 'Lekha', 'Microsoft Swara Online', 'Microsoft Swara'],
    pitch: 1.08,
    rate: 0.88,
    volume: 0.92,
  },
  ml: {
    langCode: 'ml-IN',
    preferredVoiceNames: ['Google മലയാളം', 'Microsoft Sobhana Online', 'Microsoft Ananya'],
    pitch: 1.00,
    rate: 0.88,
    volume: 0.92,
  },
  ta: {
    langCode: 'ta-IN',
    preferredVoiceNames: ['Google தமிழ்', 'Microsoft Pallavi Online', 'Microsoft Pallavi'],
    pitch: 1.04,
    rate: 0.88,
    volume: 0.92,
  },
  fr: {
    langCode: 'fr-FR',
    preferredVoiceNames: ['Google français', 'Amelie', 'Microsoft Denise Online', 'Microsoft Hortense'],
    pitch: 1.08,
    rate: 0.88,
    volume: 0.92,
  },
  es: {
    langCode: 'es-ES',
    preferredVoiceNames: ['Google español', 'Monica', 'Microsoft Elvira Online', 'Microsoft Laura'],
    pitch: 1.04,
    rate: 0.88,
    volume: 0.92,
  },
  zh: {
    langCode: 'zh-CN',
    preferredVoiceNames: ['Google 普通话', 'Ting-Ting', 'Microsoft Xiaoxiao Online', 'Microsoft Xiaoxiao'],
    pitch: 1.08,
    rate: 0.84,
    volume: 0.92,
  },
  ja: {
    langCode: 'ja-JP',
    preferredVoiceNames: ['Google 日本語', 'Kyoko', 'Microsoft Nanami Online', 'Microsoft Nanami'],
    pitch: 1.12,
    rate: 0.84,
    volume: 0.92,
  },
};

// ── Speak-once guard ───────────────────────────────────────────────────────────
// Tracks the last spoken detection key — never repeats the same key
let _lastSpokenKey = '';
let _isSpeaking = false;

/**
 * Selects the best available voice for the given language config.
 */
async function resolveVoice(config: VoiceConfig): Promise<SpeechSynthesisVoice | undefined> {
  let voices = window.speechSynthesis.getVoices();

  // Chrome loads voices asynchronously
  if (voices.length === 0) {
    await new Promise<void>((resolve) => {
      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      // Timeout fallback (some browsers never fire voiceschanged)
      setTimeout(resolve, 1200);
    });
    voices = window.speechSynthesis.getVoices();
  }

  const langPrefix = config.langCode.split('-')[0];

  // Try preferred voices in order
  for (const name of config.preferredVoiceNames) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }

  // Fallback: any female voice for the language
  const female = voices.find(
    v => v.lang.startsWith(langPrefix) &&
         (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('woman') ||
          v.name.toLowerCase().includes('girl'))
  );
  if (female) return female;

  // Final fallback: any voice for the language
  return voices.find(v => v.lang.startsWith(langPrefix));
}

/**
 * Speak a detected emotion message, with speak-once guard.
 * Pass `detectionKey` to prevent repeating the same detection.
 * Pass `force: true` to bypass the speak-once guard.
 */
export async function speakDetection(
  message: string,
  detectionKey: string,
  language: SupportedLanguage = 'en',
  force = false,
): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  if (_isSpeaking) return;

  // Speak-once guard
  if (!force && detectionKey === _lastSpokenKey) return;

  _lastSpokenKey = detectionKey;
  _isSpeaking = true;

  const config = VOICE_PROFILES[language];

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = config.langCode;
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = config.volume;

  const voice = await resolveVoice(config);
  if (voice) utterance.voice = voice;

  utterance.onend = () => { _isSpeaking = false; };
  utterance.onerror = () => { _isSpeaking = false; };

  window.speechSynthesis.speak(utterance);
}

/**
 * Say the null detection message ONCE per session.
 * Only call this when you want to explicitly inform the user nothing was found.
 */
let _hasSpokenNull = false;
export async function speakNoDetection(language: SupportedLanguage = 'en'): Promise<void> {
  if (_hasSpokenNull) return;
  _hasSpokenNull = true;

  const nullMessages: Record<SupportedLanguage, string> = {
    en: 'No emotional anomalies detected.',
    hi: 'कोई भावनात्मक असामान्यता नहीं मिली।',
    ml: 'വൈകാരിക അസ്വാഭാവികത ഒന്നും കണ്ടെത്തിയില്ല.',
    ta: 'உணர்ச்சி அசாதாரணங்கள் எதுவும் கண்டறியப்படவில்லை.',
    fr: 'Aucune anomalie émotionnelle détectée.',
    es: 'No se detectaron anomalías emocionales.',
    zh: '未检测到情绪异常。',
    ja: '感情的な異常は検出されませんでした。',
  };

  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const config = VOICE_PROFILES[language];
  const utterance = new SpeechSynthesisUtterance(nullMessages[language]);
  utterance.lang = config.langCode;
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = config.volume;

  const voice = await resolveVoice(config);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

/** Reset guards (call when a new sensing session starts) */
export function resetVoiceGuards(): void {
  _lastSpokenKey = '';
  _isSpeaking = false;
  _hasSpokenNull = false;
  window.speechSynthesis?.cancel();
}

// Backwards-compatible export for existing callers
export async function speakWarmly(message: string, language: SupportedLanguage = 'en'): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  const config = VOICE_PROFILES[language];
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = config.langCode;
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = config.volume;
  const voice = await resolveVoice(config);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
