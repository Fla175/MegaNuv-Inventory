# Phase 4 Plan: Correções UI, Versão Dinâmica e Deleção em Cascata

**Phase:** 4
**Status:** Planned
**Wave:** 1

---

## Frontmatter

```yaml
wave: 1
depends_on: []
requirements_addressed: []
files_modified:
  - components/ListSection.tsx
  - components/Layout.tsx
  - lib/version.ts
  - pages/api/father-spaces/delete.ts
autonomous: true
```

---

## Tasks

### TASK-001 — Re-adicionar empty-state na renderização do espaço pai

<read_first>
- `components/ListSection.tsx`
</read_first>

<action>
In `components/ListSection.tsx`, around line 556, inside the space card rendering:

Current (line 555-557):
```tsx
<div onContextMenu={(e) => handleContextMenu(e, space, true)} className="bg-white dark:bg-zinc-900/50">
  {renderActiveTree(null, space.id)}
</div>
```

Replace with:
```tsx
<div onContextMenu={(e) => handleContextMenu(e, space, true)} className="bg-white dark:bg-zinc-900/50">
  {hasActives ? renderActiveTree(null, space.id) : (
    <div className="flex flex-col items-center justify-center py-8 px-6 opacity-40">
      <Ghost size={24} className="mb-2 text-zinc-400" />
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
        Nenhum ativo neste local
      </p>
    </div>
  )}
</div>
```
</action>

<acceptance_criteria>
- `components/ListSection.tsx` contains Ghost import
- Space card renders empty-state when `hasActives === false`
- `hasActives` variable is defined in the `filteredData.spaces.map` callback (it is — line 543)
</acceptance_criteria>

---

### TASK-002 — Versão dinâmica do projeto

<read_first>
- `components/Layout.tsx`
- `lib/version.ts`
- `package.json`
</read_first>

<action>
In `lib/version.ts`, replace hardcoded version with dynamic read from `package.json`:

```typescript
// lib/version.ts
import fs from "fs";
import path from "path";

interface PackageJson {
  version?: string;
}

function getPackageVersion(): string {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    return packageJson.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

export const VERSION = getPackageVersion();
export const BUILD_DATE = new Date().toISOString().split("T")[0];
```

In `components/Layout.tsx`, the import and usage should work as-is since `VERSION` is still exported from `lib/version.ts`. No changes needed in `Layout.tsx` itself.

</action>

<acceptance_criteria>
- `lib/version.ts` reads version from `package.json` using `fs.readFileSync`
- `lib/version.ts` exports `VERSION` and `BUILD_DATE` as before
- `components/Layout.tsx` line 31: `const projectVersion = VERSION;` works unchanged
- `package.json` is readable at `process.cwd() + "/package.json"`
</acceptance_criteria>

---

### TASK-003 — Deleção em cascata de espaço pai (OBRIGATÓRIO)

<read_first>
- `pages/api/father-spaces/delete.ts`
- `lib/prisma.ts` (Prisma client)
</read_first>

<action>
In `pages/api/father-spaces/delete.ts`, after verifying the space exists (line 29), before deleting the space (line 31):

Insert cascade delete for all actives belonging to this fatherSpace:

```typescript
// Delete all actives that belong to this father space
await db.active.deleteMany({
  where: { fatherSpaceId: id }
});

// Also delete all physical spaces that belong to this father space (they cascade via Prisma or we delete manually)
await db.active.deleteMany({
  where: {
    isPhysicalSpace: true,
    fatherSpaceId: id,
  }
});
```

Then proceed with the existing `await db.fatherSpace.delete({ where: { id } });`

The confirmation dialog already exists in the UI, so the user confirms = cascade delete is appropriate.

</action>

<acceptance_criteria>
- `pages/api/father-spaces/delete.ts` calls `db.active.deleteMany` with `fatherSpaceId: id` before deleting the fatherSpace
- DELETE request to `/api/father-spaces/delete?id=<id>` succeeds even when assets exist in that space
- Space and all its assets are removed from database
- Log message is created for deletion
</acceptance_criteria>

---

## Verification

1. **Empty-state**: Open index page with a space that has no assets — card shows "Nenhum ativo neste local"
2. **Dynamic version**: Update `package.json` version — `Layout.tsx` reflects new version after restart
3. **Cascade delete**: Create space with assets, delete space via API — space and assets are removed

---

*Planned: 2026-04-24*