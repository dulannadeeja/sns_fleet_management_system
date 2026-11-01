'use client';
import { useOptimistic, useState, useSyncExternalStore, useTransition } from 'react';
import { setPermissionAction } from './actions';

const noSubscribe = () => () => {};

/** One tick box of screen 15.1: saves at once; on a refusal it goes back and says why. It stays disabled until the
 *  page's scripts run, so a click on a slow phone is never lost (the browser would tick it without saving). */
export function PermissionBox({ personId, permission, allowed, label, errors }: {
  personId: string; permission: string; allowed: boolean; label: string; errors: Record<string, string>;
}) {
  const [shown, setShown] = useOptimistic(allowed);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  return (
    <>
      <input type="checkbox" checked={shown} aria-label={label} aria-busy={pending || undefined} disabled={!ready || pending}
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            setShown(next);
            const result = await setPermissionAction(personId, permission, next);
            setError(result.error ? errors[result.error] : undefined);
          });
        }} />
      {error ? <span role="alert" className="rt-field-error" style={{ display: 'block' }}>{error}</span> : null}
    </>
  );
}
