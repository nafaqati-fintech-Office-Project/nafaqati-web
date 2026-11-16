import test from 'node:test'
import assert from 'node:assert/strict'
import { CONFIRM_WORD, deletionDate, isConfirmed, openRequest } from '../src/utils/accountDeletion.js'

test('the confirmation word is required, ignoring case and surrounding spaces', () => {
  assert.equal(isConfirmed(CONFIRM_WORD), true)
  assert.equal(isConfirmed('  delete '), true)
  assert.equal(isConfirmed('DELET'), false)
  assert.equal(isConfirmed(''), false)
  assert.equal(isConfirmed(undefined), false)
})

test('only a REQUESTED request can still be cancelled', () => {
  const list = [
    { id: 'a', status: 'CANCELLED' },
    { id: 'b', status: 'REQUESTED' },
  ]
  assert.equal(openRequest(list)?.id, 'b')
  assert.equal(openRequest([{ id: 'c', status: 'COMPLETED' }]), null)
  assert.equal(openRequest([]), null)
  assert.equal(openRequest(null), null)
})

test('the deletion date is shown as a day, month and year', () => {
  assert.equal(deletionDate('2026-12-12T10:00:00Z', 'en-GB'), '12 December 2026')
  assert.equal(deletionDate('not a date'), 'not a date')
})
