import { useEffect, useRef, useState } from "react";
import { speechCtor } from "../collectJob/useSpeechRecording";

/**
 * Generic record -> interim transcript -> commit-to-text hook, for dictating into a single
 * arbitrary text field (as opposed to `useSpeechRecording`, which is wired specifically to a
 * whole `JobDraft`'s transcript). Mirrors the same Web Speech API usage/UX
 * (continuous + interim results, auto-restart on end, mic-permission error handling) so
 * dictation feels identical wherever it shows up, without coupling callers to `JobDraft`.
 */
export function useDictation({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [micBlocked, setMicBlocked] = useState(false);
  const [micFailed, setMicFailed] = useState(false);
  const [noSpeechApi, setNoSpeechApi] = useState(false);

  const recordingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

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

  // Stop mic/recognition if the component unmounts mid-recording.
  useEffect(() => stopRecording, []);

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
    if (!Ctor) {
      setNoSpeechApi(true);
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }

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
        const current = valueRef.current;
        const gap = current && !current.endsWith(" ") ? " " : "";
        onChangeRef.current(`${current}${gap}${finals.trim()}`);
      }
      setInterim(live.trim());
    };
    rec.onerror = (event) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
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

    setInterim("");
    recordingRef.current = true;
    setRecording(true);
  }

  return { recording, interim, micBlocked, micFailed, noSpeechApi, startRecording, stopRecording };
}
