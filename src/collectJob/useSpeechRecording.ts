import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { JobDraft } from "../types";

export const TRANSCRIPT_MAX = 20000;

export function speechCtor(): (new () => SpeechRecognition) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecording({
  draftRef,
  setDraft,
}: {
  draftRef: { current: JobDraft };
  setDraft: Dispatch<SetStateAction<JobDraft>>;
}) {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [micBlocked, setMicBlocked] = useState(false);
  const [micFailed, setMicFailed] = useState(false);
  const [noSpeechApi, setNoSpeechApi] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  const recordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const appendNewlineRef = useRef(false);

  const speechAvailable = Boolean(speechCtor());

  useEffect(() => {
    if (!speechAvailable) setNoSpeechApi(true);
  }, [speechAvailable]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return () => window.clearInterval(id);
  }, [recording]);

  function updateTranscript(next: string) {
    if (next.length > TRANSCRIPT_MAX) {
      setLimitHit(true);
      next = next.slice(0, TRANSCRIPT_MAX);
    } else {
      setLimitHit(false);
    }
    setDraft((d) => ({ ...d, transcript: next }));
  }

  async function startRecording() {
    setMicFailed(false);
    setMicBlocked(false);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicBlocked(true);
      } else {
        setMicFailed(true);
      }
      return;
    }
    streamRef.current = stream;

    const Ctor = speechCtor();
    if (Ctor) {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-IN";
      rec.onresult = (event) => {
        let finals = "";
        let live = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript ?? "";
          if (event.results[i].isFinal) finals += piece;
          else live += piece;
        }
        if (finals.trim()) {
          setDraft((d) => {
            const prefix = appendNewlineRef.current && d.transcript.trim()
              ? d.transcript.endsWith("\n")
                ? ""
                : "\n"
              : "";
            appendNewlineRef.current = false;
            const gap =
              d.transcript && !d.transcript.endsWith(" ") && !prefix ? " " : "";
            return {
              ...d,
              transcript: `${d.transcript}${prefix}${gap}${finals.trim()}`.slice(
                0,
                TRANSCRIPT_MAX,
              ),
            };
          });
        }
        setInterim(live.trim());
      };
      rec.onerror = (event) => {
        if (event.error === "no-speech") return;
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setMicBlocked(true);
          stopRecording();
        }
      };
      rec.onend = () => {
        if (recordingRef.current) {
          try {
            rec.start();
          } catch {
            /* already started */
          }
        }
      };
      try {
        rec.start();
        recognitionRef.current = rec;
      } catch {
        setNoSpeechApi(true);
      }
    } else {
      setNoSpeechApi(true);
    }

    appendNewlineRef.current = draftRef.current.transcript.trim() !== "";
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setInterim("");
    recordingRef.current = true;
    setRecording(true);
  }

  function stopRecording() {
    recordingRef.current = false;
    setRecording(false);
    setInterim("");
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  return {
    recording,
    interim,
    elapsedMs,
    micBlocked,
    micFailed,
    noSpeechApi,
    limitHit,
    recordingRef,
    updateTranscript,
    startRecording,
    stopRecording,
  };
}
