'use client';
import { Button } from '../../../../../ui';

/** Opens the browser's print dialog (counter printing uses the browser's print, TRD 7). */
export function PrintButton({ label }: { label: string }) {
  return <Button type="button" icon="file" onClick={() => window.print()}>{label}</Button>;
}
