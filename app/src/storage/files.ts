import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AwsClient } from 'aws4fetch';

// Private files (TRD › Integrity rules "Private documents are never public"; T-stack: Cloudflare R2). With R2 settings,
// files go to the private bucket through its S3 API. Without them, outside production, they go to a private folder outside
// the web root (DOCUMENTS_DIR, else the system's temp folder); production refuses to store without R2. Nothing here makes
// a public link: files are read back only by the app's own routes, which check permission first.

const KEY = /^[a-z0-9][a-z0-9/_-]{8,200}$/;

function r2(): { client: AwsClient; base: string } | null {
  const { R2_ACCOUNT_ID: account, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: secret, R2_BUCKET: bucket } = process.env;
  if (!account || !id || !secret || !bucket) return null;
  return { client: new AwsClient({ accessKeyId: id, secretAccessKey: secret, service: 's3', region: 'auto' }), base: `https://${account}.r2.cloudflarestorage.com/${bucket}` };
}

function folder(): string {
  if (process.env.NODE_ENV === 'production') throw new Error('File storage is not set up: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET are needed');
  return process.env.DOCUMENTS_DIR || join(tmpdir(), 'sns-documents');
}
const localPath = (key: string) => join(folder(), ...key.split('/'));

export async function putFile(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
  if (!KEY.test(key)) throw new Error('Bad file key');
  const remote = r2();
  if (remote) {
    const res = await remote.client.fetch(`${remote.base}/${key}`, { method: 'PUT', body: new Blob([bytes as BlobPart]), headers: { 'content-type': contentType } });
    if (!res.ok) throw new Error(`File not stored (R2 answered ${res.status})`);
    return;
  }
  const path = localPath(key);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, bytes, { mode: 0o600 });
}

export async function getFile(key: string): Promise<Uint8Array | null> {
  if (!KEY.test(key)) return null;
  const remote = r2();
  if (remote) {
    const res = await remote.client.fetch(`${remote.base}/${key}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`File not read (R2 answered ${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }
  try {
    return new Uint8Array(await readFile(localPath(key)));
  } catch {
    return null;
  }
}
