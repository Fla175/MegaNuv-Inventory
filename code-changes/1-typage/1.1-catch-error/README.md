# 1.1 catch(error) Typing

## Summary
Fixed 19 API files with proper `catch(error: unknown)` typing and message narrowing.

## Files Modified

| File | Change |
|------|--------|
| `pages/api/dashboard/stats.ts` | catch error typing + message narrowing |
| `pages/api/categories/list.ts` | catch error typing |
| `pages/api/categories/create.ts` | catch error typing + removed eslint-disable |
| `pages/api/categories/update.ts` | catch error typing + removed eslint-disable |
| `pages/api/categories/delete.ts` | catch error typing |
| `pages/api/actives/list.ts` | catch error typing |
| `pages/api/actives/move.ts` | catch error typing |
| `pages/api/father-spaces/list.ts` | catch error typing |
| `pages/api/auth/login.ts` | catch error typing |
| `pages/api/auth/signup.ts` | catch error typing |
| `pages/api/auth/seed.ts` | catch error typing |
| `pages/api/logs/list.ts` | catch error typing |
| `pages/api/logs/clear.ts` | catch error typing |
| `pages/api/qrcode/public-get.ts` | catch error typing |
| `pages/api/storage/upload-url.ts` | catch error typing |
| `pages/api/users/index.ts` | catch error typing (2 occurrences) |
| `pages/api/users/update-theme.ts` | catch error typing |
| `pages/api/public/initial-check.ts` | catch error typing |
| `pages/api/internal/ensure-location-item.ts` | catch error typing |

## Pattern Applied

```typescript
} catch (error: unknown) {
  console.error("API_NAME_ERROR:", error);
  const message = error instanceof Error ? error.message : 'Default message';
  return res.status(500).json({ error: message });
}
```

---

**Date:** 2026-04-24
**Status:** ✅ Done