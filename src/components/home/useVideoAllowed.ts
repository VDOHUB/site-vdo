"use client";

import { useSyncExternalStore } from "react";

type Connection = EventTarget & { saveData?: boolean };

const REDUCE = "(prefers-reduced-motion: reduce)";

function connection(): Connection | undefined {
  return (navigator as Navigator & { connection?: Connection }).connection;
}

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia?.(REDUCE);
  mq?.addEventListener?.("change", onChange);
  const conn = connection();
  conn?.addEventListener?.("change", onChange);
  return () => {
    mq?.removeEventListener?.("change", onChange);
    conn?.removeEventListener?.("change", onChange);
  };
}

function getSnapshot(): boolean {
  const reduce = window.matchMedia?.(REDUCE).matches ?? false;
  const saveData = connection()?.saveData === true;
  return !reduce && !saveData;
}

/** No servidor (e na hidratação) o vídeo fica desligado: o HTML inicial mostra só o poster. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * true quando o vídeo de fundo pode tocar: sem `prefers-reduced-motion: reduce`
 * e sem economia de dados (`navigator.connection.saveData`).
 */
export function useVideoAllowed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
