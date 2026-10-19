import test from 'node:test'
import assert from 'node:assert/strict'
import {
  available,
  canRemoveMember,
  chartBars,
  errorKey,
  hasSpending,
  invitableRoles,
  isUuid,
  memberTag,
  money,
  monthShort,
  permissionsFor,
  recentMonths,
} from '../src/features/family/familyUtils.js'

const err = (status, code) => ({ response: status ? { status } : undefined, code })

test('permissionsFor: OWNER, ADMIN, MEMBER', () => {
  const owner = permissionsFor('OWNER')
  assert.deepEqual([owner.update, owner.delete, owner.invite, owner.inviteAdmin, owner.changeRole, owner.transfer, owner.leave], [true, true, true, true, true, true, false])
  const admin = permissionsFor('ADMIN')
  assert.deepEqual([admin.update, admin.delete, admin.invite, admin.inviteAdmin, admin.changeRole, admin.transfer, admin.leave, admin.manageBudgets], [true, false, true, false, false, false, true, true])
  const member = permissionsFor('MEMBER')
  assert.deepEqual([member.update, member.invite, member.manageBudgets, member.remove, member.leave], [false, false, false, false, true])
  assert.equal(permissionsFor(null).leave, false)
})

test('canRemoveMember: owner removes admin/member, admin only member, never self or owner', () => {
  const me = 'u1'
  assert.equal(canRemoveMember('OWNER', { userId: 'u2', role: 'ADMIN' }, me), true)
  assert.equal(canRemoveMember('OWNER', { userId: 'u2', role: 'MEMBER' }, me), true)
  assert.equal(canRemoveMember('ADMIN', { userId: 'u2', role: 'MEMBER' }, me), true)
  assert.equal(canRemoveMember('ADMIN', { userId: 'u2', role: 'ADMIN' }, me), false)
  assert.equal(canRemoveMember('ADMIN', { userId: 'u2', role: 'OWNER' }, me), false)
  assert.equal(canRemoveMember('OWNER', { userId: me, role: 'MEMBER' }, me), false)
  assert.equal(canRemoveMember('MEMBER', { userId: 'u2', role: 'MEMBER' }, me), false)
})

test('invitableRoles: owner MEMBER+ADMIN, admin MEMBER, member none', () => {
  assert.deepEqual(invitableRoles('OWNER'), ['MEMBER', 'ADMIN'])
  assert.deepEqual(invitableRoles('ADMIN'), ['MEMBER'])
  assert.deepEqual(invitableRoles('MEMBER'), [])
})

test('isUuid and memberTag', () => {
  assert.equal(isUuid('5b0c6e3e-2f4b-4d0e-8a3a-9d2f5f7c1a10'), true)
  assert.equal(isUuid(' 5b0c6e3e-2f4b-4d0e-8a3a-9d2f5f7c1a10 '), true)
  assert.equal(isUuid('not-a-uuid'), false)
  assert.equal(isUuid(''), false)
  assert.equal(memberTag('5b0c6e3e-2f4b-4d0e-8a3a-9d2f5f7c1a10'), '…1a10')
})

test('money: code + 2 decimals', () => {
  assert.equal(money(2000, 'PKR'), 'PKR 2,000.00')
  assert.equal(money('1210.5', 'SAR'), 'SAR 1,210.50')
})

test('months: short names, last 12', () => {
  assert.equal(monthShort('2026-05', 'en'), 'May')
  const months = recentMonths('2026-10')
  assert.equal(months.length, 12)
  assert.deepEqual([months[0], months[1], months[11]], ['2026-10', '2026-09', '2025-11'])
})

test('chartBars: heights relative to the real maximum, nothing invented', () => {
  const bars = chartBars([{ month: '2026-08', total: 0 }, { month: '2026-09', total: 500 }, { month: '2026-10', total: 2000 }])
  assert.deepEqual(bars.map((b) => b.height), [0, 25, 100])
  assert.deepEqual(chartBars([{ month: '2026-10', total: 0 }]).map((b) => b.height), [0])
  assert.equal(hasSpending([{ total: 0 }, { total: '0.0000' }]), false)
  assert.equal(hasSpending([{ total: 0 }, { total: 3 }]), true)
})

test('available: NOT_AVAILABLE metrics are never numbers', () => {
  assert.equal(available({ state: 'NOT_AVAILABLE', reason: 'EXPENSE_DATA_ONLY', value: null }), false)
  assert.equal(available({ state: 'AVAILABLE', value: 5 }), true)
  assert.equal(available(undefined), false)
})

test('errorKey: friendly keys for every status the backend uses', () => {
  assert.equal(errorKey(err(403), 'family'), 'forbidden')
  assert.equal(errorKey(err(404), 'family'), 'notFound')
  assert.equal(errorKey(err(404), 'invite'), 'userOrFamilyNotFound')
  assert.equal(errorKey(err(409), 'share'), 'alreadyShared')
  assert.equal(errorKey(err(409), 'invite'), 'alreadyInvited')
  assert.equal(errorKey(err(409), 'family'), 'conflict')
  assert.equal(errorKey(err(400), 'invite'), 'inviteInvalid')
  assert.equal(errorKey(err(429), 'family'), 'rateLimited')
  assert.equal(errorKey(err(503), 'family'), 'unavailable')
  assert.equal(errorKey(err(401), 'family'), 'session')
  assert.equal(errorKey(err(500), 'family'), 'generic')
  assert.equal(errorKey(err(0), 'family'), 'network')
  assert.equal(errorKey(err(0, 'ECONNABORTED'), 'family'), 'slow')
})
