import { GameProgress } from '@/types';
import { ACHIEVEMENTS } from '@/config';
import { processTimeAttackScores } from '@/utils';

export const generateProfileSnapshot = async (
  progress: GameProgress,
  unlockedAchievements: typeof ACHIEVEMENTS
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 1400;
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FLOW MASTER', width / 2, 80);
  
  ctx.fillStyle = '#ffffff80';
  ctx.font = '24px Arial';
  ctx.fillText('Player Stats', width / 2, 120);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  let y = 180;

  // Stats grid
  const stats = [
    { label: 'Flows', value: progress.flows || 0, icon: '💰' },
    { label: 'Daily Streak', value: `${progress.dailyStreak || 0} days`, icon: '🔥' },
    { label: 'Perfect Clears', value: progress.perfectClears || 0, icon: '⭐' },
    { label: 'Campaign Levels', value: progress.campaignLevelsCompleted || 0, icon: '🎯' },
    { label: 'Time Played', value: formatTime(progress.totalTimePlayed || 0), icon: '⏱️' },
  ];

  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  stats.forEach((stat, idx) => {
    const x = (idx % 2) * (width / 2) + 60;
    const statY = y + Math.floor(idx / 2) * 100;
    
    ctx.fillStyle = '#ffffff60';
    ctx.font = '16px Arial';
    ctx.fillText(stat.label, x, statY);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${stat.icon} ${stat.value}`, x, statY + 40);
  });

  y += 360;
  
  // Time Attack Stats section
  const timeAttackEntries = processTimeAttackScores(progress.timeAttackHighScores || {});
  if (timeAttackEntries.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time Attack Stats', width / 2, y);
    
    y += 40;
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    timeAttackEntries.slice(0, 3).forEach((entry) => {
      if (y > height - 100) return;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`${entry.gridSize}x${entry.gridSize} • ${entry.timeLimit}s`, 60, y);
      
      ctx.fillStyle = '#ffffff80';
      ctx.font = '14px Arial';
      ctx.fillText(`Best: ${entry.score} puzzles`, 60, y + 22);
      
      y += 50;
    });
    
    y += 20;
  }

  // Achievements section
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Achievements (${unlockedAchievements.length}/${ACHIEVEMENTS.length})`, width / 2, y);

  y += 50;
  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  
  unlockedAchievements.slice(0, 8).forEach((achievement, idx) => {
    if (y > height - 100) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`✓ ${achievement.name}`, 60, y);
    
    ctx.fillStyle = '#ffffff80';
    ctx.font = '14px Arial';
    const desc = achievement.description.length > 50 
      ? achievement.description.substring(0, 47) + '...'
      : achievement.description;
    ctx.fillText(desc, 60, y + 25);
    
    y += 60;
  });

  // Footer
  ctx.fillStyle = '#ffffff40';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('flow-master.com', width / 2, height - 30);

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

