import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { deepLinkFor } from '../src/features/notifications/notificationUtils.js'

describe('where a notification click goes', () => {
  it('opens the transaction a large-transaction alert is about', () => {
    const n = { type: 'LARGE_TRANSACTION', referenceType: 'TRANSACTION', referenceId: '9f1c-42' }
    assert.equal(deepLinkFor(n), '/transactions?txn=9f1c-42')
  })

  it('opens the transactions list when the alert has no id', () => {
    assert.equal(deepLinkFor({ type: 'TRANSACTION_ALERT', referenceType: 'TRANSACTION', referenceId: null }), '/transactions')
  })

  it('escapes the id in the URL', () => {
    assert.equal(deepLinkFor({ referenceType: 'TRANSACTION', referenceId: 'a&b=1' }), '/transactions?txn=a%26b%3D1')
  })

  it('keeps the budget, family, subscription and goal links', () => {
    assert.equal(deepLinkFor({ referenceType: 'BUDGET', params: { periodEnd: '2026-11-30' } }), '/budgets?month=2026-11')
    assert.equal(deepLinkFor({ referenceType: 'BUDGET' }), '/budgets')
    assert.equal(deepLinkFor({ type: 'FAMILY' }), '/family')
    assert.equal(deepLinkFor({ referenceType: 'SUBSCRIPTION', referenceId: '3' }), '/subscriptions')
    assert.equal(deepLinkFor({ referenceType: 'GOAL', referenceId: '3' }), '/goals')
  })

  it('only marks read when there is nowhere to go', () => {
    assert.equal(deepLinkFor({ type: 'SYSTEM' }), null)
  })
})
