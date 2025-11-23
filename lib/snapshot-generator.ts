import { getCellPosition } from '@/utils/grid-utils';

export const generateBoardSnapshot = async (
  levelData: { width: number; height: number; anchors: Record<number, { colorId: number }> },
  userPaths: Record<number, number[]>,
  palette: { hex: string }[],
  themeLabel: string
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const size = 800;
  const padding = 60;
  const gridSize = size - padding * 2;
  canvas.width = size;
  canvas.height = size + 120;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size + 120);

  const cellSize = gridSize / Math.max(levelData.width, levelData.height);
  const offsetX = (size - levelData.width * cellSize) / 2;
  const offsetY = (size - levelData.height * cellSize) / 2 + 40;

  Object.entries(userPaths).forEach(([colorId, path]) => {
    if (path.length < 2) return;
    const color = palette[parseInt(colorId) % palette.length]?.hex || '#ffffff';
    
    ctx.strokeStyle = color;
    ctx.lineWidth = cellSize * 0.15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    path.forEach((idx, i) => {
      const { row, col } = getCellPosition(idx, levelData.width);
      const x = offsetX + col * cellSize + cellSize / 2;
      const y = offsetY + row * cellSize + cellSize / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  });

  for (let i = 0; i < levelData.width * levelData.height; i++) {
    const { row, col } = getCellPosition(i, levelData.width);
    const x = offsetX + col * cellSize;
    const y = offsetY + row * cellSize;

    let pathColor: string | null = null;
    for (const [cId, path] of Object.entries(userPaths)) {
      if (path.includes(i)) {
        pathColor = palette[parseInt(cId) % palette.length]?.hex || null;
        break;
      }
    }

    if (pathColor) {
      ctx.fillStyle = pathColor + '40';
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    const anchor = levelData.anchors[i];
    if (anchor) {
      const anchorColor = palette[anchor.colorId % palette.length]?.hex || '#ffffff';
      const centerX = x + cellSize / 2;
      const centerY = y + cellSize / 2;
      const radius = cellSize * 0.25;

      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
      glowGradient.addColorStop(0, anchorColor + '80');
      glowGradient.addColorStop(1, anchorColor + '00');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(centerX - radius * 2, centerY - radius * 2, radius * 4, radius * 4);

      ctx.fillStyle = anchorColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.strokeStyle = '#ffffff10';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellSize, cellSize);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FLOW MASTER', size / 2, size + 50);
  
  ctx.fillStyle = '#ffffff80';
  ctx.font = '20px Arial';
  ctx.fillText(`${themeLabel} • ${levelData.width}x${levelData.height} Grid`, size / 2, size + 85);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      } else {
        reject(new Error('Failed to generate image'));
      }
    }, 'image/png');
  });
};

export const downloadSnapshot = (blobUrl: string, filename: string = 'flow-master-snapshot.png') => {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};

export const shareSnapshot = async (blobUrl: string): Promise<'shared' | 'copied' | 'downloaded'> => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const file = new File([blob], 'flow-master-snapshot.png', { type: 'image/png' });

    // Try Web Share API first (works on mobile and some desktop browsers)
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Flow Master - Perfect Clear!',
        text: 'Check out my perfect solve!',
        files: [file],
      });
      return 'shared';
    }

    // Fallback: Try to copy image to clipboard (works on modern browsers)
    if (navigator.clipboard && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        return 'copied';
      } catch (clipboardError) {
        // Clipboard API might not support images, fall through to download
      }
    }

    // Final fallback: download the image
    downloadSnapshot(blobUrl);
    return 'downloaded';
  } catch (error) {
    console.error('Error sharing:', error);
    // If share fails, try to download as fallback
    downloadSnapshot(blobUrl);
    return 'downloaded';
  }
};

