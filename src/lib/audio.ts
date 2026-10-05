/**
 * Web Audio Synthesizer and Web Speech API announcement utilities.
 */

// Synthesizes a party popper explosion ("pop!" + confetti burst) followed by a celebratory fanfare
export function playCelebrationAudio(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        // Fallback to mp3 audio element
        const audio = new Audio('/sounds/win.mp3');
        audio.play().then(() => resolve(true)).catch(() => resolve(false));
        return;
      }

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. Party Popper Physical "POP!" (noise burst + low-frequency punch)
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      noiseFilter.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // Low thump of the popper cannon
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(180, now);
      thump.frequency.exponentialRampToValueAtTime(45, now + 0.1);
      thumpGain.gain.setValueAtTime(0.6, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thump.start(now);
      thump.stop(now + 0.12);

      // 2. Celebratory Golden Fanfare Chords (C5, E5, G5, C6, E6)
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const startTime = now + 0.08 + idx * 0.09;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.28, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.95);
      });

      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Synthesizes a friendly, cheerful, uplifting "bubble-pop" chime
 * for the happy encouraging message popup when no prize was won.
 */
export function playGentlePopAudio(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        resolve(false);
        return;
      }

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. Cheerful Bubble Pop Sound (rising frequency chirp)
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(420, now);
      popOsc.frequency.exponentialRampToValueAtTime(880, now + 0.07);

      popGain.gain.setValueAtTime(0.35, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.1);

      // 2. Warm uplifting chime notes (E5, G#5)
      const chimeNotes = [659.25, 830.61];
      chimeNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startTime = now + 0.06 + idx * 0.09;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });

      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Converts numbers to Indian English words:
 * e.g., 10000000 -> "one crore rupees"
 * e.g., 1000000 -> "ten lakh rupees"
 * e.g., 500000 -> "five lakh rupees"
 * e.g., 5000 -> "five thousand rupees"
 */
export function numberToIndianWords(amount: number): string {
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `${crores === 1 ? 'one' : crores} crore rupees`;
  }
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `${lakhs} lakh rupees`;
  }
  if (amount >= 1000) {
    const thousands = amount / 1000;
    return `${thousands} thousand rupees`;
  }
  return `${amount} rupees`;
}

/**
 * Converts numbers to Malayalam words:
 * e.g., 10000000 -> "ഒരു കോടി രൂപ"
 * e.g., 1000000 -> "പത്ത് ലക്ഷം രൂപ"
 * e.g., 500000 -> "അഞ്ച് ലക്ഷം രൂപ"
 * e.g., 5000 -> "അയ്യായിരം രൂപ"
 */
export function numberToMalayalamWords(amount: number): string {
  if (amount >= 10000000) {
    const crores = Math.floor(amount / 10000000);
    return `${crores === 1 ? 'ഒരു' : crores} കോടി രൂപ`;
  }
  if (amount === 1000000) return 'പത്ത് ലക്ഷം രൂപ';
  if (amount === 500000) return 'അഞ്ച് ലക്ഷം രൂപ';
  if (amount >= 100000) {
    const lakhs = Math.floor(amount / 100000);
    return `${lakhs} ലക്ഷം രൂപ`;
  }
  if (amount === 5000) return 'അയ്യായിരം രൂപ';
  if (amount === 1000) return 'ആയിരം രൂപ';
  if (amount === 500) return 'അഞ്ഞൂറ് രൂപ';
  if (amount === 100) return 'നൂറ് രൂപ';
  return `${amount} രൂപ`;
}

/**
 * Dynamic speech announcement in English, Malayalam, Tamil, and Hindi
 */
export function announceWinning(
  amount: number,
  language: 'en' | 'ml' | 'ta' | 'hi'
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  window.speechSynthesis.cancel(); // cancel any ongoing speech

  let sentence = '';
  let langCode = 'en-IN';

  if (language === 'ml') {
    const mlAmount = numberToMalayalamWords(amount);
    sentence = `അഭിനന്ദനങ്ങൾ. നിങ്ങളുടെ ടിക്കറ്റിന് ${mlAmount} സമ്മാനം ലഭിച്ചു.`;
    langCode = 'ml-IN';
  } else if (language === 'ta') {
    sentence = `வாழ்த்துகள். உங்கள் டிக்கெட் ${numberToIndianWords(amount)} பரிசு வென்றுள்ளது.`;
    langCode = 'ta-IN';
  } else if (language === 'hi') {
    sentence = `बधाई हो। आपके टिकट ने ${numberToIndianWords(amount)} का पुरस्कार जीता है।`;
    langCode = 'hi-IN';
  } else {
    const enAmount = numberToIndianWords(amount);
    sentence = `Congratulations. Your ticket has won ${enAmount}.`;
    langCode = 'en-IN';
  }

  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = langCode;
  utterance.rate = 0.95;

  // Attempt to select specific regional voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(language));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopAnnouncement() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
