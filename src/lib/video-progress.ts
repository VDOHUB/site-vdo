/**
 * Progresso "percebido" do vídeo: corre rápido no começo e desacelera perto do fim
 * (ease-out cúbico). Vale 0 em 0 e exatamente 1 em 1.
 */
export function displayProgress(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

/** Inverso de displayProgress: de uma posição na barra para a fração real do vídeo. */
export function realProgress(d: number): number {
  const c = Math.min(1, Math.max(0, d));
  return 1 - Math.pow(1 - c, 1 / 3);
}
