// Sample data for customer tests (not real people): a random 12-digit NIC and tiny files with the right first bytes.
export const sampleNic = () => String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
export const sampleCustomer = () => ({
  name: `Sample customer ${Math.random().toString(36).slice(2, 8)}`, nic: sampleNic(), phone: '0771234567',
  licenceNumber: `B${Math.floor(Math.random() * 1e7)}`, licenceExpires: '2030-01-31',
});
const withHead = (head: number[], size = 64) => { const b = new Uint8Array(size); b.set(head); return b; };
export const JPEG = withHead([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
export const PDF = withHead([...'%PDF-1.7\n'].map((c) => c.charCodeAt(0)));
export const NOT_A_PHOTO = withHead([...'MZ this is not a photo'].map((c) => c.charCodeAt(0)));
