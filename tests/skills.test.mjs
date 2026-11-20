// Checks every skill's SKILL.md frontmatter against the rules that keep it
// installable on every agent platform and loadable at the right time.
//
// Run with:  npm test
// The validator test needs the `skills-ref` command (see tests/requirements.txt).
// Set SKILLS_REF to use a different command, e.g. SKILLS_REF="uvx --from ... skills-ref".

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const skillDirs = readdirSync(join(repoRoot, 'plugins'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((plugin) => {
    const skillsRoot = join(repoRoot, 'plugins', plugin.name, 'skills');
    if (!existsSync(skillsRoot)) return [];
    return readdirSync(skillsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(skillsRoot, d.name, 'SKILL.md')))
      .map((d) => join(skillsRoot, d.name));
  })
  .sort();

// The lowest common denominator: the frontmatter keys every agent platform
// accepts. A key outside this list results in rejection by one or more
// platforms (claude.ai upload, the Skills API, the Agent Skills spec
// validator), even where another platform accepts or ignores it.
//
// `disable-model-invocation` is not here on purpose. Claude Code respects it,
// but claude.ai treats it as a hard error and the spec validator rejects it.
const ALLOWED_KEYS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

// The description length limit used by most agent tools (Claude Code permits
// 1,536). The description is the main thing an agent reads to decide whether
// to load a skill. Text past a tool's limit is truncated, so terms placed
// there don't count toward that decision. Write the description for reliable
// loading using only terms that fit strictly within this limit.
const MAX_DESCRIPTION_LENGTH = 1024;

function frontmatter(skillDir) {
  const content = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, `${skillDir}/SKILL.md must start with a --- frontmatter block`);
  const data = parseYaml(match[1]);
  assert.equal(typeof data, 'object', `${skillDir}/SKILL.md frontmatter must be a YAML mapping`);
  return data;
}

const name = (skillDir) => skillDir.split('/').pop();

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const path = join(dir, d.name);
    if (d.isDirectory()) return markdownFiles(path);
    return d.name.endsWith('.md') ? [path] : [];
  });
}

test('skills are found', () => {
  assert.ok(skillDirs.length > 0, 'no plugins/*/skills/*/SKILL.md files found');
});

for (const skillDir of skillDirs) {
  test(`${name(skillDir)}: frontmatter keys are allowed`, () => {
    const extra = Object.keys(frontmatter(skillDir)).filter((k) => !ALLOWED_KEYS.has(k)).sort();
    assert.deepEqual(
      extra,
      [],
      `${name(skillDir)}/SKILL.md has frontmatter keys that one or more agent platforms reject: ` +
        `${extra.join(', ')}. Allowed: ${[...ALLOWED_KEYS].join(', ')}`,
    );
  });

  test(`${name(skillDir)}: description fits the length limit`, () => {
    const description = frontmatter(skillDir).description ?? '';
    assert.ok(
      description.length <= MAX_DESCRIPTION_LENGTH,
      `${name(skillDir)} description is ${description.length} characters; the limit is ` +
        `${MAX_DESCRIPTION_LENGTH}. Terms past the limit are truncated and don't help the agent ` +
        `decide when to load the skill.`,
    );
  });

  // Every file a skill's Markdown points to must exist: `references/…` and
  // `scripts/…` paths (relative to the skill directory) and relative Markdown
  // links (relative to the file that contains them).
  test(`${name(skillDir)}: referenced files exist`, () => {
    const missing = [];
    for (const file of markdownFiles(skillDir)) {
      const text = readFileSync(file, 'utf8');
      for (const [ref] of text.matchAll(/\b(?:references|scripts)\/[\w.-]+\.(?:md|py|sh|json)\b/g)) {
        if (!existsSync(join(skillDir, ref))) missing.push(`${relative(skillDir, file)}: ${ref}`);
      }
      for (const [, link] of text.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
        if (/^[a-z]+:/i.test(link)) continue;
        if (!existsSync(join(dirname(file), link))) missing.push(`${relative(skillDir, file)}: (${link})`);
      }
    }
    assert.deepEqual(missing, [], `${name(skillDir)} points to files that don't exist:\n  ${missing.join('\n  ')}`);
  });

  // skills-ref is the Agent Skills reference validator:
  // https://github.com/agentskills/agentskills/blob/main/skills-ref/src/skills_ref/validator.py
  test(`${name(skillDir)}: passes the Agent Skills validator`, () => {
    const [cmd, ...args] = (process.env.SKILLS_REF || 'skills-ref').split(/\s+/);
    const result = spawnSync(cmd, [...args, 'validate', skillDir], { encoding: 'utf8' });
    if (result.error?.code === 'ENOENT') {
      assert.fail(`'${cmd}' not found. Install it with: pip install -r tests/requirements.txt`);
    }
    assert.equal(result.status, 0, `${name(skillDir)}: ${result.stderr.trim()}`);
  });
}
