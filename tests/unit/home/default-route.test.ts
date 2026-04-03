import { describe, expect, it } from 'vitest'
import {
  AUTHENTICATED_HOME_PATHNAME,
  buildAuthenticatedHomeTarget,
} from '@/lib/home/default-route'

describe('authenticated home default route', () => {
  it('uses /home as the only authenticated default pathname', () => {
    expect(AUTHENTICATED_HOME_PATHNAME).toBe('/workspace')
    expect(buildAuthenticatedHomeTarget()).toEqual({
      pathname: '/workspace',
    })
  })
})
