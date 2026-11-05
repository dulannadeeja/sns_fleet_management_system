// Lists every AT-nn in the system design and the test that covers it (tests/**/at-nn.test.ts or .spec.ts).
// Default: report only, so the build-up phase stays green. --strict: fail when any AT has no test (the release gate, TRD › Testing).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const design = readFileSync(join(app, '..', 'SNS_SYSTEM_DESIGN.md'), 'utf8');
const ats = [...new Set(design.match(/AT-\d{2}/g) ?? [])].sort();

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(name.toLowerCase());
  }
})(join(app, 'tests'));

const missing = ats.filter((at) => !files.some((f) => new RegExp(`^${at.toLowerCase()}\\.(test|spec)\\.ts$`).test(f)));
console.log(`AT coverage: ${ats.length - missing.length} of ${ats.length} have a test.`);
if (missing.length) console.log(`No test yet: ${missing.join(', ')}`);
if (process.argv.includes('--strict') && missing.length) process.exit(1);
