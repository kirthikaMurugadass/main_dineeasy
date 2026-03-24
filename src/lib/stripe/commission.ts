export const COMMISSION_PERCENT = (() => {
  const raw = process.env.DINEEASY_COMMISSION_PERCENT;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return 10;
})();

export function calcCommissionPaise(totalPaise: number) {
  if (!Number.isFinite(totalPaise) || totalPaise <= 0) return 0;
  if (!Number.isFinite(COMMISSION_PERCENT) || COMMISSION_PERCENT <= 0) return 0;
  return Math.round(totalPaise * (COMMISSION_PERCENT / 100));
}

