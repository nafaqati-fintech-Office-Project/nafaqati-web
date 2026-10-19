import { useState } from 'react'
import { Copy } from 'lucide-react'
import { formatDate } from '../../utils/format.js'
import { memberTag } from './familyUtils.js'
import './InvitationsPanel.css'

// Invitations for the caller (accept / decline), the family's pending invitations (revoke), and the caller's own user id,
// which is what somebody needs to invite them (invitations are by user id; the backend has no e-mail invitations).
export default function InvitationsPanel({ t, mine, familyInvites, perms, myRole, myUserId, busy, onAccept, onDecline, onRevoke }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(myUserId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable: the id is selectable text */
    }
  }
  const pendingMine = (mine ?? []).filter((i) => i.status === 'PENDING')
  const pendingFamily = (familyInvites ?? []).filter((i) => i.status === 'PENDING')
  const canRevoke = (inv) => perms.invite && (myRole === 'OWNER' || inv.role === 'MEMBER')

  return (
    <section className="family-panel fam-invites" aria-label={t.invitations.familyTitle}>
      {pendingMine.length > 0 && (
        <div className="fam-invite-block" role="region" aria-label={t.invitations.mineTitle}>
          <h3>{t.invitations.mineTitle}</h3>
          <ul>
            {pendingMine.map((inv) => (
              <li key={inv.id}>
                <span>
                  <strong>{t.invitations.mineBody(inv.familyName, t.roles[inv.role])}</strong>
                  <small>{t.invitations.expires(formatDate(inv.expiresAt))}</small>
                </span>
                <span className="fam-invite-actions">
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onAccept(inv)}>
                    {t.invitations.accept}
                  </button>
                  <button type="button" className="btn btn-outline" disabled={busy} onClick={() => onDecline(inv)}>
                    {t.invitations.decline}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {perms.invite && (
        <div className="fam-invite-block">
          <h3>{t.invitations.familyTitle}</h3>
          {pendingFamily.length === 0 ? (
            <p className="fam-empty">{t.invitations.empty}</p>
          ) : (
            <ul>
              {pendingFamily.map((inv) => (
                <li key={inv.id}>
                  <span>
                    <strong>{t.invitations.invited(memberTag(inv.invitedUserId), t.roles[inv.role])}</strong>
                    <small>{t.invitations.expires(formatDate(inv.expiresAt))}</small>
                  </span>
                  {canRevoke(inv) && (
                    <button type="button" className="btn btn-danger-outline" disabled={busy} onClick={() => onRevoke(inv)}>
                      {t.invitations.revoke}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="fam-myid">
        <span>
          <strong>{t.invitations.yourId}</strong>
          <small>{t.invitations.yourIdHint}</small>
          <code dir="ltr">{myUserId}</code>
        </span>
        <button type="button" className="btn btn-outline" onClick={copy}>
          <Copy size={14} aria-hidden="true" /> {copied ? t.invitations.copied : t.invitations.copy}
        </button>
      </div>
    </section>
  )
}
