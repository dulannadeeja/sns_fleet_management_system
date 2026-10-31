import type { ReactNode } from 'react';
// Plate, copied from design-system/ by scripts/sync-plate.mjs before dev, build and test (TRD › Interface and languages).
import '../ui/plate/fonts.css';
import '../ui/plate/tokens.css';
import '../ui/plate/plate.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="si"><body className="rt" style={{ margin: 0, background: 'var(--paper)' }}>{children}</body></html>;
}
