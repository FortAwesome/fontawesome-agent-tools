// Pins what the font-awesome skill's docs rely on from its scripts:
//
// - Without `fa`: the fallback scripts (latest-version, icon-exists, search,
//   fetch-kit), run against a stub of the Font Awesome API and kit server
//   that serves responses recorded in tests/fixtures/scripts/.
// - With `fa`: summarize-icons.py, fed recorded `fa ... --json` output.
//
// Run with:  npm test
// FA_LIVE=1 also runs the catalog scripts against the real API.
// Re-record the fixtures with:  node tests/fixtures/scripts/record.mjs

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(repoRoot, 'plugins/icons/skills/font-awesome');
const fixtures = join(repoRoot, 'tests/fixtures/scripts');
const fixture = (rel) => JSON.parse(readFileSync(join(fixtures, rel), 'utf8'));
const graphqlFixtures = fixture('graphql.json');

const PYTHON = process.env.PYTHON || 'python3';

// ---------------------------------------------------------------------------
// Running scripts

/** Runs a skill script with `python3 -I`, as the skill does. */
function run(script, args = [], { env = {}, input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, ['-I', join(skillDir, 'scripts', script), ...args], {
      env: { ...process.env, ...env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input ?? '');
  });
}

// ---------------------------------------------------------------------------
// Stub API and kit server

/** Which recorded request a GraphQL query is, whatever its exact text. */
function kindOf(query) {
  if (/\breleases\b/.test(query)) return 'releases';
  if (/\bsearch\s*\(/.test(query)) return 'search';
  if (/\bicon\s*\(/.test(query)) return 'icon';
  if (/\bfamilyStyles\b/.test(query)) return 'familyStyles';
  if (/\brelease\s*\(/.test(query)) return 'resolve';
  return 'unknown';
}

// Variables match by value, so a renamed variable ($name, $iconName) still matches.
const valuesKey = (vars) => JSON.stringify(Object.values(vars ?? {}).map(String).sort());

function graphqlResponse(body) {
  const kind = kindOf(body.query ?? '');
  const hit = graphqlFixtures.find((f) => f.kind === kind && valuesKey(f.variables) === valuesKey(body.variables));
  return hit?.response;
}

let server;
let base;
const requests = [];

before(async () => {
  server = createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      requests.push({ method: req.method, url: req.url, body });
      const send = (status, data, type = 'application/json') => {
        res.writeHead(status, { 'Content-Type': type });
        res.end(typeof data === 'string' ? data : JSON.stringify(data));
      };
      if (req.method === 'POST' && req.url === '/') {
        const response = graphqlResponse(JSON.parse(body));
        return response ? send(200, response) : send(500, { error: `no fixture for ${body}` });
      }
      const rest = req.url.match(/^\/releases\/([^/]+)\/(family-styles|icon-packs)$/);
      if (rest) {
        const file = join(fixtures, 'rest', rest[1], `${rest[2]}.json`);
        if (!/^\d+\.\d+\.\d+$/.test(rest[1])) return send(400, { error: 'invalid version' });
        return existsSync(file) ? send(200, readFileSync(file, 'utf8')) : send(404, { error: 'not found' });
      }
      const kit = req.url.match(/^\/kit\/(\w+)\.js$/);
      if (kit) {
        if (kit[1] === 'forbidden') return send(403, 'Forbidden', 'text/plain');
        const name = { freepinned: 'free-pinned', freemajor: 'free-major', promajor: 'pro-major', proold: 'pro-old', propinned: 'pro-pinned', garbage: 'garbage' }[kit[1]];
        if (!name) return send(404, 'Not Found', 'text/plain');
        return send(200, readFileSync(join(fixtures, 'kits', `${name}.js`), 'utf8'), 'application/javascript');
      }
      send(404, { error: `unexpected ${req.method} ${req.url}` });
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

const stubEnv = () => ({ FA_API_URL: base, FA_KIT_URL: `${base}/kit` });
const runStub = (script, args, opts = {}) => run(script, args, { ...opts, env: { ...stubEnv(), ...opts.env } });

// ---------------------------------------------------------------------------
// What the fixtures say the answers are

const graphqlData = (kind, vars) => graphqlFixtures.find((f) => f.kind === kind && valuesKey(f.variables) === valuesKey(vars)).response.data;
const latestRelease = () => graphqlData('releases', {}).releases.find((r) => r.isLatest).version;
const VERSION = '7.3.1';
const houseIcon = () => graphqlData('icon', { version: VERSION, iconName: 'house' }).release.icon;
const cupResults = () => graphqlData('search', { version: VERSION, query: 'cup', first: 3 }).search;
const fsKey = (fs) => `${fs.family} ${fs.style}`;

// ---------------------------------------------------------------------------
// Output parsers. These are the only code that knows each script's format.

const fsKeys = (list) => (list ?? []).map(fsKey);
const parse = {
  latestVersion(stdout) {
    return JSON.parse(stdout).data.releases.find((r) => r.isLatest).version;
  },
  iconExists(stdout) {
    const { free, pro } = JSON.parse(stdout).data.release.icon.familyStylesByLicense;
    return { free: fsKeys(free), pro: fsKeys(pro) };
  },
  search(stdout) {
    return JSON.parse(stdout).data.search.map((icon) => ({
      id: icon.id,
      label: icon.label,
      unicode: icon.unicode,
      availability: icon.familyStylesByLicense.free.length ? 'free' : 'pro-only',
    }));
  },
  fetchKit(stdout) {
    const field = (name) => stdout.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1];
    return {
      kitId: field('Kit ID'),
      version: field('Version'),
      license: field('License'),
      method: field('Method'),
      startup: field('Startup file'),
    };
  },
};

// ---------------------------------------------------------------------------
// Without `fa`: the fallback scripts

describe('latest-version.py', () => {
  test('outputs the release flagged isLatest', async () => {
    const r = await runStub('latest-version.py');
    assert.equal(r.code, 0, r.stderr);
    assert.equal(parse.latestVersion(r.stdout), latestRelease());
  });
});

describe('icon-exists.py', () => {
  test('an icon that exists: exit 0 and its Free and Pro family-styles', async () => {
    const r = await runStub('icon-exists.py', ['--version', VERSION, '--icon-name', 'house']);
    assert.equal(r.code, 0, r.stderr);
    const { free, pro } = parse.iconExists(r.stdout);
    const icon = houseIcon();
    assert.deepEqual(new Set(free), new Set(icon.familyStylesByLicense.free.map(fsKey)));
    assert.deepEqual(new Set(pro), new Set(icon.familyStylesByLicense.pro.map(fsKey)));
  });

  test('pipes into summarize-icons.py', async () => {
    const r = await runStub('icon-exists.py', ['--version', VERSION, '--icon-name', 'house']);
    const s = await summarize(r.stdout);
    assert.equal(s.code, 0, s.stderr);
    assert.match(s.stdout, /^house \| Free\+Pro \| /);
  });

  test('an icon that does not exist: exit 1', async () => {
    const r = await runStub('icon-exists.py', ['--version', VERSION, '--icon-name', 'not-an-icon']);
    assert.equal(r.code, 1, r.stderr);
  });

  // add-icon.md reads exit 1 as "doesn't exist", so a failed check must not exit 1.
  test('an unknown version: exit 2 (unknown), not 1, and an error on stderr', async () => {
    const r = await runStub('icon-exists.py', ['--version', '9.9.9', '--icon-name', 'house']);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /not_found/);
  });

  test('an unreachable API: exit 2', async () => {
    const r = await run('icon-exists.py', ['--version', VERSION, '--icon-name', 'house'], {
      env: { FA_API_URL: 'http://127.0.0.1:9' },
    });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /could not reach/i);
  });

  test('a missing --icon-name: exit 2', async () => {
    const r = await runStub('icon-exists.py', ['--version', VERSION]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /--icon-name/);
  });
});

describe('search.py', () => {
  test('one entry per result, with id, label and Free or Pro-only availability', async () => {
    const r = await runStub('search.py', ['--version', VERSION, '--query', 'cup', '--first', '3']);
    assert.equal(r.code, 0, r.stderr);
    const expected = cupResults().map((icon) => ({
      id: icon.id,
      label: icon.label,
      availability: icon.familyStylesByLicense.free.length ? 'free' : 'pro-only',
    }));
    assert.deepEqual(
      parse.search(r.stdout).map(({ id, label, availability }) => ({ id, label, availability })),
      expected,
    );
  });

  test('no results: says so', async () => {
    const r = await runStub('search.py', ['--version', VERSION, '--query', 'zzqqxxnothing', '--first', '3']);
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(parse.search(r.stdout), []);
  });

  test('--first is sent as an Int, and the document defaults it to 10', async () => {
    requests.length = 0;
    await runStub('search.py', ['--version', VERSION, '--query', 'cup', '--first', '3']);
    const sent = JSON.parse(requests.find((q) => q.method === 'POST').body);
    assert.strictEqual(sent.variables.first, 3);
    assert.match(sent.query, /\$first: Int = 10/);
  });

  test('pipes into summarize-icons.py: one line per result', async () => {
    const r = await runStub('search.py', ['--version', VERSION, '--query', 'cup', '--first', '3']);
    const s = await summarize(r.stdout);
    assert.equal(s.code, 0, s.stderr);
    assert.deepEqual(
      s.stdout.trim().split('\n').map((line) => line.split(' ')[0]),
      cupResults().map((icon) => icon.id),
    );
  });

  test('an unknown option: exit 2 and lists the options', async () => {
    const r = await runStub('search.py', ['--version', VERSION, '--qeury', 'cup']);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /--query/);
  });
});

describe('resolve-version.py', () => {
  for (const [version, expected] of [['7.x', '7.3.1'], ['6.x', '6.7.2'], ['7.3.1', '7.3.1']]) {
    test(`${version} resolves to the release the API names (${expected})`, async () => {
      const r = await runStub('resolve-version.py', ['--version', version]);
      assert.equal(r.code, 0, r.stderr);
      assert.equal(JSON.parse(r.stdout).data.release.version, graphqlData('resolve', { version }).release.version);
    });
  }
});

describe('fetch-kit.py', () => {
  test("reports the kit's version, license, method and startup file from its kit JS", async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'propinned']);
    assert.equal(r.code, 0, r.stderr);
    const out = parse.fetchKit(r.stdout);
    assert.equal(out.kitId, 'propinned');
    assert.match(out.version, /^6\.7\.2\b/);
    assert.equal(out.license, 'pro');
    assert.equal(out.method, 'css');
    assert.equal(out.startup, 'pro-v6.min.js');
  });

  test('a Free kit', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'freepinned']);
    assert.equal(r.code, 0, r.stderr);
    assert.equal(parse.fetchKit(r.stdout).license, 'free');
  });

  test('a kit the server refuses (403): exit 1 and says so', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'forbidden']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /403/);
  });

  test('a kit that does not exist (404): exit 1 and says so', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'nosuchkit']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /404|not found/i);
  });

  test('a response that is not a kit: exit 1 and says so', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'garbage']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /could not parse kit config/i);
  });
});

// ---------------------------------------------------------------------------
// With `fa`: summarize-icons.py reads `fa ... --json` output

const summarize = (input) => run('summarize-icons.py', [], { input });
const families = (icon) => {
  const all = [...icon.familyStylesByLicense.free, ...icon.familyStylesByLicense.pro];
  return { families: [...new Set(all.map((fs) => fs.family))], count: new Set(all.map(fsKey)).size };
};

describe('summarize-icons.py', () => {
  test('fa search: one line per icon with availability, families and family-style count', async () => {
    const input = readFileSync(join(fixtures, 'fa-search.json'), 'utf8');
    const icons = JSON.parse(input).data.searchPaginated.icons;
    const r = await summarize(input);
    assert.equal(r.code, 0, r.stderr);
    const lines = r.stdout.trim().split('\n');
    assert.equal(lines.length, icons.length);
    icons.forEach((icon, i) => {
      const { free, pro } = icon.familyStylesByLicense;
      const availability = free.length && pro.length ? 'Free+Pro' : free.length ? 'Free' : 'Pro';
      const { families: fams, count } = families(icon);
      assert.ok(lines[i].startsWith(icon.id), lines[i]);
      assert.ok(lines[i].includes(` | ${availability} | `), lines[i]);
      for (const f of fams) assert.ok(lines[i].includes(f), `${lines[i]} lacks ${f}`);
      assert.ok(lines[i].includes(`(${count} family-style`), `${lines[i]} lacks the count ${count}`);
    });
  });

  test('fa icons --name: the icon, Free+Pro, and which family-styles are Free', async () => {
    const input = readFileSync(join(fixtures, 'fa-icons-house.json'), 'utf8');
    const icon = JSON.parse(input).data.release.icon;
    const r = await summarize(input);
    assert.equal(r.code, 0, r.stderr);
    const line = r.stdout.trim();
    assert.ok(line.startsWith('house'), line);
    assert.ok(line.includes('| Free+Pro |'), line);
    const free = icon.familyStylesByLicense.free.map((fs) => `${fs.family}/${fs.style}`);
    assert.ok(line.endsWith(`free: ${free.join(', ')}`), line);
  });

  test('fa icons --name for an icon that does not exist', async () => {
    const r = await summarize(readFileSync(join(fixtures, 'fa-icons-missing.json'), 'utf8'));
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout.trim(), 'No icons in the results.');
  });

  test('fa kit icon: the icon is in the kit, with its prefixes', async () => {
    const r = await summarize(readFileSync(join(fixtures, 'fa-kit-icon.json'), 'utf8'));
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout.trim(), 'house | in kit | fas, far');
  });

  test('the kit icon variants query: the icon is in the kit, in each named family-style', async () => {
    const r = await summarize(readFileSync(join(fixtures, 'fa-kit-icon-variants.json'), 'utf8'));
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout.trim(), 'house | in kit | classic/solid, classic/regular, sharp/solid');
  });

  test('an API error payload: non-zero exit with the error', async () => {
    const r = await summarize(JSON.stringify({ errors: [{ message: 'not_found' }] }));
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /not_found/);
  });

  test('input that is not JSON: non-zero exit', async () => {
    const r = await summarize('Error: something went wrong');
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /isn't JSON/);
  });

  test('no input: non-zero exit', async () => {
    const r = await summarize('');
    assert.notEqual(r.code, 0);
  });
});

// ---------------------------------------------------------------------------
// FA_LIVE=1: the catalog scripts against the real API (not run in CI)

describe('live API', { skip: !process.env.FA_LIVE && 'set FA_LIVE=1 to run' }, () => {
  test('latest-version.py prints a version', async () => {
    const r = await run('latest-version.py');
    assert.equal(r.code, 0, r.stderr);
    assert.match(parse.latestVersion(r.stdout), /^\d+\.\d+\.\d+$/);
  });

  test('icon-exists.py: house exists, not-an-icon does not', async () => {
    const version = parse.latestVersion((await run('latest-version.py')).stdout);
    assert.equal((await run('icon-exists.py', ['--version', version, '--icon-name', 'house'])).code, 0);
    assert.equal((await run('icon-exists.py', ['--version', version, '--icon-name', 'not-an-icon'])).code, 1);
  });

  test('search.py returns results for cup', async () => {
    const version = parse.latestVersion((await run('latest-version.py')).stdout);
    const r = await run('search.py', ['--version', version, '--query', 'cup']);
    assert.equal(r.code, 0, r.stderr);
    assert.ok(parse.search(r.stdout).length > 0, r.stdout);
  });
});
