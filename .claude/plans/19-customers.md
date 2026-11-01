# Plan: #19 Customers: list, add with documents, details (ST-08.1 to ST-08.3)

## Decided (Dulan, 1 Nov 2026; Proposed in system design 3.2, 6)
- "Customer access" is its own permission, staff and admin by default.
- Copies: NIC front and back, licence front and back; a photo (JPEG, PNG, WebP, HEIC) or PDF up to 10 MB, kept as taken.
- Whether a reference person is needed is decided per rental (Phase 2).

## Approach
- `customer` (NIC unique), `customer_document` (insert-only; newest per kind counts), `document_access` (insert-only). Migration 0015 also gives existing staff and admins the new permission.
- `src/storage/`: R2 through its S3 API (aws4fetch) with settings; otherwise, outside production, a private folder; production refuses. File type read from the file's own bytes.
- `src/modules/customers`: `addCustomer` (AT-51: an existing NIC returns that customer), `addCopy`, `correctCustomer` (never the NIC; only changed fields; stale check; old/new logged), `listCustomers` (expired licence first), `getCustomer`, `openCopy` (AT-59).
- Pages `/customers`, `/customers/new`, `/customers/[id]`, `/customers/[id]/edit`; route `/customers/[id]/copies/[docId]`.

## Tests
AT-49 (partial: the handover half is Phase 2), AT-51, AT-59; `tests/customers.test.ts`; `tests/e2e/customers.spec.ts`.

## Out of scope
Flags and warnings (#24); debts and rentals on the details page (Phase 2); the 7-year deletion list.
