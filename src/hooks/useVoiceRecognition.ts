import { useState, useCallback, useRef, useEffect } from 'react';
import type { AutoFailDemerit } from '../types';
import { AUTO_FAIL_DEMERITS } from '../types';

// Keyword mappings for matching spoken phrases to demerits
const DEMERIT_KEYWORDS: { demerit: string; keywords: string[] }[] = [
  // Auto-fail
  { demerit: 'HAZMAT', keywords: ['hazmat', 'haz mat', 'hazardous'] },
  { demerit: 'Unsecured wall locker or keys', keywords: ['wall locker', 'locker', 'keys', 'unsecured locker'] },
  { demerit: 'Unsecured valuables or uniforms', keywords: ['valuables', 'uniforms', 'unsecured valuables', 'unsecured uniforms'] },
  { demerit: 'Unsecured prescription medication', keywords: ['prescription', 'medication', 'medicine', 'meds', 'pills'] },
  { demerit: 'Unsecured tobacco', keywords: ['tobacco', 'cigarettes', 'cigarette', 'vape', 'dip'] },
  { demerit: 'Unsecured perishable food', keywords: ['perishable', 'perishable food', 'food out'] },
  { demerit: 'Contraband', keywords: ['contraband'] },
  { demerit: 'Safety items/window open', keywords: ['safety', 'window open', 'window', 'safety items'] },
  { demerit: 'To go containers/pizza box', keywords: ['to go', 'pizza box', 'pizza', 'containers', 'to-go'] },
  // Regular
  { demerit: 'Bed not made or missing 341', keywords: ['bed', 'bed not made', 'unmade bed', '341', 'missing 341'] },
  { demerit: 'Mirror', keywords: ['mirror'] },
  { demerit: 'Vanity/sink', keywords: ['vanity', 'sink'] },
  { demerit: 'Dirty tile or carpet', keywords: ['tile', 'carpet', 'dirty tile', 'dirty carpet', 'floor'] },
  { demerit: 'Foul odor', keywords: ['odor', 'smell', 'foul odor', 'stink', 'stinks'] },
  { demerit: 'High dust or excessive clutter', keywords: ['dust', 'clutter', 'dusty', 'cluttered', 'high dust'] },
  { demerit: 'Trash in room', keywords: ['trash', 'garbage', 'trash in room'] },
  { demerit: 'Fridge freezer microwave', keywords: ['fridge', 'freezer', 'microwave', 'refrigerator'] },
];

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export interface VoiceRecognitionResult {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  lastMatch: string | null;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceRecognition(
  onDemeritDetected: (demerit: string, type: 'auto-fail' | 'regular') => void
): VoiceRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastMatch, setLastMatch] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const matchDemerits = useCallback((text: string): { demerit: string; type: 'auto-fail' | 'regular' }[] => {
    const lower = text.toLowerCase().trim();
    const matches: { demerit: string; type: 'auto-fail' | 'regular' }[] = [];
    const matchedDemerits = new Set<string>();

    for (const entry of DEMERIT_KEYWORDS) {
      if (matchedDemerits.has(entry.demerit)) continue;
      for (const keyword of entry.keywords) {
        if (lower.includes(keyword)) {
          const isAutoFail = AUTO_FAIL_DEMERITS.includes(entry.demerit as AutoFailDemerit);
          matches.push({
            demerit: entry.demerit,
            type: isAutoFail ? 'auto-fail' : 'regular',
          });
          matchedDemerits.add(entry.demerit);
          break; // Move to next demerit entry once matched
        }
      }
    }
    return matches;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const detectedDemerits = new Set<string>();

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setTranscript('');
      setLastMatch(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(interimTranscript || finalTranscript);

      // Process final results - detect all demerits in the phrase
      if (finalTranscript) {
        const matches = matchDemerits(finalTranscript);
        const newMatches = matches.filter(m => !detectedDemerits.has(m.demerit));

        if (newMatches.length > 0) {
          for (const match of newMatches) {
            detectedDemerits.add(match.demerit);
            onDemeritDetected(match.demerit, match.type);
          }
          const matchNames = newMatches.map(m => m.demerit).join(', ');
          setLastMatch(matchNames);
          setTimeout(() => setLastMatch(null), 2000);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isSupported, matchDemerits, onDemeritDetected]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    lastMatch,
    startListening,
    stopListening,
  };
}
