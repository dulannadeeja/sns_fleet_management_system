#!/usr/bin/env node
// Regenerates screens/canvas/ds/plate/ from design-system/ (the master). Run after changing tokens or the bundle.
//   node scripts/sync-design-copy.mjs          write the copy
//   node scripts/sync-design-copy.mjs --check  exit 1 if the copy is out of step
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT, read, exists, canvasCopyOf, DESIGN_COPY } from './lib.mjs';

const check = process.argv.includes('--check');
const stale = [];
for (const f of DESIGN_COPY) {
  const want = canvasCopyOf(read(`design-system/${f}`));
  const target = `screens/canvas/ds/plate/${f}`;
  const have = exists(target) ? read(target) : null;
  if (have === want) continue;
  stale.push(target);
  if (!check) {
    mkdirSync(dirname(join(ROOT, target)), { recursive: true });
    writeFileSync(join(ROOT, target), want);
  }
}
if (check && stale.length) {
  console.error(`Design copy out of step: ${stale.join(', ')}. Run: node scripts/sync-design-copy.mjs`);
  process.exit(1);
}
console.log(stale.length ? `${check ? 'Stale' : 'Updated'}: ${stale.join(', ')}` : 'Design copy in step.');
