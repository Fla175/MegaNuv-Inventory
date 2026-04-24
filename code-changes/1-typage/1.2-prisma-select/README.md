# 1.2 Prisma Select Queries

## Summary
Verified Prisma queries already use `include` with `_count` - no changes needed.

## Verification
- `pages/api/categories/list.ts` already uses `include: { _count: { select: { actives: true } } }`
- All list APIs return necessary relations

---

**Date:** 2026-04-24
**Status:** ✅ Verified (no changes)