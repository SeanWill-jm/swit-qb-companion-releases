#!/usr/bin/env node
'use strict';
// Signs a SWIT QB Companion update notice (run by the GitHub Action, with the private key in the secret UPDATE_KEY).
//   node scripts/sign-notice.js <zip> <version> <channel> <download url> <notes file> > channels/<channel>.json
// The app checks it with the public key built into it (src/update-key.js): same fields, keys sorted, as JSON.
const fs = require('fs');
const crypto = require('crypto');
const [zip, version, channel, url, notesFile] = process.argv.slice(2);
// The public half built into the app (src/update-key.js): the signature is checked with it before anything is published.
const APP_PUBLIC_KEY = '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAiWDL0fSK21XiyntUK6f6ZayevoZJVVD8CyitFoZEb+U=\n-----END PUBLIC KEY-----\n';
const fail = (m) => {
  console.error('\n' + m + '\n');
  process.exit(1);
};
// The secret as pasted: CRLF from Notepad, quotes, spaces, the line breaks lost (one long line), or only the base64.
function readKey(raw) {
  if (!raw || !raw.trim()) fail('The secret UPDATE_KEY is not set on this repository (Settings -> Secrets and variables -> Actions).');
  let t = raw.replace(/\r/g, '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  if (/BEGIN (RSA |EC )?PUBLIC KEY/.test(t)) fail('UPDATE_KEY holds the PUBLIC key. It needs the PRIVATE key: the file SWIT-update-PRIVATE-key.pem (or the copy in your password manager).');
  if (/BEGIN ENCRYPTED PRIVATE KEY/.test(t)) fail('UPDATE_KEY holds a password-protected key. Paste SWIT-update-PRIVATE-key.pem as Make_Update_Key made it.');
  const body = t.replace(/-----(BEGIN|END) [A-Z ]*-----/g, '').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+=*$/.test(body)) fail('UPDATE_KEY is not a key: paste everything in SWIT-update-PRIVATE-key.pem, from -----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY-----.');
  try {
    return crypto.createPrivateKey({ key: Buffer.from(body, 'base64'), format: 'der', type: 'pkcs8' });
  } catch {
    fail('UPDATE_KEY could not be read as a private key. Paste SWIT-update-PRIVATE-key.pem again, the whole file, from -----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY-----.');
  }
}
const key = readKey(process.env.UPDATE_KEY);
if (crypto.createPublicKey(key).export({ type: 'spki', format: 'pem' }).replace(/\s/g, '') !== APP_PUBLIC_KEY.replace(/\s/g, ''))
  fail('UPDATE_KEY is a private key, but not the one whose public half is built into the app: servers would refuse this update. Use the SWIT-update-PRIVATE-key.pem made together with the public key you sent.');
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version || '')) throw new Error('Not a version: ' + version);
if (!['stable', 'beta'].includes(channel)) throw new Error('The channel is stable or beta.');
const buf = fs.readFileSync(zip);
const notice = {
  v: 1,
  product: 'SWIT QB Companion',
  version,
  channel,
  date: new Date().toISOString().slice(0, 10),
  notes: notesFile && fs.existsSync(notesFile) ? fs.readFileSync(notesFile, 'utf8').trim().slice(0, 20000) : '',
  url,
  sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  size: buf.length,
};
const canon = JSON.stringify(Object.fromEntries(Object.keys(notice).sort().map((k) => [k, notice[k]])));
notice.sig = crypto.sign(null, Buffer.from(canon), key).toString('base64url');
process.stdout.write(JSON.stringify(notice, null, 2) + '\n');
