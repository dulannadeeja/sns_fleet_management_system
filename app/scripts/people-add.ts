// Adds a person who signs in with a phone number and a first password (they set their own at the first sign-in), with
// their role's default permissions. Mainly to add the primary owner once when setting up; after that the owner adds
// people on the People screen (15.4). Usage, from app/:
//   npm run people:add -- --name "S D De Silva" --phone 0771234567 --role owner
// --role is owner, admin or staff (default staff). The first password is asked for (or read from FIRST_PASSWORD);
// it shows while typed and is never printed or logged.
import { createInterface } from 'node:readline/promises';
import { addPerson } from '../src/modules/people/people';

const arg = (flag: string) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const name = arg('--name');
const phone = arg('--phone');
const role = arg('--role') ?? 'staff';
if (!name || !phone || !['owner', 'admin', 'staff'].includes(role)) {
  console.error('Usage: npm run people:add -- --name "Full name" --phone 07XXXXXXXX [--role owner|admin|staff]');
  process.exit(1);
}
let password = process.env.FIRST_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('First password (8+ characters): ');
  rl.close();
}

const problems: Record<string, string> = {
  nameMissing: 'The name is empty.',
  phoneMissing: 'The phone number is empty.',
  phoneInvalid: 'The phone number must be a Sri Lankan mobile number: 10 digits, starting 070, 071, 072, 074, 075, 076, 077 or 078, no spaces.',
  phoneTaken: 'Someone already has this phone number.',
  passwordShort: 'The first password needs at least 8 characters.',
  roleInvalid: role === 'owner' ? 'There is already a primary owner; there can be only one.' : 'The role must be owner, admin or staff.',
};
const added = await addPerson(null, { name, phone, password, role: role as 'owner' | 'admin' | 'staff' });
if (!('ok' in added)) {
  console.error(problems[added.error] ?? `Not added: ${added.error}`);
  process.exit(1);
}
console.log(`Added ${name} (${phone}) as ${role}. They set their own password at the first sign-in.`);
process.exit(0);
