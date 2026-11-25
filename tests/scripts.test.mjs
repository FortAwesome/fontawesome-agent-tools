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
  if (/\bisLatest\b/.test(query)) return 'latest';
  if (/\bsearch\s*\(/.test(query)) return 'search';
  if (/\bicon\s*\(/.test(query)) return 'icon';
  if (/\bfamilyStyles\b/.test(query)) return 'familyStyles';
  if (/\brelease\s*\(/.test(query)) return 'resolve';
  return 'unknown';
}

// Variables match by value, so a renamed variable ($name, $iconName) still matches.
const valuesKey = (vars) => JSON.stringify(Object.values(vars ?? {}).map(String).sort());

/** Responses a test sets in place of the recorded ones: {kind, variables, response}. */
const overrides = [];

/** The override or recorded entry for a request. An override may instead `drop`, `hang`, or send a `raw` body. */
function graphqlHit(body) {
  const kind = kindOf(body.query ?? '');
  return [...overrides, ...graphqlFixtures].find((f) => f.kind === kind && valuesKey(f.variables) === valuesKey(body.variables));
}

/** Runs fn with these overrides in place. */
async function withOverrides(entries, fn) {
  overrides.push(...entries);
  try {
    return await fn();
  } finally {
    overrides.length = 0;
  }
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
        res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
      };
      if (req.method === 'POST' && req.url === '/') {
        const hit = graphqlHit(JSON.parse(body));
        if (hit?.drop) return req.socket.destroy(); // the connection closes with no response
        if (hit?.hang) return; // never answers
        if (hit?.raw !== undefined) return send(200, hit.raw);
        return hit ? send(200, hit.response) : send(500, { error: `no fixture for ${body}` });
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
        const name = { freepinned: 'free-pinned', procurrent: 'pro-current', symbolic: 'symbolic', propinned: 'pro-pinned', freenoversion: 'free-noversion', latestkit: 'latest', nolicense: 'no-license', notobject: 'not-object', badutf8: 'bad-utf8', garbage: 'garbage' }[kit[1]];
        if (!name) return send(404, 'Not Found', 'text/plain');
        return send(200, readFileSync(join(fixtures, 'kits', `${name}.js`)), 'application/javascript');
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
const latestRelease = () => graphqlData('latest', { version: '7.x' }).release.version;
const VERSION = '7.3.1';
const houseIcon = () => graphqlData('icon', { version: VERSION, iconName: 'house' }).release.icon;
const cupResults = () => graphqlData('search', { version: VERSION, query: 'cup', first: 3 }).search;
const fsKey = (fs) => `${fs.family} ${fs.style}`;

// ---------------------------------------------------------------------------
// Output parsers. These are the only code that knows each script's format.

const fsKeys = (list) => (list ?? []).map(fsKey);
const parse = {
  latestVersion(stdout) {
    return stdout.trim();
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
      warning: field('Warning'),
      // "  family: style, style" lines after the "Assumed family-styles" heading
      assumed: (stdout.split(/^Assumed family-styles.*$/m)[1] ?? '')
        .split('\n')
        .map((line) => line.match(/^\s+([\w-]+): (.*)$/))
        .filter(Boolean)
        .flatMap(([, family, styles]) => styles.split(', ').map((style) => `${family} ${style}`)),
    };
  },
};

// ---------------------------------------------------------------------------
// Without `fa`: the fallback scripts

describe('latest-version.py', () => {
  const latestRequests = () =>
    requests.filter((q) => q.method === 'POST').map((q) => JSON.parse(q.body).variables.version);

  test('7.x is the latest of all: prints its release, from one request', async () => {
    assert.equal(graphqlData('latest', { version: '7.x' }).release.isLatest, true, 'fixture: 7.x is the latest');
    requests.length = 0;
    const r = await runStub('latest-version.py');
    assert.equal(r.code, 0, r.stderr);
    assert.equal(parse.latestVersion(r.stdout), latestRelease());
    assert.deepEqual(latestRequests(), ['7.x']);
  });

  test('a newer major exists: tries 8.x next, and prints its release', async () => {
    overrides.push(
      { kind: 'latest', variables: { version: '7.x' }, response: { data: { release: { version: '7.9.0', isLatest: false } } } },
      { kind: 'latest', variables: { version: '8.x' }, response: { data: { release: { version: '8.1.0', isLatest: true } } } },
    );
    try {
      requests.length = 0;
      const r = await runStub('latest-version.py');
      assert.equal(r.code, 0, r.stderr);
      assert.equal(parse.latestVersion(r.stdout), '8.1.0');
      assert.deepEqual(latestRequests(), ['7.x', '8.x']);
    } finally {
      overrides.length = 0;
    }
  });

  test('7.x is not the latest but 8.x does not exist: exit 2', async () => {
    overrides.push({
      kind: 'latest',
      variables: { version: '7.x' },
      response: { data: { release: { version: '7.9.0', isLatest: false } } },
    });
    try {
      const r = await runStub('latest-version.py');
      assert.equal(r.code, 2);
      assert.match(r.stderr, /couldn't resolve 8\.x \(7\.x isn't the latest release\)/);
    } finally {
      overrides.length = 0;
    }
  });

  test("the first request fails: says so, and doesn't claim 6.x was checked", async () => {
    await withOverrides([{ kind: 'latest', variables: { version: '7.x' }, drop: true }], async () => {
      const r = await runStub('latest-version.py');
      assert.equal(r.code, 2);
      assert.match(r.stderr, /couldn't resolve 7\.x: the connection to the Font Awesome API failed/);
      assert.doesNotMatch(r.stderr, /6\.x/);
    });
  });

  test('takes no arguments: exit 2', async () => {
    const r = await runStub('latest-version.py', ['--version', '7.x']);
    assert.equal(r.code, 2);
  });
});

// add-icon.md reads icon-exists.py's exit 1 as "doesn't exist" and swaps in
// another icon, so every kind of failure must exit 2.
describe('the runner: failures exit 2, never 1', () => {
  const houseVars = { version: VERSION, iconName: 'house' };
  const iconExists = (env = {}) => runStub('icon-exists.py', ['--version', VERSION, '--icon-name', 'house'], { env });

  test('the connection closes with no response', async () => {
    await withOverrides([{ kind: 'icon', variables: houseVars, drop: true }], async () => {
      const r = await iconExists();
      assert.equal(r.code, 2, r.stderr);
      assert.match(r.stderr, /connection to the Font Awesome API failed/);
    });
  });

  for (const raw of ['[]', 'null', '"text"']) {
    test(`a JSON response that isn't an object (${raw})`, async () => {
      await withOverrides([{ kind: 'icon', variables: houseVars, raw }], async () => {
        const r = await iconExists();
        assert.equal(r.code, 2, r.stderr);
        assert.match(r.stderr, /isn't an object/);
      });
    });
  }

  for (const raw of ['{}', '{"data":null}', '{"error":"bad gateway"}']) {
    test(`a JSON object with no data and no errors (${raw}): exit 2, not "not found"`, async () => {
      await withOverrides([{ kind: 'icon', variables: houseVars, raw }], async () => {
        const r = await iconExists();
        assert.equal(r.code, 2, r.stderr);
        assert.match(r.stderr, /no data and no errors/);
      });
    });
  }

  for (const value of ['30s', '', '-1']) {
    test(`a bad FA_API_TIMEOUT (${JSON.stringify(value)}): warns and uses the default, never exit 1`, async () => {
      const r = await iconExists({ FA_API_TIMEOUT: value });
      assert.equal(r.code, 0, r.stderr);
      assert.match(r.stderr, /ignoring FA_API_TIMEOUT/);
    });
  }

  test('the API never answers: times out (FA_API_TIMEOUT)', async () => {
    await withOverrides([{ kind: 'icon', variables: houseVars, hang: true }], async () => {
      const r = await iconExists({ FA_API_TIMEOUT: '1' });
      assert.equal(r.code, 2, r.stderr);
      assert.match(r.stderr, /timed out/i);
    });
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

  test('--first is sent as an Int', async () => {
    requests.length = 0;
    await runStub('search.py', ['--version', VERSION, '--query', 'cup', '--first', '3']);
    const sent = JSON.parse(requests.find((q) => q.method === 'POST').body);
    assert.strictEqual(sent.variables.first, 3);
  });

  test('without --first: sends no first, so the API applies the default of 10', async () => {
    requests.length = 0;
    const r = await runStub('search.py', ['--version', VERSION, '--query', 'cup']);
    assert.equal(r.code, 0, r.stderr);
    const sent = JSON.parse(requests.find((q) => q.method === 'POST').body);
    assert.ok(!('first' in sent.variables), `sent first: ${sent.variables.first}`);
    assert.match(sent.query, /\$first: Int = 10/);
    // Recorded from the live API with no `first`: the document's default applied.
    assert.equal(parse.search(r.stdout).length, 10);
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

  const restFixture = (version, endpoint) => fixture(`rest/${version}/${endpoint}.json`);
  const freeCollection = (version) =>
    restFixture(version, 'icon-packs').iconCollections.find((c) => c.name === 'free-collection').subset.map(fsKey);
  const allFamilyStyles = (version) => restFixture(version, 'family-styles').familyStyles.map(fsKey);
  const WARNING = /Without the `fa` CLI I can't tell which family-styles this kit includes.*Install the `fa` CLI for more accurate results/;

  test('a Free kit: warns, and assumes exactly the free-collection subset', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'freepinned']);
    assert.equal(r.code, 0, r.stderr);
    const out = parse.fetchKit(r.stdout);
    assert.match(out.warning, WARNING);
    assert.deepEqual(out.assumed, freeCollection('7.3.1'));
  });

  test('a Pro kit: warns, and assumes every family-style in the release', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'propinned']);
    assert.equal(r.code, 0, r.stderr);
    const out = parse.fetchKit(r.stdout);
    assert.match(out.warning, WARNING);
    assert.deepEqual(out.assumed, allFamilyStyles('6.7.2'));
  });

  // The kits service writes the release a kit serves now into the kit JS
  // (7.3.1), even for a kit set to follow 7.x. Only `fa kit show` has the setting.
  test("the version is the release the kit serves now, and says the kit's setting needs fa", async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'propinned']);
    const { version } = parse.fetchKit(r.stdout);
    assert.ok(version.startsWith('6.7.2 (the release this kit serves now'), version);
    assert.match(version, /7\.x/);
    assert.match(version, /fa kit show/);
  });

  test("an older release: that release's family-styles, never the latest's", async () => {
    requests.length = 0;
    const r = await runStub('fetch-kit.py', ['--kit-id', 'propinned']);
    assert.deepEqual(parse.fetchKit(r.stdout).assumed, allFamilyStyles('6.7.2'));
    assert.ok(!requests.some((q) => q.url.includes(latestRelease())), 'requested the latest release');
  });

  test('a current Pro kit: every family-style in its release', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'procurrent']);
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(parse.fetchKit(r.stdout).assumed, allFamilyStyles('7.3.1'));
  });

  test('a symbolic version, if a kit config ever has one, is resolved now and said to move', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'symbolic']);
    assert.equal(r.code, 0, r.stderr);
    const resolved = graphqlData('resolve', { version: '7.x' }).release.version;
    const { version, assumed } = parse.fetchKit(r.stdout);
    assert.ok(version.startsWith(`7.x (resolves to ${resolved} now`), version);
    assert.deepEqual(assumed, allFamilyStyles(resolved));
  });

  test('a kit config with no version: the latest release, never "latest"', async () => {
    requests.length = 0;
    const r = await runStub('fetch-kit.py', ['--kit-id', 'freenoversion']);
    assert.equal(r.code, 0, r.stderr);
    const { version } = parse.fetchKit(r.stdout);
    assert.ok(version.startsWith(`unknown (the kit JS names no version; ${latestRelease()} is the latest release`), version);
    assert.doesNotMatch(version, /serves now/);
    assert.ok(!requests.some((q) => /"latest"/.test(q.body)), 'sent "latest" as a version');
  });

  test("the API fails resolving the version: still prints the kit JS's details, exit 0", async () => {
    await withOverrides([{ kind: 'resolve', variables: { version: '6.7.2' }, drop: true }], async () => {
      const r = await runStub('fetch-kit.py', ['--kit-id', 'propinned']);
      assert.equal(r.code, 0, r.stderr);
      const out = parse.fetchKit(r.stdout);
      assert.equal(out.license, 'pro');
      assert.equal(out.method, 'css');
      assert.ok(out.version.startsWith("6.7.2 (couldn't check it against the API"), out.version);
      assert.match(out.warning, WARNING);
      assert.match(out.warning, /couldn't list the family-styles its license allows either/);
      assert.doesNotMatch(out.warning, /its release|assumes all/);
      assert.deepEqual(out.assumed, []);
      assert.match(r.stdout, /^Couldn't check: couldn't resolve the kit's version/m);
    });
  });

  test("the API fails listing family-styles: still prints the kit JS's details, no assumed list", async () => {
    // 7.0.0 has no recorded family-styles, so the stub answers 404.
    await withOverrides([{ kind: 'resolve', variables: { version: '7.3.1' }, response: { data: { release: { version: '7.0.0' } } } }], async () => {
      const r = await runStub('fetch-kit.py', ['--kit-id', 'procurrent']);
      assert.equal(r.code, 0, r.stderr);
      const out = parse.fetchKit(r.stdout);
      assert.equal(out.method, 'js');
      assert.deepEqual(out.assumed, []);
      assert.match(r.stdout, /^Couldn't check: couldn't list the family-styles its license allows: .*HTTP 404/m);
    });
  });

  test('a "latest" kit version: sent as 5.x, never "latest", and labelled as 5.x', async () => {
    requests.length = 0;
    const r = await runStub('fetch-kit.py', ['--kit-id', 'latestkit']);
    assert.equal(r.code, 0, r.stderr);
    const resolved = graphqlData('resolve', { version: '5.x' }).release.version;
    const out = parse.fetchKit(r.stdout);
    assert.equal(out.version, `latest (the kits service reads it as the latest 5.x release, ${resolved} now)`);
    assert.deepEqual(out.assumed, allFamilyStyles(resolved));
    assert.ok(!requests.some((q) => /"latest"/.test(q.body)), 'sent "latest" as a version');
  });

  test('no license in the kit JS: no assumed list, and not called Pro', async () => {
    const r = await runStub('fetch-kit.py', ['--kit-id', 'nolicense']);
    assert.equal(r.code, 0, r.stderr);
    const out = parse.fetchKit(r.stdout);
    assert.equal(out.license, 'unknown');
    assert.deepEqual(out.assumed, []);
    assert.doesNotMatch(r.stdout, /Pro allows/);
    assert.match(r.stdout, /^Couldn't check: the kit JS gives license 'unknown'/m);
  });

  for (const [kitId, what] of [['notobject', "a config that isn't an object"], ['badutf8', 'a config that isn\'t UTF-8']]) {
    test(`${what}: exit 1 with an error, no traceback`, async () => {
      const r = await runStub('fetch-kit.py', ['--kit-id', kitId]);
      assert.equal(r.code, 1);
      assert.match(r.stderr, /^Error: could not parse kit config/m);
      assert.doesNotMatch(r.stderr, /Traceback/);
    });
  }

  test('no --kit-id: exit 2', async () => {
    const r = await runStub('fetch-kit.py', []);
    assert.equal(r.code, 2);
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

  test('fa search --kit-token: kit results with their family-styles', async () => {
    const r = await summarize(readFileSync(join(fixtures, 'fa-search-kit.json'), 'utf8'));
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout.trim(), 'mug-saucer | in kit | classic/solid');
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

  test('resolve-version.py resolves 7.x to a 7 release', async () => {
    const r = await run('resolve-version.py', ['--version', '7.x']);
    assert.equal(r.code, 0, r.stderr);
    assert.match(JSON.parse(r.stdout).data.release.version, /^7\.\d+\.\d+$/);
  });

  test('search.py returns results for cup', async () => {
    const version = parse.latestVersion((await run('latest-version.py')).stdout);
    const r = await run('search.py', ['--version', version, '--query', 'cup']);
    assert.equal(r.code, 0, r.stderr);
    assert.ok(parse.search(r.stdout).length > 0, r.stdout);
  });
});
