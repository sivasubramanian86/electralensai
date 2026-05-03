import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../constants';

export interface LiveMessage {
  type: 'text' | 'transcript' | 'session_id' | 'error';
  content?: string;
  text?: string;
  session_id?: string;
  error?: string;
}

export function useLiveAgent() {
  const { i18n } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueue = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const stopSession = useCallback(() => {
    setIsActive(false);
    setIsSpeaking(false);
    
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'finalize' }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    audioQueue.current = [];
    isPlayingRef.current = false;
  }, []);

  const playNextInQueueRef = useRef<() => void>(() => {});

  const playNextInQueue = useCallback(async () => {
    if (audioQueue.current.length === 0 || isPlayingRef.current || !audioContextRef.current) {
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const data = audioQueue.current.shift()!;

    try {
      // Gemini Live typically sends raw 16-bit PCM at 24kHz
      const pcmData = new Int16Array(data);
      const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        if (audioQueue.current.length === 0) {
          setIsSpeaking(false);
        }
        playNextInQueueRef.current();
      };
      source.start();
    } catch (err) {
      console.error('Audio playback error:', err);
      isPlayingRef.current = false;
      playNextInQueueRef.current();
    }
  }, []);

  useEffect(() => {
    playNextInQueueRef.current = playNextInQueue;
  }, [playNextInQueue]);

  const lastLangRef = useRef(i18n.language);

  const startSession = useCallback(async () => {
    try {
      setIsActive(true);
      const lang = i18n.language.split('-')[0];
      lastLangRef.current = i18n.language; // Sync ref on manual start
      setTranscript(`Connecting to ElectraLens Live (${lang.toUpperCase()})...`);

      // 1. Initialize WebSocket with Language Query Param
      // If API_BASE is https or we are on https, use wss
      const isSecure = window.location.protocol === 'https:' || API_BASE.startsWith('https:');
      const protocol = isSecure ? 'wss:' : 'ws:';
      const host = API_BASE.replace(/^https?:\/\//, '');
      const wsUrl = `${protocol}//${host}/ws/session?lang=${lang}`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      const socket = new WebSocket(wsUrl);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = () => {
        setTranscript(`Connection established in ${lang.toUpperCase()}. Listening...`);
        socket.send(JSON.stringify({ type: 'audio_start' }));
      };

      socket.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          audioQueue.current.push(event.data);
          playNextInQueue();
        } else if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          audioQueue.current.push(arrayBuffer);
          playNextInQueue();
        } else {
          try {
            const msg: LiveMessage = JSON.parse(event.data);
            if (msg.type === 'text' || msg.type === 'transcript') {
              const newText = msg.text || msg.content || '';
              setTranscript(prev => prev + ' ' + newText);
            } else if (msg.type === 'error') {
              setTranscript(`Error: ${msg.error}`);
            }
          } catch {
            console.error('Failed to parse WebSocket message:', event.data);
          }
        }
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
        stopSession();
      };

      socket.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setTranscript('Connection failed. Please ensure the backend is running.');
        setIsActive(false);
      };

      // 2. Initialize Audio Capture (16kHz PCM)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (evt) => {
        const inputData = evt.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(pcmData.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (err) {
      console.error('Failed to start Live session:', err);
      setTranscript('Microphone access denied or connection failed.');
      setIsActive(false);
    }
  }, [stopSession, playNextInQueue, i18n.language]);

  // Handle Language Shifts: Auto-restart session if active
  useEffect(() => {
    let isMounted = true;
    
    // Only restart if the language actually CHANGED while the session was active
    if (isActive && i18n.language !== lastLangRef.current) {
      console.log(`Language changed from ${lastLangRef.current} to ${i18n.language}. Restarting.`);
      lastLangRef.current = i18n.language;
      
      // Defer stop to next tick to avoid synchronous setState in effect lint error
      setTimeout(() => {
        if (isMounted) stopSession();
      }, 0);

      // Brief timeout to ensure cleanup before restart
      const timer = setTimeout(() => {
        if (isMounted) startSession();
      }, 800);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else if (!isActive) {
      // Keep ref in sync while inactive to prevent restart on first manual start
      lastLangRef.current = i18n.language;
    }
  }, [i18n.language, isActive, startSession, stopSession]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return {
    isActive,
    isSpeaking,
    transcript,
    startSession,
    stopSession
  };
}
