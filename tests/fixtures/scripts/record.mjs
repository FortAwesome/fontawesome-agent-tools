// Re-records the API responses that tests/scripts.test.mjs serves from its
// stub server. Run from the repo root with Node 22+ and the `fa` CLI:
//
//   node tests/fixtures/scripts/record.mjs
//
// Written by hand, since kits need an account and the tests need no real one:
// - kits/*.js: the first line of a kit's JS. The kits service writes the
//   release a kit serves into `version` (7.3.1, never 7.x); symbolic.js and
//   latest.js check other values would still be handled, and no-license.js,
//   not-object.js and bad-utf8.js check malformed configs.
// - fa-kit-*.json, fa-search-kit.json: shaped like the fa CLI's own test
//   fixtures (fa-cli tests/integration_kit.rs, integration_search.rs).
//
// The GraphQL requests use the skill's own queries/*.graphql documents.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API = 'https://api.fontawesome.com';
const headers = { 'Content-Type': 'application/json', 'User-Agent': 'fontawesome-agent-tools' };

const VERSION = '7.3.1';
const OLD_VERSION = '6.7.2';
const V5_VERSION = '5.15.4';

const queriesDir = join(here, '../../../plugins/icons/skills/font-awesome/queries');
const doc = (name) => readFileSync(join(queriesDir, `${name}.graphql`), 'utf8');
const LATEST = doc('latest-version');
const ICON = doc('icon-exists');
const SEARCH = doc('search');
const RESOLVE = doc('resolve-version');

const requests = [
  ['latest', LATEST, { version: '7.x' }],
  ['latest', LATEST, { version: '8.x' }],
  ['icon', ICON, { version: VERSION, iconName: 'house' }],
  ['icon', ICON, { version: VERSION, iconName: 'not-an-icon' }],
  ['icon', ICON, { version: '9.9.9', iconName: 'house' }],
  ['search', SEARCH, { version: VERSION, query: 'cup', first: 3 }],
  ['search', SEARCH, { version: VERSION, query: 'cup' }],
  ['search', SEARCH, { version: VERSION, query: 'zzqqxxnothing', first: 3 }],
  ['resolve', RESOLVE, { version: '7.x' }],
  ['resolve', RESOLVE, { version: '6.x' }],
  ['resolve', RESOLVE, { version: '5.x' }],
  ['resolve', RESOLVE, { version: VERSION }],
  ['resolve', RESOLVE, { version: OLD_VERSION }],
];

const graphql = [];
for (const [kind, query, variables] of requests) {
  const res = await fetch(API, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  graphql.push({ kind, variables, response: await res.json() });
}
write('graphql.json', graphql);

for (const version of [VERSION, OLD_VERSION, V5_VERSION]) {
  for (const endpoint of ['family-styles', 'icon-packs']) {
    const res = await fetch(`${API}/releases/${version}/${endpoint}`, { headers });
    const body = await res.json();
    // The Free collection lists every Free icon name; three are enough here.
    for (const c of body.iconCollections ?? []) for (const s of c.subset ?? []) if (s.only) s.only = s.only.slice(0, 3);
    write(`rest/${version}/${endpoint}.json`, body);
  }
}

for (const [file, args] of [
  ['fa-search.json', ['search', '--version', VERSION, '--query', 'cup', '--page-size', '3', '--json']],
  ['fa-icons-house.json', ['icons', '--version', VERSION, '--name', 'house', '--json']],
  ['fa-icons-missing.json', ['icons', '--version', VERSION, '--name', 'not-an-icon', '--json']],
]) {
  const r = spawnSync('fa', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`fa ${args.join(' ')}: ${r.stderr}`);
  write(file, JSON.parse(r.stdout));
}

function write(rel, data) {
  const path = join(here, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${rel}`);
}
