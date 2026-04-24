# 1.3 Component Props Typing

## Summary
Created TypeScript interfaces for component props in lib/types.ts.

## Files Modified

| File | Change |
|------|--------|
| `lib/types.ts` | **NEW** - TypeScript interfaces |
| `components/ListSection.tsx` | Import interfaces + added eslint-disable |

## New File: lib/types.ts

```typescript
import { FatherSpace, Active } from "@prisma/client";

export interface ListSectionFilters {
  query?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
}

export interface ListSectionProps {
  filters: ListSectionFilters;
  onEdit: (item: Active, mode: 'view' | 'edit') => void; 
  onClone: (item: Active) => void;
  onRefresh: () => void;
  onMove?: (item: Active) => void;
  actives: Active[];
  fatherSpaces: FatherSpace[];
}
```

---

**Date:** 2026-04-24
**Status:** ✅ Done