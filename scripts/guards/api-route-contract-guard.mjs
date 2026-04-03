#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'
import { pathToFileURL } from 'url'

const root = process.cwd()
const apiDir = path.join(root, 'src', 'app', 'api')

export const API_HANDLER_ALLOWLIST = new Set([
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/files/[...path]/route.ts',
  'src/app/api/system/boot-id/route.ts',
])

export const PUBLIC_ROUTE_ALLOWLIST = new Set([
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/cos/image/route.ts',
  'src/app/api/files/[...path]/route.ts',
  'src/app/api/storage/sign/route.ts',
  'src/app/api/system/boot-id/route.ts',
])

const AUTH_CALL_PATTERNS = [
  /\brequireUserAuth\s*\(/,
  /\brequireProjectAuth\s*\(/,
  /\brequireProjectAuthLight\s*\(/,
]

function fail(title, details = []) {
  process.stderr.write(`\n[api-route-contract-guard] ${title}\n`)
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

function hasApiHandlerWrapper(content) {
  return /\bapiHandler\s*\(/.test(content)
}

function hasRequiredAuth(content) {
  return AUTH_CALL_PATTERNS.some((pattern) => pattern.test(content))
}

export function inspectRouteContract(relPath, content) {
  const violations = []

  if (!API_HANDLER_ALLOWLIST.has(relPath) && !hasApiHandlerWrapper(content)) {
    violations.push(`${relPath} missing apiHandler wrapper`)
  }

  if (!PUBLIC_ROUTE_ALLOWLIST.has(relPath) && !hasRequiredAuth(content)) {
    violations.push(`${relPath} missing requireUserAuth/requireProjectAuth/requireProjectAuthLight`)
  }

  return violations
}

export function findApiRouteContractViolations(scanRoot = root) {
  const routesRoot = path.join(scanRoot, 'src', 'app', 'api')
  return walk(routesRoot)
    .map((fullPath) => {
      const relPath = path.relative(scanRoot, fullPath).split(path.sep).join('/')
      const content = fs.readFileSync(fullPath, 'utf8')
      return inspectRouteContract(relPath, content)
    })
    .flat()
}

export function main() {
  if (!fs.existsSync(apiDir)) {
    fail('Missing src/app/api directory')
  }

  const violations = walk(apiDir)
    .map((fullPath) => {
      const relPath = toRel(fullPath)
      const content = fs.readFileSync(fullPath, 'utf8')
      return inspectRouteContract(relPath, content)
    })
    .flat()

  if (violations.length > 0) {
    fail('Found API route contract violations', violations)
  }

  process.stdout.write(
    `[api-route-contract-guard] OK routes=${walk(apiDir).length} public=${PUBLIC_ROUTE_ALLOWLIST.size} apiHandlerExceptions=${API_HANDLER_ALLOWLIST.size}\n`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
