"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { getRankForXP } from "@/lib/ranks";

interface ProfileCardProps {
  username: string
  totalSolved: number
  bestStreak: number
  favoriteGridSize: string
  xp: number
  prestigeLevel: number
  themeColor?: string
}

function renderProfileCardToCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  props: ProfileCardProps,
): void {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) return;

  const w = 800;
  const h = 800;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(0.5, "#16213e");
  grad.addColorStop(1, "#0f3460");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const rank = getRankForXP(props.xp);

  ctx.font = "bold 36px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(props.username, 40, 60);

  ctx.font = "24px system-ui, sans-serif";
  ctx.fillStyle = rank.color;
  ctx.fillText(`${rank.icon} ${rank.name}`, 40, 100);

  if (props.prestigeLevel > 0) {
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.fillText(`Prestige ${props.prestigeLevel}`, 40, 130);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 160);
  ctx.lineTo(w - 40, 160);
  ctx.stroke();

  const stats = [
    { label: "Puzzles Solved", value: String(props.totalSolved) },
    { label: "Best Streak", value: `${props.bestStreak} days` },
    { label: "Favorite Size", value: props.favoriteGridSize },
    { label: "Total XP", value: String(props.xp) },
  ];

  const colWidth = (w - 80) / stats.length;
  stats.forEach((stat, i) => {
    const x = 40 + colWidth * i + colWidth / 2;

    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(stat.value, x, 220);

    ctx.font = "14px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(stat.label, x, 250);
  });

  ctx.font = "14px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.textAlign = "right";
  ctx.fillText("FlowMaster", w - 40, h - 30);

  ctx.strokeStyle = props.themeColor ?? rank.color;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);
}

export function ProfileCard(props: ProfileCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = useCallback(async () => {
    try {
      let canvas: HTMLCanvasElement | OffscreenCanvas;
      if (typeof OffscreenCanvas !== "undefined") {
        canvas = new OffscreenCanvas(800, 800);
      } else {
        canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 800;
      }

      renderProfileCardToCanvas(canvas, props);

      let blob: Blob;
      if (canvas instanceof OffscreenCanvas) {
        blob = await canvas.convertToBlob({ type: "image/png" });
      } else {
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
            "image/png",
          );
        });
      }

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "profile.png")] })) {
        await navigator.share({
          title: "My FlowMaster Profile",
          files: [new File([blob], "flow-master-profile.png", { type: "image/png" })],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "flow-master-profile.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Profile card downloaded!");
      }
    } catch {
      toast.error("Failed to export profile card");
    }
  }, [props]);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={(el) => {
          (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
          if (el) {
            el.width = 800;
            el.height = 800;
            renderProfileCardToCanvas(el, props);
          }
        }}
        className="w-full max-w-[400px] aspect-square rounded-lg border border-border"
      />
      <button
        onClick={handleExport}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
      >
        Export Profile Card
      </button>
    </div>
  );
}
