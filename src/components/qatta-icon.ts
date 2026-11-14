import { Beef, Flame, Utensils, Wallet, type LucideIcon } from 'lucide-react-native';

import type { ContributionIcon } from '@/data/types';

export const QATTA_ICON: Record<ContributionIcon, LucideIcon> = {
  dinner: Utensils,
  fire: Flame,
  bbq: Beef,
  other: Wallet,
};

/** نخمن الأيقونة من عنوان القطة. */
export function guessQattaIcon(title: string): ContributionIcon {
  if (/عشا|غدا|فطور|أكل|اكل/.test(title)) return 'dinner';
  if (/حطب|فحم|نار/.test(title)) return 'fire';
  if (/ذبيح|لحم|شوي/.test(title)) return 'bbq';
  return 'other';
}
