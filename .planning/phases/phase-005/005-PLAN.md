# Phase 5 Plan: Responsividade Settings — PLAN.md

**Phase:** 5
**Status:** Planned
**Wave:** 1

---

## Frontmatter

```yaml
wave: 1
depends_on: []
requirements_addressed: [RSP-01, RSP-02, RSP-03, RSP-04]
files_modified:
  - pages/settings.tsx
  - components/Layout.tsx
autonomous: true
```

---

## Tasks

### TASK-001 — Reduzir botões de tabs para ícones em telas narrow

<read_first>
- `pages/settings.tsx` (lines 261-297: menu tabs)
</read_first>

<action>
In `pages/settings.tsx`, around lines 282-297 (sidebar tabs), apply responsive behavior:

1. Add CSS breakpoint classes to tabs container (line 282):
   - Change from `w-full lg:w-72` to `w-full lg:w-72 2xl:w-80`

2. For each tab button (lines 284-296), add icon-only mode for screens < 1024px:
   - Replace text label with icon-only: `<tab.icon size={20} />`
   - Hide text in screens below lg: `hidden lg:inline`
   - Keep full label visible at lg+ breakpoint

3. Add `flex-nowrap` to container and shrink text to minimum.

Current (simplified):
```tsx
<button className="... px-5 py-4 ...">
  <tab.icon size={18} /> {tab.label}
</button>
```

Replace with:
```tsx
<button className="... px-3 lg:px-5 py-3 lg:py-4 ...">
  <tab.icon size={18} className="shrink-0" />
  <span className="hidden lg:inline truncate text-xs">{tab.label}</span>
</button>
```
</action>

<acceptance_criteria>
- `pages/settings.tsx` contains responsive tab buttons with `hidden lg:inline` for text
- Tab icons visible at all screen sizes (lg breakpoint = 1024px)
- Tab text hidden below 1024px, visible above
</acceptance_criteria>

---

### TASK-002 — Reduzir layout geral em telas narrow (settings)

<read_first>
- `pages/settings.tsx` (main content area, cards, grid items)
</read_first>

<action>
Apply compact spacing for screens below lg (1024px):

1. **Main container** (line 271): Add responsive padding
   - Current: `pb-20` → Change to: `pb-20 lg:pb-20`

2. **Header section** (lines 272-278): Reduce spacing
   - Reduce `mb-10` to `mb-6 lg:mb-10`
   - Reduce `p-3` to `p-2 lg:p-3` on icon wrapper

3. **Content cards** (line 299): Smaller padding
   - Current: `p-8 md:p-12` → Change to: `p-4 md:p-6 lg:p-8`

4. **Grid layouts** for users/spaces/categories:
   - Users (line 354): `grid-cols-1 md:grid-cols-2` → Add `gap-3 lg:gap-4`
   - Spaces (line 396): Same adjustment
   - Categories (line 435): `sm:grid-cols-2 md:grid-cols-3` → Add responsive gaps

5. **User profile card** (line 304):
   - Reduce `p-8 md:p-12` → `p-4 md:p-6`
   - Reduce avatar `w-28 h-28` → `w-20 h-20 lg:w-28 lg:h-28`
   - Reduce icon size from 60 to 40 for mobile: `<UserCircle size={40} />` → make responsive with `size={24} lg:size={60}`

6. **Cards in lists** - reduce padding and font sizes:
   - User cards (line 356): `p-5` → `p-3 lg:p-5`
   - Space cards (line 398): `p-6` → `p-3 lg:p-6`, text `text-xl` → `text-base lg:text-xl`
   - Category cards (line 437): `p-6` → `p-3 lg:p-6`, reduce sizes proportionally
</action>

<acceptance_criteria>
- All main containers use responsive padding (`p-4 md:p-6 lg:p-8` pattern)
- Avatar and icons scale down on mobile
- Font sizes scale appropriately (smaller on mobile, larger on lg+)
- Gap between grid items reduces on mobile
</acceptance_criteria>

---

### TASK-003 — Simplificar footer do Layout em mobile (versão + logout)

<read_first>
- `components/Layout.tsx` (lines 128-155: footer fixed)
</read_first>

<action>
In `components/Layout.tsx`, lines 128-155:

1. Remove version display from footer in mobile (lines 150-153)
2. Keep only user name + logout button
3. Move version to a tooltip or data attribute on hover

Current footer structure:
```tsx
<div className="fixed bottom-4 left-4 z-40">
  <div className="bg-gray-800/95 px-3 py-2 rounded-xl border ...">
    <div className="flex items-center gap-2">
      <UserCircle size={18} ... />
      <span className="text-xs ...">{user?.name}</span>
      <button ... ><LogOut size={14}/></button>
    </div>
    <div className="flex items-center justify-between ...">
      <span>MegaNuv Inventory&trade;</span>
      <span>v{projectVersion}</span>  {/* <-- REMOVE THIS on mobile */}
    </div>
  </div>
</div>
```

Change to:
```tsx
<div className="fixed bottom-4 left-4 z-40">
  <div className="bg-gray-800/95 px-3 py-2 rounded-xl border ...">
    {/* Row 1: User info + Logout - always visible */}
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <UserCircle size={16} className="shrink-0 text-gray-400" />
        <span className="text-xs text-gray-200 font-medium truncate max-w-[80px]">{user?.name}</span>
      </div>
      <button onClick={...} className="shrink-0 p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition" title="Sair">
        <LogOut size={14}/>
      </button>
    </div>
    
    {/* Row 2: Brand + Version - hidden on mobile, shown on lg+ */}
    <div className="hidden lg:flex items-center justify-between text-blue-400 font-bold py-0.5">
      <span className="text-[13px]">MegaNuv Inventory&trade;</span>
      <span className="text-gray-500 text-[12px] pl-0.5">v{projectVersion}</span>
    </div>
    
    {/* Alternative: Version in tooltip on brand name hover (optional) */}
  </div>
</div>
```

Also reduce container width on mobile:
- Current: `w-72` → Change to: `w-auto min-w-[180px] lg:w-72`
</action>

<acceptance_criteria>
- Footer shows only user name + logout button on screens < 1024px
- Version hidden on mobile, visible on lg+ screens
- Brand name + version row uses `hidden lg:flex` class
- Container width adjusts: narrower on mobile, full width on desktop
</acceptance_criteria>

---

### TASK-004 — Ajustar grid de categorias para não estourar

<read_first>
- `pages/settings.tsx` (line 435: categories grid)
</read_first>

<action>
In `pages/settings.tsx`, line 435 - the categories grid:

Current:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
```

Change to:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-4">
```

This ensures:
- 2 columns on very small screens (below sm)
- 3 columns on sm (640px+)
- 4 columns on md (768px+)
- Back to 3 on lg (1024px+) - prevents overflow
- 4 on xl (1280px+)

Also reduce card content sizing in category cards:
- Icon container (line 438): `w-12 h-12` → `w-10 h-10 lg:w-12 lg:h-12`
- Icon size (line 439): `size={24}` → `size={18} lg:size={24}`
- Title (line 441): `text-sm` → `text-xs lg:text-sm`
- Button padding (lines 443-444): `p-2` is fine, keep
</action>

<acceptance_criteria>
- Categories grid has at least 2 columns on all screen sizes
- Grid adjusts columns based on screen width
- Category card icons and text scale appropriately
- No horizontal overflow on 23" Full HD at half width (~960px)
</acceptance_criteria>

---

## Verification

1. **Tabs**: Open settings at 960px width (half of 1920x1080) - tabs show only icons, no text
2. **Layout**: At same width, all content fits without horizontal scroll, cards are usable size
3. **Footer**: At 960px, footer shows only user name + logout, no version visible
4. **Categories**: Grid shows 2-3 columns, cards don't overflow or get squashed
5. **Build**: `yarn build` passes without errors

---

*Planned: 2026-04-27*