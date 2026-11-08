import { forbidden, notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { accessFor } from '../../../../../auth/access';
import { openSigned } from '../../../../../modules/rentals/agreements';

// The signed agreement (#55): only through this route, only with Customer access; each opening is in the activity
// log. Never cached, never a public link. Same headers as the customer's copies (#19).
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'application/pdf': 'pdf' };

export async function GET(_: Request, { params }: { params: Promise<{ id: string; signedId: string }> }) {
  const access = await accessFor(await headers(), 'customerAccess');
  if (access.kind === 'redirect') redirect(access.to);
  if (access.kind === 'denied') forbidden();
  const { id, signedId } = await params;
  const opened = await openSigned(access.person.id, id, signedId);
  if ('error' in opened) return opened.error === 'notAllowed' ? forbidden() : notFound();
  return new Response(new Blob([opened.bytes as BlobPart]), {
    headers: {
      'content-type': opened.contentType,
      'content-disposition': `${opened.contentType === 'image/heic' ? 'attachment' : 'inline'}; filename="agreement.${EXT[opened.contentType] ?? 'bin'}"`,
      'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}
