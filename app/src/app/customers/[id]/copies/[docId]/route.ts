import { forbidden, notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { accessFor } from '../../../../../auth/access';
import { openCopy } from '../../../../../modules/customers/customers';

// A customer's document copy (AT-59): only through this route, only with customer access; each opening is recorded by
// openCopy. Never cached, never a public link, shown in the browser as the file it is.
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'application/pdf': 'pdf' };

export async function GET(_: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const access = await accessFor(await headers(), 'customerAccess');
  if (access.kind === 'redirect') redirect(access.to);
  if (access.kind === 'denied') forbidden();
  const { id, docId } = await params;
  const opened = await openCopy(access.person.id, docId, id);
  if ('error' in opened) return opened.error === 'notAllowed' ? forbidden() : notFound();
  return new Response(new Blob([opened.bytes as BlobPart]), {
    headers: {
      'content-type': opened.contentType,
      // Most browsers cannot show HEIC: it downloads instead of opening a blank tab (#19 review).
      'content-disposition': `${opened.contentType === 'image/heic' ? 'attachment' : 'inline'}; filename="${opened.kind}.${EXT[opened.contentType] ?? 'bin'}"`,
      // Nothing in a copy (a PDF's scripts, say) may run or load anything.
      'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}
