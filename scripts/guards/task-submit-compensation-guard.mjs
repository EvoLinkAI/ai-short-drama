#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'
import { pathToFileURL } from 'url'

const root = process.cwd()
const apiDir = path.join(root, 'src', 'app', 'api')
const CREATE_PATTERN = /\.\s*create\s*\(/
const SUBMIT_TASK_PATTERN = /\bsubmitTask\s*\(/
const ROLLBACK_PATTERN = /rollback|compensat/i

function fail(title, details = []) {
  process.stderr.write(`\n[task-submit-compensation-guard] ${title}\n`)
  for (const detail of details) {
    process.stderr.write(`  - ${detail}\n`)
  }
  process.exit(1)
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === '.next' || entry.name === 'node_modules') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, out)
      continue
    }
    if (entry.name === 'route.ts') out.push(fullPath)
  }
  return out
}

function toRel(fullPath) {
  return path.relative(root, fullPath).split(path.sep).join('/')
}

export function inspectTaskSubmitCompensation(relPath, content) {
  if (!CREATE_PATTERN.test(content)) return []
  if (!SUBMIT_TASK_PATTERN.test(content)) return []
  if (ROLLBACK_PATTERN.test(content)) return []
  return [
    `${relPath} creates data before submitTask without explicit rollback/compensation marker`,
  ]
}

export function findTaskSubmitCompensationViolations(scanRoot = root) {
  const routesRoot = path.join(scanRoot, 'src', 'app', 'api')
  return walk(routesRoot)
    .map((fullPath) => {
      const relPath = path.relative(scanRoot, fullPath).split(path.sep).join('/')
      const content = fs.readFileSync(fullPath, 'utf8')
      return inspectTaskSubmitCompensation(relPath, content)
    })
    .flat()
}

export function main() {
  if (!fs.existsSync(apiDir)) {
    fail('Missing src/app/api directory')
  }

  const routeFiles = walk(apiDir)
  const violations = routeFiles
    .map((fullPath) => {
      const relPath = toRel(fullPath)
      const content = fs.readFileSync(fullPath, 'utf8')
      return inspectTaskSubmitCompensation(relPath, content)
    })
    .flat()

  if (violations.length > 0) {
    fail('Found create+submitTask routes without compensation marker', violations)
  }

  process.stdout.write(`[task-submit-compensation-guard] OK routes=${routeFiles.length}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
