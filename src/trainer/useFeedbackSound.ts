import { useEffect, useRef, useState } from "react";
import correctUrl from "./audio/correct.mp3";
import wrongUrl from "./audio/wrong.mp3";
const KEY = "range-painter.trainer.sound.v1";
type SoundSettings = { enabled: boolean; volume: number };
function readSettings(): SoundSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (typeof saved?.enabled === "boolean" && typeof saved?.volume === "number" && Number.isFinite(saved.volume)) {
      return { enabled: saved.enabled, volume: Math.max(0, Math.min(1, saved.volume)) };
    }
  } catch { /* 保存できない環境でも音とクイズは利用できる。 */ }
  return { enabled: true, volume: 0.5 };
}
export function useFeedbackSound() {
  const [sound, setSound] = useState(readSettings);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  function stop() {
    if (audio.current) { audio.current.pause(); audio.current.currentTime = 0; audio.current = null; }
  }
  useEffect(() => () => stop(), []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(sound)); setSaveError(false); }
    catch { setSaveError(true); }
    if (!sound.enabled || sound.volume === 0) stop();
    else if (audio.current) audio.current.volume = sound.volume;
  }, [sound]);
  function play(correct: boolean) {
    stop(); setError("");
    if (!sound.enabled || sound.volume === 0) return;
    // 回答操作のハンドラ内で再生する。effect経由の自動再生や二重再生を避ける。
    const clip = new Audio(correct ? correctUrl : wrongUrl);
    clip.volume = sound.volume;
    audio.current = clip;
    void clip.play().catch(() => {
      if (audio.current === clip) setError("効果音を再生できませんでした。");
    });
  }
  return { sound, setSound, play, stop, error, saveError };
}
