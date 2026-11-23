import { describe, expect, it } from "vitest";
import { displayProgress, realProgress } from "./video-progress";

describe("video-progress", () => {
  it("começa em 0 e termina exatamente em 1", () => {
    expect(displayProgress(0)).toBe(0);
    expect(displayProgress(1)).toBe(1);
  });
  it("é crescente e adianta no começo (ease-out)", () => {
    expect(displayProgress(0.1)).toBeGreaterThan(0.1);
    expect(displayProgress(0.5)).toBeCloseTo(0.875, 5);
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const v = displayProgress(i / 100);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
  it("desacelera: o último décimo avança menos que o primeiro", () => {
    expect(displayProgress(1) - displayProgress(0.9)).toBeLessThan(displayProgress(0.1) - displayProgress(0));
  });
  it("realProgress é o inverso", () => {
    for (const t of [0, 0.05, 0.3, 0.77, 1]) expect(realProgress(displayProgress(t))).toBeCloseTo(t, 9);
  });
  it("limita fora de 0..1", () => {
    expect(displayProgress(-1)).toBe(0);
    expect(displayProgress(2)).toBe(1);
    expect(realProgress(5)).toBe(1);
  });
});
