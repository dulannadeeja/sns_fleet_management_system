'use client';
import { useActionState, useState } from 'react';
import { useReady } from '../useReady';
import { Button, Notice } from '../../ui';
import { photoAction, type PhotoFormState } from './actions';

// 04.4 "Add photo" (ST-04.7, AT-29): one optional catalogue photo; JPEG, PNG or WebP up to 10 MB. The size is checked
// here first, so a big file is never sent; the server checks the file's own bytes again.
export interface PhotoWords { add: string; replace: string; remove: string; choose: string; hint: string; standard: string; notCondition: string; errors: Record<string, string> }
const MAX = 10 * 1024 * 1024;

export function PhotoForm({ carId, hasPhoto, w }: { carId: string; hasPhoto: boolean; w: PhotoWords }) {
  const [state, action, pending] = useActionState<PhotoFormState, FormData>(photoAction.bind(null, carId), {});
  const ready = useReady();
  const [tooBig, setTooBig] = useState(false);
  const error = tooBig ? w.errors.fileTooBig : state.error ? (w.errors[state.error] ?? w.errors.failed) : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <form action={action} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="rt-field" style={{ minWidth: 0 }}>
          <span className="rt-field-label">{w.choose}</span>
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" onChange={(e) => setTooBig((e.target.files?.[0]?.size ?? 0) > MAX)} />
        </label>
        <Button type="submit" icon="camera" disabled={pending || !ready || tooBig}>{hasPhoto ? w.replace : w.add}</Button>
      </form>
      {hasPhoto ? (
        <form action={action}>
          <input type="hidden" name="remove" value="1" />
          <Button type="submit" variant="quiet" disabled={pending || !ready}>{w.remove}</Button>
        </form>
      ) : null}
      <span className="set-muted">{`${w.hint} ${hasPhoto ? '' : w.standard} ${w.notCondition}`.replace(/\s+/g, ' ').trim()}</span>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
