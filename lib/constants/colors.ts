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
