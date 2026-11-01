'use client';
import { useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

/** False on the server and until the page is hydrated, then true. A form's submit button stays off until then: a click
 *  before hydration would send the form as a full page load, outside its action's state (#15, #20 email.spec). */
export function useReady(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
