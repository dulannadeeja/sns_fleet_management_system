import { forbidden, notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { accessFor } from '../../../../../auth/access';
import { openHandoverPhoto } from '../../../../../modules/rentals/handover';

// A condition photo from the handover (#57): only through this route, only with Customer access; each opening is in
// the activity log, as for ID copies. Never cached, never a public link. Same headers as the signed agreement.
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function GET(_: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const access = await accessFor(await headers(), 'customerAccess');
  if (access.kind === 'redirect') redirect(access.to);
  if (access.kind === 'denied') forbidden();
  const { id, photoId } = await params;
  const opened = await openHandoverPhoto(access.person.id, id, photoId);
  if ('error' in opened) return opened.error === 'notAllowed' ? forbidden() : notFound();
  return new Response(new Blob([opened.bytes as BlobPart]), {
    headers: {
      'content-type': opened.contentType,
      'content-disposition': `inline; filename="car.${EXT[opened.contentType] ?? 'bin'}"`,
      'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}
