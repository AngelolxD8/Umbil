"use client";

import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionResult {
  0: { transcript: string };
}
interface SpeechRecognitionEvent {
  results: {
    0: SpeechRecognitionResult;
  };
}
interface SpeechRecognitionError {
  error: string;
}
interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onend: () => void;
}

// Extend Window to include webkitSpeechRecognition
interface IWindow extends Window {
  webkitSpeechRecognition: new () => ISpeechRecognition;
  SpeechRecognition: new () => ISpeechRecognition;
}

type UseSpeechRecognitionProps = {
  onTranscript: (text: string) => void;
  onError: (msg: string) => void;
};

export function useSpeechRecognition({ onTranscript, onError }: UseSpeechRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const w = window as unknown as IWindow;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-GB';

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      onError("Microphone error. Please check permissions.");
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording, onTranscript, onError]);

  return { isRecording, toggleRecording };
}