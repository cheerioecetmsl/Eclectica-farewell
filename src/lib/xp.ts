export function calculateLevel(xp: number) {
  let level = 1;
  let requiredXP = 100;
  let currentLevelBaseXP = 0;
  
  while (xp >= currentLevelBaseXP + requiredXP) {
    currentLevelBaseXP += requiredXP;
    level++;
    requiredXP *= 2;
  }
  
  const nextLevelXP = currentLevelBaseXP + requiredXP;
  const progress = ((xp - currentLevelBaseXP) / requiredXP) * 100;
  
  return { level, nextLevelXP, currentLevelBaseXP, progress };
}

export function formatXP(xp: number): string {
  if (xp >= 1000) {
    return (xp / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'k';
  }
  return xp.toLocaleString();
}
