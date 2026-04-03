#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const RULES = [
  {
    name: 'api',
    source: /^src\/app\/api\//,
    tests: [/^tests\/integration\/api\/contract\//, /^tests\/system\//, /^tests\/regression\//],
    message: 'changing src/app/api/** requires a matching contract, system, or regression test change',
  },
  {
    name: 'worker',
    source: /^src\/lib\/workers\//,
    tests: [/^tests\/unit\/worker\//, /^tests\/system\//, /^tests\/regression\//],
    message: 'changing src/lib/workers/** requires a matching worker, system, or regression test change',
  },
  {
    name: 'task',
    source: /^src\/lib\/task\//,
    tests: [/^tests\/unit\/task\//, /^tests\/system\//, /^tests\/regression\//],
    message: 'changing src/lib/task/** requires a matching task, system, or regression test change',
  },
  {
    name: 'media',
    source: /^src\/lib\/media\//,
    tests: [/^tests\/unit\//, /^tests\/system\//, /^tests\/regression\//],
    message: 'changing src/lib/media/** requires a matching unit, system, or regression test change',
  },
  {
    name: 'provider',
    source: /^src\/lib\/(generator-api|generators|model-gateway|lipsync|providers)\//,
    tests: [/^tests\/unit\/(providers|model-gateway|llm)\//, /^tests\/integration\/provider\//, /^tests\/system\//, /^tests\/regression\//],
    message: 'changing provider/gateway code requires provider contract, system, or regression test change',
  },
]

function normalizeChangedFiles(rawFiles) {
  return rawFiles
    .flatMap((item) => item.split(/[\n,]/))
    .map((item) => item.trim())
    .filter(Boolean)
}

function readGitChangedFiles() {
  try {
    const output = execSync('git diff --name-only --cached', {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return normalizeChangedFiles([output])
  } catch {
    return []
  }
}

export function inspectChangedFiles(changedFiles) {
  const changed = normalizeChangedFiles(changedFiles)
  const changedTests = changed.filter((file) => file.startsWith('tests/'))
  const violations = []

  for (const rule of RULES) {
    const impactedSources = changed.filter((file) => rule.source.test(file))
    if (impactedSources.length === 0) continue
    const hasMatchingTestChange = changedTests.some((file) => rule.tests.some((pattern) => pattern.test(file)))
    if (!hasMatchingTestChange) {
      violations.push(`${rule.name}: ${rule.message}; sources=${impactedSources.join(',')}`)
    }
  }

  return violations
}

function fail(violations) {
  console.error('\n[changed-file-test-impact-guard] Missing matching test changes')
  for (const violation of violations) {
    console.error(`  - ${violation}`)
  }
  process.exit(1)
}

function runCli() {
  const inputFiles = process.argv.slice(2)
  const changedFiles = inputFiles.length > 0
    ? normalizeChangedFiles(inputFiles)
    : normalizeChangedFiles([process.env.TEST_IMPACT_CHANGED_FILES || '', ...readGitChangedFiles()])

  if (changedFiles.length === 0) {
    console.log('[changed-file-test-impact-guard] SKIP no changed files detected')
    process.exit(0)
  }

  const violations = inspectChangedFiles(changedFiles)
  if (violations.length > 0) {
    fail(violations)
  }

  console.log(`[changed-file-test-impact-guard] OK files=${changedFiles.length}`)
}

const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : null
if (entryHref && import.meta.url === entryHref) {
  runCli()
}
