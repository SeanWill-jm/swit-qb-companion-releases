#!/usr/bin/env node
'use strict';
// Signs a SWIT QB Companion update notice (run by the GitHub Action, with the private key in the secret UPDATE_KEY).
//   node scripts/sign-notice.js <zip> <version> <channel> <download url> <notes file> > channels/<channel>.json
// The app checks it with the public key built into it (src/update-key.js): same fields, keys sorted, as JSON.
const fs = require('fs');
const crypto = require('crypto');
const [zip, version, channel, url, notesFile] = process.argv.slice(2);
const key = process.env.UPDATE_KEY;
if (!key) throw new Error('The secret UPDATE_KEY is not set on this repository.');
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
notice.sig = crypto.sign(null, Buffer.from(canon), crypto.createPrivateKey(key)).toString('base64url');
process.stdout.write(JSON.stringify(notice, null, 2) + '\n');
