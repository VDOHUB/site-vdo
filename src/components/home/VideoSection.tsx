"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { video } from "@/lib/media";
import { displayProgress, realProgress } from "@/lib/video-progress";
import { useVideoAllowed } from "./useVideoAllowed";

const STEP_S = 5; // salto das setas do teclado, em segundos de vídeo

/**
 * Vídeo institucional. Começa mudo quando aparece na tela e pausa ao sair; com
 * prefers-reduced-motion ou economia de dados mostra só o poster com botão de play.
 * A barra mostra um progresso "percebido" (rápido no começo, devagar no fim).
 */
export function VideoSection() {
  const allowed = useVideoAllowed();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const [near, setNear] = useState(false); // perto da tela: só então as fontes são carregadas
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [pct, setPct] = useState(0);

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (v) void v.play().catch(() => setPlaying(false));
  }, []);

  // Perto da viewport: libera as fontes (preload="none" até lá).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (near) videoRef.current?.load();
  }, [near]);

  // Autoplay mudo ao entrar na tela; pausa ao sair.
  useEffect(() => {
    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v || !allowed || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (es) => {
        const inView = es.some((e) => e.isIntersecting);
        if (inView && !userPaused.current) {
          setNear(true);
          tryPlay();
        } else if (!inView) v.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [allowed, tryPlay]);

  // Progresso: lê currentTime a cada quadro enquanto toca; a barra muda por style (sem re-render).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = -1;
    const tick = () => {
      const v = videoRef.current;
      if (v && v.duration > 0) {
        const d = displayProgress(v.currentTime / v.duration);
        if (barRef.current) barRef.current.style.transform = `scaleX(${d})`;
        const p = Math.round(d * 100);
        if (p !== last) {
          last = p;
          setPct(p);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const paint = (frac: number) => {
    const d = displayProgress(frac);
    if (barRef.current) barRef.current.style.transform = `scaleX(${d})`;
    setPct(Math.round(d * 100));
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    setNear(true);
    if (v.paused) {
      userPaused.current = false;
      tryPlay();
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const on = !sound; // o som só liga por clique do usuário
    v.muted = !on;
    if (on) v.volume = 1;
    setSound(on);
    // Se o navegador recusar tocar com som, volta ao mudo e o botão reflete o estado real.
    if (on && !v.paused) v.play().catch(() => { v.muted = true; setSound(false); });
  };

  const seekFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const tr = trackRef.current;
    if (!v || !tr || !(v.duration > 0)) return;
    const r = tr.getBoundingClientRect();
    const d = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const real = realProgress(d); // inverte o mapeamento: o clique cai onde foi clicado
    v.currentTime = real * v.duration;
    paint(real);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !(v.duration > 0)) return;
    let t = v.currentTime;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") t += STEP_S;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") t -= STEP_S;
    else if (e.key === "Home") t = 0;
    else if (e.key === "End") t = v.duration;
    else return;
    e.preventDefault();
    v.currentTime = Math.min(v.duration, Math.max(0, t));
    paint(v.currentTime / v.duration);
  };

  return (
    <section className="band video-sec" aria-labelledby="video-title">
      <div className="wrap">
        <div className="shead">
          <div>
            <p className="eyebrow">Institucional</p>
            <h2 id="video-title">Conheça a Viver de Obra.</h2>
          </div>
        </div>
        <div className="vid-frame" ref={wrapRef}>
          <video
            ref={videoRef}
            className="vid"
            muted
            loop
            playsInline
            preload="none"
            poster={video.poster}
            disablePictureInPicture
            aria-label="Vídeo institucional da Viver de Obra, com legendas"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onVolumeChange={(e) => setSound(!e.currentTarget.muted && e.currentTarget.volume > 0)}
          >
            {near && video.sources.map((s) => <source key={s.src} src={s.src} type={s.type} media={s.media} />)}
          </video>

          {!playing && (
            <button type="button" className="vid-big" onClick={toggle} aria-label="Reproduzir vídeo">
              <span aria-hidden="true" className="vid-big-icon" />
            </button>
          )}

          <div className="vid-bar">
            <button type="button" className="vid-btn" onClick={toggle} aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}>
              <span aria-hidden="true" className={playing ? "ic-pause" : "ic-play"} />
            </button>
            <div
              className="vid-track"
              ref={trackRef}
              role="slider"
              tabIndex={0}
              aria-label="Progresso do vídeo"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${pct}%`}
              onPointerDown={seekFromPointer}
              onKeyDown={onKey}
            >
              <div className="vid-fill" ref={barRef} />
            </div>
            <button
              type="button"
              className="vid-btn"
              onClick={toggleSound}
              aria-pressed={sound}
              aria-label={sound ? "Desativar o som" : "Ativar o som"}
            >
              <span aria-hidden="true" className={sound ? "ic-sound" : "ic-mute"} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
