import { forbidden, notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { accessFor } from '../../../../../auth/access';
import { readPhoto } from '../../../../../modules/cars/papers';

// A car's catalogue photo (ST-04.7, AT-29): kept privately, shown only through this route to people who work at SNS.
// Each photo has its own id, so the browser may keep it (privately) for a day; a new photo gets a new link.
export async function GET(_: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const access = await accessFor(await headers(), 'employee');
  if (access.kind === 'redirect') redirect(access.to);
  if (access.kind === 'denied') forbidden();
  const { id, photoId } = await params;
  const photo = await readPhoto(access.person.id, id, photoId);
  if (!photo) notFound();
  return new Response(new Blob([photo.bytes as BlobPart]), {
    headers: {
      'content-type': photo.contentType,
      'content-disposition': 'inline',
      'content-security-policy': "default-src 'none'; sandbox",
      'cache-control': 'private, max-age=86400',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}
