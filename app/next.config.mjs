import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
// authInterrupts: forbidden() answers 403 when a signed-in person lacks a permission (TRD › Integrity rules).
export default withNextIntl({ experimental: { authInterrupts: true } });
