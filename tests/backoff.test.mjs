import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { retryDelayMs } from '../src/lib/backoff.ts'

describe('Offline sync retry backoff', () => {
  it('starts at the base delay for attempt 0', () => {
    assert.strictEqual(retryDelayMs(0), 2000)
  })

  it('doubles the delay on each failed attempt (2s, 4s, 8s, 16s...)', () => {
    assert.strictEqual(retryDelayMs(1), 4000)
    assert.strictEqual(retryDelayMs(2), 8000)
    assert.strictEqual(retryDelayMs(3), 16000)
    assert.strictEqual(retryDelayMs(4), 32000)
  })

  it('caps the delay at 60s (maxMs)', () => {
    assert.strictEqual(retryDelayMs(5), 60000) // 64s uncapped -> capped
    assert.strictEqual(retryDelayMs(10), 60000)
    assert.strictEqual(retryDelayMs(100), 60000)
  })

  it('treats negative attempts as attempt 0', () => {
    assert.strictEqual(retryDelayMs(-1), 2000)
    assert.strictEqual(retryDelayMs(-7), 2000)
  })

  it('floors fractional attempts', () => {
    assert.strictEqual(retryDelayMs(2.9), 8000) // floor -> 2 -> 8s
  })

  it('honours custom base and cap', () => {
    assert.strictEqual(retryDelayMs(0, 500, 4000), 500)
    assert.strictEqual(retryDelayMs(1, 500, 4000), 1000)
    assert.strictEqual(retryDelayMs(4, 500, 4000), 4000)
  })

  it('never returns 0 or negative for sane inputs', () => {
    for (let a = 0; a <= 20; a++) {
      const d = retryDelayMs(a)
      assert.ok(d > 0, `attempt ${a} must have a positive delay`)
      assert.ok(d <= 60000, `attempt ${a} must not exceed the 60s cap`)
    }
  })
})
