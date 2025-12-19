import { describe, it, expect } from 'vitest'

describe('logger', () => {
  it('should export logger object with all methods', async () => {
    const { logger } = await import('../logger')
    
    expect(logger).toBeDefined()
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.log).toBe('function')
  })

  it('should have default export', async () => {
    const loggerDefault = await import('../logger')
    expect(loggerDefault.default).toBeDefined()
  })
})
