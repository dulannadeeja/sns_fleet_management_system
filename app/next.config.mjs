import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
// authInterrupts: forbidden() answers 403 when a signed-in person lacks a permission (TRD › Integrity rules).
// The new-password page carries its one-time link in the address: never pass it on to another site (#28 review).
const headers = async () => [{ source: '/reset-password', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] }];
// Four document copies of up to 10 MB each (system design 6, Proposed) and the form around them; actions check each file.
export default withNextIntl({ experimental: { authInterrupts: true, serverActions: { bodySizeLimit: '42mb' } }, headers });
