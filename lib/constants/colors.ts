// lib/constants/colors.ts

export const TYPE_COLORS = {
  ACTIVE: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    bgDark: 'bg-amber-500',
    border: 'border-amber-500/30',
    DEFAULT: '#F59E0B',
  },
  PHYSICAL_SPACE: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    bgDark: 'bg-emerald-500',
    border: 'border-emerald-500/30',
    DEFAULT: '#10B981',
  },
  PARENT_SPACE: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    bgDark: 'bg-blue-500',
    border: 'border-blue-500/30',
    DEFAULT: '#3B82F6',
  },
  EMPTY: {
    bg: 'bg-zinc-100 dark:bg-zinc-800/30',
    text: 'text-zinc-500 dark:text-zinc-400',
    bgDark: 'bg-zinc-400',
    border: 'border-zinc-300 dark:border-zinc-600',
    DEFAULT: '#71717A',
  },
};

export function getActiveColors(hasContent: boolean = true) {
  return hasContent ? TYPE_COLORS.ACTIVE : TYPE_COLORS.EMPTY;
}

export function getPhysicalSpaceColors(hasContent: boolean = true) {
  return hasContent ? TYPE_COLORS.PHYSICAL_SPACE : TYPE_COLORS.EMPTY;
}

export function getParentSpaceColors(hasContent: boolean = true) {
  return hasContent ? TYPE_COLORS.PARENT_SPACE : TYPE_COLORS.EMPTY;
}

export function getItemColors(isPhysicalSpace: boolean, hasSubItems: boolean) {
  if (isPhysicalSpace) {
    return hasSubItems ? TYPE_COLORS.PHYSICAL_SPACE : TYPE_COLORS.EMPTY;
  }
  return TYPE_COLORS.ACTIVE;
}

export const CATEGORY_PALETTE = [
  '#FFD700', '#FF8C00', '#2ECC71', '#A2D149', '#007BFF', '#004085', 
  '#98A6B0', '#8E44AD', '#17A2B8', '#40E0D0', '#2980B9', '#6F42C1', 
  '#E74C3C', '#800020', '#2C3E50', '#A0522D', '#7AA9BD', '#D81B60',
];

export function getCategoryColor(categoryId: string, categories: { id: string }[]) {
  const index = categories.findIndex(c => c.id === categoryId);
  if (index === -1) return '#94a3b8';
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

export function getNextCategoryColor(usedColors: string[]): string {
  for (let i = 0; i < CATEGORY_PALETTE.length; i++) {
    if (!usedColors.includes(CATEGORY_PALETTE[i])) {
      return CATEGORY_PALETTE[i];
    }
  }
  return CATEGORY_PALETTE[0];
}
