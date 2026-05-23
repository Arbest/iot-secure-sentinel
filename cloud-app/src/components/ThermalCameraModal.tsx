"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Flame, Maximize2, Compass, Layers, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThermalCameraModalProps {
  deviceName: string;
  matrix: number[] | null;
  timestamp: string | null;
  onClose: () => void;
}

function getThermalColor(value: number, min: number, max: number, palette: string) {
  const range = Math.max(max - min, 0.1);
  const pct = Math.min(Math.max((value - min) / range, 0), 1);

  if (palette === "ironbow") {
    let r = 0, g = 0, b = 0;
    if (pct < 0.2) {
      const t = pct / 0.2;
      r = Math.round(10 + t * 40);
      g = Math.round(10 + t * 10);
      b = Math.round(40 + t * 100);
    } else if (pct < 0.45) {
      const t = (pct - 0.2) / 0.25;
      r = Math.round(50 + t * 120);
      g = Math.round(20 + t * 20);
      b = Math.round(140 - t * 40);
    } else if (pct < 0.7) {
      const t = (pct - 0.45) / 0.25;
      r = Math.round(170 + t * 85);
      g = Math.round(40 + t * 70);
      b = Math.round(100 - t * 80);
    } else if (pct < 0.9) {
      const t = (pct - 0.7) / 0.2;
      r = 255;
      g = Math.round(110 + t * 110);
      b = Math.round(20 - t * 10);
    } else {
      const t = (pct - 0.9) / 0.1;
      r = 255;
      g = Math.round(220 + t * 35);
      b = Math.round(10 + t * 245);
    }
    return `rgb(${r}, ${g}, ${b})`;
  } else if (palette === "rainbow") {
    const hue = 240 - pct * 240;
    return `hsl(${hue}, 100%, 50%)`;
  } else {
    // Hot metal / Classic
    let r = 0, g = 0, b = 0;
    if (pct < 0.33) {
      const t = pct / 0.33;
      r = Math.round(t * 200);
      g = 0;
      b = 0;
    } else if (pct < 0.66) {
      const t = (pct - 0.33) / 0.33;
      r = Math.round(200 + t * 55);
      g = Math.round(t * 180);
      b = 0;
    } else if (pct < 0.9) {
      const t = (pct - 0.66) / 0.24;
      r = 255;
      g = Math.round(180 + t * 75);
      b = Math.round(t * 100);
    } else {
      const t = (pct - 0.9) / 0.1;
      r = 255;
      g = 255;
      b = Math.round(100 + t * 155);
    }
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export function ThermalCameraModal({
  deviceName,
  matrix,
  timestamp,
  onClose,
}: ThermalCameraModalProps) {
  const [isSmoothed, setIsSmoothed] = useState<boolean>(true);
  const [showValues, setShowValues] = useState<boolean>(false);
  const [showExtremes, setShowExtremes] = useState<boolean>(true);
  const [palette, setPalette] = useState<string>("ironbow");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Compute metrics from matrix
  const stats = useMemo(() => {
    if (!matrix || matrix.length !== 64) {
      return { min: 0, max: 0, avg: 0, minIdx: -1, maxIdx: -1 };
    }

    let min = matrix[0];
    let max = matrix[0];
    let sum = 0;
    let minIdx = 0;
    let maxIdx = 0;

    for (let i = 0; i < 64; i++) {
      const val = matrix[i];
      sum += val;
      if (val < min) {
        min = val;
        minIdx = i;
      }
      if (val > max) {
        max = val;
        maxIdx = i;
      }
    }

    return {
      min,
      max,
      avg: sum / 64,
      minIdx,
      maxIdx,
    };
  }, [matrix]);

  if (!matrix || matrix.length !== 64) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground">Termokamera</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="py-6 text-center text-muted-foreground">
            Pro toto zařízení nejsou k dispozici žádná data termokamery.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side - Visual Grid */}
        <div className="flex-1 bg-neutral-950 p-6 flex flex-col items-center justify-center relative min-h-[320px] md:min-h-[480px]">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-400">LIVE</span>
          </div>

          <div className="relative w-full max-w-[360px] aspect-square rounded-xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900">
            {/* The heat source visual grid (can be blurred) */}
            <div
              className={cn(
                "grid grid-cols-8 grid-rows-8 w-full h-full transition-all duration-300 ease-out",
                isSmoothed ? "blur-[14px] scale-[1.04]" : "blur-0 scale-100"
              )}
            >
              {matrix.map((val, idx) => {
                const color = getThermalColor(val, stats.min, stats.max, palette);
                return (
                  <div
                    key={idx}
                    style={{ backgroundColor: color }}
                    className="w-full h-full transition-colors duration-150"
                  />
                );
              })}
            </div>

            {/* Sharp overlay for interactive elements and values */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 w-full h-full z-20 pointer-events-auto">
              {matrix.map((val, idx) => {
                const isMax = idx === stats.maxIdx;
                const isMin = idx === stats.minIdx;

                return (
                  <div
                    key={`overlay-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "w-full h-full flex items-center justify-center relative transition-all cursor-crosshair select-none border border-black/5 hover:border-white/20 hover:bg-white/5",
                      hoveredIndex === idx && "bg-white/10 ring-1 ring-white/30"
                    )}
                  >
                    {/* Extremes Indicators */}
                    {showExtremes && isMax && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <div className="relative h-6 w-6 flex items-center justify-center">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60 animate-ping" />
                          <span className="relative text-[10px] font-black text-black bg-white/95 rounded-full px-1 border border-red-500 shadow-md">
                            H
                          </span>
                        </div>
                      </div>
                    )}

                    {showExtremes && isMin && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <div className="relative h-6 w-6 flex items-center justify-center">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60 animate-ping" />
                          <span className="relative text-[10px] font-black text-white bg-blue-600 rounded-full px-1 border border-blue-400 shadow-md">
                            L
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Numeric Temperature Display */}
                    {showValues && !isMax && !isMin && (
                      <span className="text-[9px] font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none">
                        {val.toFixed(0)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid interactive readout */}
          <div className="mt-4 text-xs font-mono text-neutral-400 flex items-center justify-center min-h-[1.5rem] bg-neutral-900/50 px-3 py-1 rounded-md border border-neutral-800">
            {hoveredIndex !== null ? (
              <span className="text-white flex items-center gap-2">
                <span className="text-red-400">Teplota:</span>
                <span className="text-sm font-semibold">{matrix[hoveredIndex].toFixed(1)} °C</span>
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-400">Pixel:</span>
                <span>
                  [{Math.floor(hoveredIndex / 8) + 1}, {(hoveredIndex % 8) + 1}]
                </span>
              </span>
            ) : (
              <span className="text-neutral-500 flex items-center gap-1.5">
                <Maximize2 className="h-3 w-3" />
                Najeďte myší na mřížku pro detailní odečet
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Dashboard Controls & Stats */}
        <div className="w-full md:w-[380px] bg-card p-6 border-t md:border-t-0 md:border-l border-border flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500" />
                  Termokamera
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{deviceName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Timestamp */}
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <span>Snímek pořízen:</span>
              <span className="font-mono text-foreground">
                {timestamp ? new Date(timestamp).toLocaleTimeString() : "Neznámý čas"}
              </span>
            </div>

            <hr className="my-4 border-border" />

            {/* Statistics */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Compass className="h-3.5 w-3.5" />
                Statistika snímku
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-secondary/40 p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">Maximum</div>
                  <div className="text-lg font-bold text-red-500 tabular-nums">
                    {stats.max.toFixed(1)} °C
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground">
                    Pixel [{Math.floor(stats.maxIdx / 8) + 1}, {(stats.maxIdx % 8) + 1}]
                  </div>
                </div>

                <div className="bg-secondary/40 p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">Minimum</div>
                  <div className="text-lg font-bold text-blue-500 tabular-nums">
                    {stats.min.toFixed(1)} °C
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground">
                    Pixel [{Math.floor(stats.minIdx / 8) + 1}, {(stats.minIdx % 8) + 1}]
                  </div>
                </div>

                <div className="bg-secondary/40 p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">Průměr</div>
                  <div className="text-lg font-bold text-foreground tabular-nums">
                    {stats.avg.toFixed(1)} °C
                  </div>
                </div>

                <div className="bg-secondary/40 p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">Rozdíl (Δ)</div>
                  <div className="text-lg font-bold text-orange-500 tabular-nums">
                    {(stats.max - stats.min).toFixed(1)} °C
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-4 border-border" />

            {/* Display Controls */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                Nastavení zobrazení
              </h4>

              {/* Palette Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Barevná paleta
                </label>
                <div className="grid grid-cols-3 gap-1 bg-secondary/30 p-0.5 rounded-lg border border-border">
                  {[
                    { id: "ironbow", name: "Ironbow" },
                    { id: "rainbow", name: "Rainbow" },
                    { id: "classic", name: "Classic" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      className={cn(
                        "text-[11px] py-1 px-1.5 rounded-md font-medium transition-all",
                        palette === p.id
                          ? "bg-card text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                {/* Smoothing Toggle */}
                <label className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/50 cursor-pointer transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Vyhlazení obrazu</span>
                    <span className="text-[10px] text-muted-foreground">Interpolace tepelné mapy</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSmoothed}
                    onChange={(e) => setIsSmoothed(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                </label>

                {/* Values Overlay Toggle */}
                <label className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/50 cursor-pointer transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Zobrazit teploty</span>
                    <span className="text-[10px] text-muted-foreground">Číselné hodnoty v mřížce</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showValues}
                    onChange={(e) => setShowValues(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                </label>

                {/* Extremes Highlight Toggle */}
                <label className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/50 cursor-pointer transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Zobrazit extrémy</span>
                    <span className="text-[10px] text-muted-foreground">Zvýraznit min / max bod</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showExtremes}
                    onChange={(e) => setShowExtremes(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Close Button */}
          <div className="mt-6">
            <Button className="w-full" variant="outline" onClick={onClose}>
              Zavřít termokameru
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
