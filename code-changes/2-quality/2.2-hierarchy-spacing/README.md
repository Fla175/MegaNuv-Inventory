# 2.2 Hierarchy Spacing

## Summary
Changed hierarchy spacing from `ml-${level * 4}` to `ml-${level * 6}` for better visual hierarchy.

## Files Modified

| File | Change |
|------|--------|
| `components/ListSection.tsx` | Changed ml multiplier from 4 to 6 |

## Change Applied
- Line 300: `ml-${level * 4}` → `ml-${level * 6}`
- Line 316: `ml-${level * 4}` → `ml-${level * 6}`

```typescript
const indentClass = level > 0 ? `ml-${level * 6} border-l-2 dark:border-white/5` : "";
```

---

**Date:** 2026-04-24
**Status:** ✅ Done