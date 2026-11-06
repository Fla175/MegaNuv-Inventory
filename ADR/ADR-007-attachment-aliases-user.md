# ADR-007: Friendly Document Aliases with User-Specific Access Control

| Campo        | Valor                         |
| ------------ | ----------------------------- |
| **Status**   | proposed                      |
| **Data**     | 05/11/2026                    |
| **Deciders** | Fla175 & MegaNuv              |
| **Origem**   | requirement following ADR-006 |

## Context

ADR-006 implemented the `Attachment` model to store friendly aliases for document attachments. However, the implementation lacked:

- User-facing alias input when uploading new documents
- Rename functionality for existing attachments
- Role-based access control for the alias management features

Users need aliases for better identification in the UI, but only authorized roles should be able to manage these aliases.

**Constraints:**

- Must maintain full backward compatibility with existing `fileUrl` format
- Must work with the existing `parseFileUrls()` function
- Role-based access: only MANAGER, ADMIN, and DIRECTOR can rename attachments
- Regular users can view aliases but not modify them
- Must not break existing upload flow

## Decision: Implement front-end alias management with role-based access

### Why this approach:

- ✅ **Complements ADR-006** - Builds on the `Attachment` model without modifying it
- ✅ **Role-based access** - Follows the existing RBAC pattern in the codebase
- ✅ **Incremental adoption** - Can be rolled out; old assets without aliases still function
- ✅ **User-friendly** - Prompt for alias when uploading; rename existing via UI
- ✅ **Non-breaking** - Existing `fileUrl` format completely unchanged

### Implementation Plan:

#### A. API Routes (role-guarded)

1. **POST /api/actives/[activeId]/attachments**

   - Creates a new attachment with alias for an active
   - Body: `{ "alias": "Document title", "fileUrl": "https://minio/inventory/..." }`
   - **Access**: MANAGER, ADMIN, DIRECTOR only (via auth middleware)

2. **PATCH /api/attachments/[attachmentId]**

   - Updates the alias of an existing attachment
   - Body: `{ "alias": "New document title" }`
   - **Access**: MANAGER, ADMIN, DIRECTOR only

3. **GET /api/actives/[activeId]/attachments**
   - Lists all attachments with aliases for an active
   - Also includes the active's existing `fileUrl` for backward compatibility
   - **Access**: All authenticated users (view-only for VIEWER/other roles)

#### B. TypeScript Types (`types/inventory.ts`)

Extend the `Active` interface and add `Attachment` interaction types:

```typescript
export interface Attachment {
  id: string;
  alias: string;
  fileUrl: string;
  activeId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ActiveWithAttachmentInfo {
  id: string;
  name: string;
  // ... existing Active fields
  fileUrl?: string | null;
  attachments?: Attachment[];
}
```

#### C. UI Updates (`components/FileUpload.tsx`)

- When uploading new documents via the `FileUpload` component, show an input field for the alias/name
- The alias is sent to the API alongside the file URL
- Display the alias as the link text alongside the URL

#### D. UI Updates (`components/list/ItemDetailModal.tsx`)

- When rendering the "Documentos & Anexos" section, display each attachment with its alias
- Show a rename button (SquarePen icon) for attachments when the user has proper role
- The rename modal/api follows the same pattern as ADR-006

#### E. Role-Based Access Control

- **VIEWER**: Can view attachments with aliases, cannot rename
- **MANAGER, ADMIN, DIRECTOR**: Can view and rename attachments
- Access control implemented via the `authMiddleware` in API routes

#### F. Backward Compatibility

- **Existing `active.fileUrl`** continues to work exactly as before
- The `parseFileUrls()` function is unchanged
- Old assets without aliases in the new `Attachment` table still display their documents using the existing `fileUrl` format
- No data migration required

#### G. Data Migration (optional, future)

If the team later wants to migrate existing `fileUrl` entries into the new `Attachment` table with aliases, this can be done as a separate script since the database structure is already stable.

## Coordination with Existing Changes

This ADR complements the following recent changes:

- **ADR-006**: Created `Attachment` model (separate table for aliases)
- **ADR-001**: Column-level permission for `fixedValue` visibility
- **Auth middleware**: Existing RBAC patterns used for access control

All these changes maintain the principle of incremental, non-breaking improvements to the MinIO integration.

## Status Transition

Move from "Proposed" to "Accepted" when the team agrees on the approach. Implementation can then proceed with the API route creation, type updates, and UI modifications.
