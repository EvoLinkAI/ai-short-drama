import packageJson from '../../package.json'

const GITHUB_REPOSITORY_VALUE = ''

const packageVersion = packageJson.version
if (typeof packageVersion !== 'string' || packageVersion.trim().length === 0) {
  throw new Error('Invalid package.json version')
}

export const APP_VERSION = packageVersion.trim()

export const GITHUB_REPOSITORY = GITHUB_REPOSITORY_VALUE
