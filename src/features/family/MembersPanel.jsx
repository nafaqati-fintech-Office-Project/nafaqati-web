import { useState } from 'react'
import { canRemoveMember, memberTag } from './familyUtils.js'
import { formatDate } from '../../utils/format.js'
import './MembersPanel.css'

const TONES = { OWNER: 'blue', ADMIN: 'purple', MEMBER: 'green' }

// Members of the selected family. The API returns user ids, not names: the caller is "You", others get a short tag.
export default function MembersPanel({ t, members, loading, error, retry, myUserId, myRole, perms, busy, onRole, onRemove, onTransfer, onInvite }) {
  const [open, setOpen] = useState(null) // membership id whose actions are shown

  return (
    <aside className="family-panel side-panel" aria-label={t.membersPanel.title}>
      <div className="panel-head">
        <h2>{t.membersPanel.title}</h2>
        {perms.invite && (
          <button type="button" className="text-btn" onClick={onInvite}>
            {t.invite}
          </button>
        )}
      </div>
      {loading ? (
        <div className="member-list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="sk fam-member-sk" />
          ))}
        </div>
      ) : error ? (
        <div className="dc-state" role="alert">
          <p>{t.errors.generic}</p>
          <button type="button" className="dc-retry" onClick={retry}>
            {t.retry}
          </button>
        </div>
      ) : (
        <ul className="member-list">
          {members.map((m) => {
            const mine = m.userId === myUserId
            const removable = canRemoveMember(myRole, m, myUserId)
            const roleChangeable = perms.changeRole && m.role !== 'OWNER'
            const hasActions = removable || roleChangeable || (perms.transfer && m.role !== 'OWNER')
            return (
              <li key={m.id} className="member-row fam-member-row">
                <div className={`avatar avatar-${TONES[m.role]}`} aria-hidden="true">
                  {m.role.charAt(0)}
                </div>
                <div className="member-meta">
                  <strong>{mine ? t.you : t.memberTag(memberTag(m.userId))}</strong>
                  <span>
                    {t.roles[m.role]} · {t.membersPanel.joined(formatDate(m.joinedAt))}
                  </span>
                </div>
                {hasActions && (
                  <button type="button" className="text-btn" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? null : m.id)}>
                    ⋯<span className="fam-sr">{t.membersPanel.role}</span>
                  </button>
                )}
                {open === m.id && (
                  <div className="fam-member-actions">
                    {roleChangeable && (
                      <button type="button" className="btn btn-outline" disabled={busy} onClick={() => onRole(m, m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}>
                        {m.role === 'ADMIN' ? t.membersPanel.makeMember : t.membersPanel.makeAdmin}
                      </button>
                    )}
                    {perms.transfer && m.role !== 'OWNER' && (
                      <button type="button" className="btn btn-outline" disabled={busy} onClick={() => onTransfer(m)}>
                        {t.membersPanel.makeOwner}
                      </button>
                    )}
                    {removable && (
                      <button type="button" className="btn btn-danger-outline" disabled={busy} onClick={() => onRemove(m)}>
                        {t.membersPanel.remove}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <p className="fam-note">{t.membersPanel.namesNote}</p>
    </aside>
  )
}
