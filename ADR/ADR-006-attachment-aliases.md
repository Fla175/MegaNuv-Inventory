# ADR-006: Friendly Document Aliases for Assets

| Campo        | Valor                            |
| ------------ | -------------------------------- |
| **Status**   | proposed                         |
| **Data**     | 05/11/2026                       |
| **Deciders** | Fla175 & MegaNuv                 |
| **Origem**   | funcionalidade pedida por Fla175 |

## Context

The application stores document attachments in `Active.fileUrl` as a TEXT column supporting two legacy formats (JSON array or CSV of MinIO URLs). Users need these documents to have friendly/"alias" names for better identification in the UI, without breaking the existing database schema.

**Constraints:**

- Cannot add a new column to the `Active` table (would require Prisma migration, data cleanup, and risks breaking the production DB)
- Must maintain full backward compatibility with existing `fileUrl` format
- Must work with the existing `parseFileUrls()` function that handles JSON/CSV formats
- MinIO is external at `178.95.47.68:9000`

## Decision: Create a new `Attachment` model (separate table)

### Why this approach:

- ✅ **Zero risk to existing DB** - No alterations to the `Active` table
- ✅ **No Prisma migration needed** - The existing schema remains unchanged
- ✅ **Backward compatible** - All existing code using `active.fileUrl` continues to work unchanged
- ✅ **Supports multiple aliases per active** - An asset can have many documents, each with its own alias
- ✅ **Incremental adoption** - Can be rolled out gradually; old assets without aliases continue to function

### Implementation Plan:

#### A. Prisma Schema (`prisma/schema.prisma`)

Add new model after the `Active` model:

```prisma
model Attachment {
  id          String    @id @default(uuid())
  alias       String    // Friendly name shown to user
  fileUrl     String    @db.Text  // MinIO URL (same format as Active.fileUrl)
  activeId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  active      Active    @relation(fields: [activeId], references: [id], onDelete: Cascade)
}
```

#### B. Prisma Client Generation

Run `npx prisma generate` to update the TypeScript types. No migration script needed since we're adding a new table, not modifying existing ones.

#### C. API Routes (new endpoints)

1. **POST /api/actives/:activeId/attachments**

   - Creates a new attachment with alias for an active
   - Body: `{ "alias": "Document title", "fileUrl": "https://minio/..." }`
   - Returns the created attachment

2. **GET /api/actives/:activeId/attachments**

   - Lists all attachments with aliases for an active
   - Also includes the active's existing `fileUrl` for backward compatibility

3. **PATCH /api/attachments/:attachmentId**

   - Updates the alias of an existing attachment

4. **DELETE /api/attachments/:attachmentId**
   - Deletes an attachment from the database and MinIO

#### D. TypeScript Types (`types/inventory.ts`)

Extend the `Active` interface to include attachments:

```typescript
export interface ActiveWithAttachments {
  id: string;
  name: string;
  // ... existing Active fields
  imageUrl?: string | null;
  fileUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  attachments?: Attachment[]; // NEW: list of attachments with aliases
}
```

#### E. UI Updates (`components/list/ItemDetailModal.tsx`, `SpaceDetailModal.tsx`)

- When rendering the "Documentos & Anexos" section, query attachments alongside the active
- Display each attachment with its alias as a tooltip or alongside the URL
- When opening the file link, show the alias as the link text

#### F. Backward Compatibility

- **Existing `active.fileUrl`** continues to work exactly as before
- The `parseFileUrls()` function in `lib/mediaReferences.ts` is unchanged
- Old assets without aliases in the new `Attachment` table still display their documents using the existing `fileUrl` format
- No data migration required

#### G. Data Migration (optional, future)

If the team later wants to migrate existing `fileUrl` entries into the new `Attachment` table with aliases, this can be done as a separate script since the database structure is already stable.

## Coordination with Existing Changes

This ADR complements the following recent changes:

- **ADR-006**: Auditor MinIO policy (separate credentials)
- **Fix**: Added `s3:HeadObject` to `inventory-policy.json` for `statObject` support
- **Fix**: Added `/api/storage/file` to `PUBLIC_PATHS` for modal image rendering

All these changes maintain the principle of incremental, non-breaking improvements to the MinIO integration.

## Status Transition

Move from "Proposed" to "Accepted" when the team agrees on the approach. Implementation can then proceed with the Prisma schema update, API route creation, and UI updates.
