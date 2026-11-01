// Adds a person who signs in with a phone number and a first password (they set their own at the first sign-in).
// Until the owner's People screen (#15). Usage, from app/:  npm run people:add -- --name "S D De Silva" --phone 0771234567
// The first password is asked for (or read from FIRST_PASSWORD); it is never printed.
import { createInterface } from 'node:readline/promises';
import { addPerson } from '../src/auth/people';

const arg = (flag: string) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const name = arg('--name');
const phone = arg('--phone');
if (!name || !phone) {
  console.error('Usage: npm run people:add -- --name "Full name" --phone 07XXXXXXXX');
  process.exit(1);
}
let password = process.env.FIRST_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('First password (8+ characters): ');
  rl.close();
}
const id = await addPerson({ name, phone, password });
console.log(`Added ${name} (${phone}). They set their own password at the first sign-in. Id: ${id}`);
process.exit(0);
