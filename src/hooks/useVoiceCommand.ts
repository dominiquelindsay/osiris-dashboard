import { useState, useEffect, useCallback, useRef } from "react";

interface VoiceCommandState {
  listening: boolean;
  transcript: string;
  lastCommand: string;
  error: string | null;
}

const COMMANDS: Record<string, string[]> = {
  dashboard: ["command center", "main screen", "home", "dashboard"],
  constellation: ["constellation", "satellites", "starlink", "network"],
  iss: ["iss", "space station", "international space station", "zarya"],
  threats: ["threats", "threat intel", "cyber threats", "security"],
  redteam: ["red team", "attack simulation", "adversary", "breach"],
  terminal: ["terminal", "console", "command line", "shell"],
  spaceweather: ["space weather", "solar flare", "geomagnetic", "weather"],
  conflicts: ["conflicts", "war zones", "battle zones", "armed conflict"],
  defcon: ["defcon", "red alert", "alert status", "threat level"],
};

function matchCommand(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  for (const [view, phrases] of Object.entries(COMMANDS)) {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) return view;
    }
  }
  return null;
}

export function useVoiceCommand(onCommand: (view: string) => void) {
  const [state, setState] = useState<VoiceCommandState>({
    listening: false,
    transcript: "",
    lastCommand: "",
    error: null,
  });
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setState(s => ({ ...s, error: "Speech Recognition not supported" }));
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setState(s => ({ ...s, transcript }));

      const cmd = matchCommand(transcript);
      if (cmd) {
        setState(s => ({ ...s, lastCommand: cmd, transcript: "" }));
        onCommand(cmd);
        rec.stop();
        setTimeout(() => rec.start(), 500);
      }
    };

    rec.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        setState(s => ({ ...s, error: event.error }));
      }
    };

    rec.onend = () => {
      setState(s => ({ ...s, listening: false }));
    };

    recognitionRef.current = rec;

    return () => {
      rec.stop();
    };
  }, [onCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setState(s => ({ ...s, listening: true, error: null }));
      recognitionRef.current.start();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState(s => ({ ...s, listening: false }));
    }
  }, []);

  return { ...state, startListening, stopListening };
}
