// Re-records the API responses that tests/scripts.test.mjs serves from its
// stub server. Run from the repo root with Node 22+ and the `fa` CLI:
//
//   node tests/fixtures/scripts/record.mjs
//
// The kit JS files (kits/*.js) and fa-kit-*.json are written by hand: kit
// tokens and kit queries need an account, and the tests don't need real ones.

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API = 'https://api.fontawesome.com';
const headers = { 'Content-Type': 'application/json', 'User-Agent': 'fontawesome-agent-tools' };

const VERSION = '7.3.1';
const OLD_VERSION = '6.7.2';

const RELEASES = '{ releases { version isLatest } }';
const ICON = 'query ($version: String!, $iconName: String!) { release(version: $version) { icon(name: $iconName) { id label familyStylesByLicense { free { family style } pro { family style } } } } }';
const SEARCH = 'query ($version: String!, $query: String!, $first: Int) { search(version: $version, query: $query, first: $first) { id label unicode familyStylesByLicense { free { family style } pro { family style } } } }';
const FAMILY_STYLES = 'query ($version: String!) { release(version: $version) { familyStyles { family style } } }';
const RESOLVE = 'query ($version: String!) { release(version: $version) { version } }';

const requests = [
  ['releases', RELEASES, {}],
  ['icon', ICON, { version: VERSION, iconName: 'house' }],
  ['icon', ICON, { version: VERSION, iconName: 'not-an-icon' }],
  ['icon', ICON, { version: '9.9.9', iconName: 'house' }],
  ['search', SEARCH, { version: VERSION, query: 'cup', first: 3 }],
  ['search', SEARCH, { version: VERSION, query: 'zzqqxxnothing', first: 3 }],
  ['familyStyles', FAMILY_STYLES, { version: VERSION }],
  ['familyStyles', FAMILY_STYLES, { version: OLD_VERSION }],
  ['resolve', RESOLVE, { version: '7.x' }],
  ['resolve', RESOLVE, { version: '6.x' }],
  ['resolve', RESOLVE, { version: VERSION }],
  ['resolve', RESOLVE, { version: OLD_VERSION }],
];

const graphql = [];
for (const [kind, query, variables] of requests) {
  const res = await fetch(API, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  graphql.push({ kind, variables, response: await res.json() });
}
write('graphql.json', graphql);

for (const version of [VERSION, OLD_VERSION]) {
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
