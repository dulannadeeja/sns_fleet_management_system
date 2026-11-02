// Which files may be kept as document copies (system design 6, Proposed: Dulan, 1 Nov 2026): a photo (JPEG, PNG, WebP,
// HEIC) or a PDF, up to 10 MB, kept as taken. The type is read from the file's first bytes, not from its name or what
// the browser says, so a renamed file cannot pass as a photo.
export const MAX_COPY_BYTES = 10 * 1024 * 1024;
export type CopyType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'application/pdf';

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.slice(from, to));

export function copyType(b: Uint8Array): CopyType | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && ascii(b, 1, 4) === 'PNG') return 'image/png';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'image/webp';
  if (ascii(b, 4, 8) === 'ftyp' && ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'].includes(ascii(b, 8, 12))) return 'image/heic';
  if (ascii(b, 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}
