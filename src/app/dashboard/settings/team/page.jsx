'use client'

import { useEffect, useRef, useState } from 'react'
import Inputfield from '@/components/input'
import GradientAvatar, { seedFor } from '@/components/gradientavatar'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import { MoreIcon } from '@/components/linktablehelpers'
import { toast } from '@/components/toast'

// ─── Organisation → Team ───
// Node 87:6026, plus the invite flow.
//
// Members list, then an Invite members button that opens a composer: one row
// per person with an email and a role, a plus to add more, Cancel on the left
// and Send on the right. Pending invites appear as their own section with a
// cancel option.

const ROLES = [
  { id: 'MEMBER', label: 'Member' },
  { id: 'ADMIN', label: 'Admin' },
]

function roleLabel(role) {
  if (role === 'OWNER') return 'Owner'
  if (role === 'ADMIN') return 'Admin'
  return 'Member'
}

function PlusIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M8 3.5v9M3.5 8h9'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M4.5 4.5l7 7M11.5 4.5l-7 7'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M4 6.5 8 10.5l4-4'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function Spinner({ size = 13 }) {
  return (
    <svg
      className='btn-spinner'
      width={size}
      height={size}
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='8'
        cy='8'
        r='6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeDasharray='28'
        strokeDashoffset='9'
        opacity='0.9'
      />
    </svg>
  )
}

// The two-column header. Shared by both lists so the Role column lines up
// between members and pending invites.
const COL_ROLE = '111px'

function ListHeader({ right = 'Role' }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <p
        className='para-xs'
        style={{
          color: 'var(--text-soft)',
          margin: 0,
          flex: '1 0 0',
          minWidth: 0,
        }}
      >
        User
      </p>
      <p
        className='para-xs'
        style={{
          color: 'var(--text-soft)',
          margin: 0,
          width: COL_ROLE,
          flexShrink: 0,
        }}
      >
        {right}
      </p>
    </div>
  )
}

function MemberRow({ member }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flex: '1 0 0',
          minWidth: 0,
          padding: '4px 0',
        }}
      >
        {member.image ? (
          <img
            src={member.image}
            alt=''
            width={24}
            height={24}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-full)',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <GradientAvatar
            seed={seedFor({
              seed: member.avatarSeed,
              id: member.userId,
              name: member.name,
            })}
            name={member.name || member.email}
            size={24}
          />
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0,
          }}
        >
          <p
            className='para-xs'
            style={{
              color: 'var(--text-strong)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {member.name || member.email}
            {member.isYou ? (
              <span
                style={{
                  fontSize: '8px',
                  letterSpacing: '0.16px',
                  color: 'var(--text-soft)',
                }}
              >
                {' (You)'}
              </span>
            ) : null}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1,
              letterSpacing: '0.2px',
              color: 'var(--text-soft)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {member.email}
          </p>
        </div>
      </div>

      <div style={{ width: COL_ROLE, flexShrink: 0, padding: '4px 0' }}>
        <p
          className='para-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {roleLabel(member.role)}
        </p>
      </div>
    </div>
  )
}

function InviteRow({ invite, canManage, onCancel }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flex: '1 0 0',
          minWidth: 0,
          padding: '4px 0',
        }}
      >
        {/* A gradient from the email, since there's no account yet. It'll match
            the one they get on joining, because the seed is the same input. */}
        <span
          style={{
            opacity: invite.expired ? 0.45 : 1,
            display: 'flex',
            flexShrink: 0,
          }}
        >
          <GradientAvatar
            seed={seedFor({ id: invite.email })}
            name={invite.email}
            size={24}
          />
        </span>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0,
          }}
        >
          <p
            className='para-xs'
            style={{
              color: invite.expired ? 'var(--text-soft)' : 'var(--text-strong)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {invite.email}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1,
              letterSpacing: '0.2px',
              color: 'var(--text-soft)',
            }}
          >
            {invite.expired ? 'Expired' : 'Invite sent'}
          </p>
        </div>
      </div>

      <div
        style={{
          width: COL_ROLE,
          flexShrink: 0,
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p
          className='para-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {roleLabel(invite.role)}
        </p>

        {canManage ? (
          <Dropdown
            align='right'
            trigger={
              <span style={{ display: 'flex' }}>
                <MoreIcon />
              </span>
            }
          >
            <DropdownMenu>
              <DropdownOption danger onClick={() => onCancel(invite)}>
                Cancel invite
              </DropdownOption>
            </DropdownMenu>
          </Dropdown>
        ) : null}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [data, setData] = useState(null)
  const [composing, setComposing] = useState(false)
  const [rows, setRows] = useState([{ email: '', role: 'MEMBER' }])
  const [sending, setSending] = useState(false)
  const [errorIndex, setErrorIndex] = useState(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function load() {
    return fetch('/api/org/members')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setData(d))
      .catch((err) => console.error('[Team]', err))
  }

  useEffect(() => {
    load()
  }, [])

  const canManage = data?.role === 'OWNER' || data?.role === 'ADMIN'

  function addRow() {
    setRows((r) => [...r, { email: '', role: 'MEMBER' }])
  }

  function removeRow(i) {
    setRows((r) => (r.length === 1 ? r : r.filter((_, idx) => idx !== i)))
  }

  function updateRow(i, patch) {
    setRows((r) =>
      r.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    )
    setErrorIndex(null)
  }

  function closeComposer() {
    setComposing(false)
    setRows([{ email: '', role: 'MEMBER' }])
    setErrorIndex(null)
  }

  async function handleSend() {
    if (sending) return
    const filled = rows.filter((r) => r.email.trim())
    if (filled.length === 0) {
      setErrorIndex(0)
      toast.error('Add an email address')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/org/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invites: filled }),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok) {
        if (typeof result?.index === 'number') setErrorIndex(result.index)
        toast.error(result?.error || `Couldn't send (${res.status})`)
        return
      }

      const n = result.invites.length
      toast(
        result.skipped
          ? `${n} ${n === 1 ? 'invite' : 'invites'} sent, ${result.skipped} already ${result.skipped === 1 ? 'a member' : 'members'}`
          : `${n} ${n === 1 ? 'invite' : 'invites'} sent`
      )
      closeComposer()
      await load()
    } catch (err) {
      console.error('[Team]', err)
      toast.error("Couldn't send the invites")
    } finally {
      setSending(false)
    }
  }

  async function handleCancelInvite(invite) {
    // Optimistic, then reconciled. The row disappearing immediately is the
    // whole point of a cancel button.
    setData((d) => ({
      ...d,
      invites: d.invites.filter((i) => i.id !== invite.id),
    }))
    try {
      const res = await fetch(`/api/org/invites/${invite.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || "Couldn't cancel the invite")
        await load()
        return
      }
      toast(`Invite to ${invite.email} cancelled`)
    } catch (err) {
      console.error('[Team]', err)
      toast.error("Couldn't cancel the invite")
      await load()
    }
  }

  if (!data) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          width: '100%',
        }}
      >
        <div
          className='skeleton-pulse'
          style={{
            width: '48px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '64px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '124px',
            height: '32px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
          }}
        />
      </div>
    )
  }

  const sendLabel = (() => {
    const n = rows.filter((r) => r.email.trim()).length
    if (sending) return 'Sending'
    return n > 1 ? `Send ${n} invites` : 'Send invite'
  })()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <p
        className='label-sm'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        Team
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
        }}
      >
        <ListHeader />
        {data.members.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>

      {/* ─── New invite ─── */}
      {composing ? (
        <div
          className='invite-composer'
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
          }}
        >
          <p
            className='para-xs'
            style={{ color: 'var(--text-soft)', margin: 0 }}
          >
            New invite
          </p>

          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <div style={{ flex: '1 0 0', minWidth: 0 }}>
                <Inputfield
                  placeholder='name@company.com'
                  value={row.email}
                  onChange={(e) => updateRow(i, { email: e.target.value })}
                  onKeyDown={(e) => {
                    // Enter adds another row rather than submitting. Typing a
                    // list is the common case, and a stray Enter sending a
                    // half-finished batch is the expensive mistake.
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (i === rows.length - 1) addRow()
                    }
                  }}
                  error={errorIndex === i}
                  shaking={errorIndex === i}
                  textSize='12px'
                />
              </div>

              <div style={{ width: COL_ROLE, flexShrink: 0 }}>
                <Dropdown
                  fullWidth
                  align='right'
                  trigger={
                    <Inputfield
                      righticon={<ChevronIcon />}
                      value={roleLabel(row.role)}
                      onChange={() => {}}
                      textSize='12px'
                    />
                  }
                >
                  <DropdownMenu>
                    {ROLES.map((r) => (
                      <DropdownOption
                        key={r.id}
                        selected={r.id === row.role}
                        onClick={() => updateRow(i, { role: r.id })}
                      >
                        {r.label}
                      </DropdownOption>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Only from the second row. Removing the only row would leave
                  the composer with nothing in it. */}
              {rows.length > 1 ? (
                <button
                  type='button'
                  onClick={() => removeRow(i)}
                  aria-label='Remove this row'
                  className='settings-icon-btn'
                  style={{
                    display: 'flex',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-soft)',
                    flexShrink: 0,
                  }}
                >
                  <CloseIcon />
                </button>
              ) : null}
            </div>
          ))}

          <button
            type='button'
            onClick={addRow}
            className='invite-add-row'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--text-sub)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
            }}
          >
            <PlusIcon />
            Add another
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              width: '100%',
              paddingTop: '2px',
            }}
          >
            {/* Cancel on the left, Send on the right — the destructive one
                furthest from the thumb, and the opposite arrangement to the
                save bars, where the primary action leads. */}
            <button
              type='button'
              onClick={closeComposer}
              disabled={sending}
              className='discard-changes'
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: sending ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.24px',
                color: 'var(--text-soft)',
              }}
            >
              Cancel
            </button>

            <button
              type='button'
              onClick={handleSend}
              disabled={sending}
              className='settings-save'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                cursor: sending ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.24px',
                background: 'var(--text-strong)',
                color: 'var(--bg-default)',
              }}
            >
              {sending ? <Spinner /> : null}
              {sendLabel}
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setComposing(true)}
          disabled={!canManage}
          className='settings-save'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 18px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            cursor: canManage ? 'pointer' : 'default',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
            background: 'var(--bg-surface)',
            color: canManage ? 'var(--text-sub)' : 'var(--text-disabled)',
          }}
        >
          Invite members
        </button>
      )}

      {/* ─── Pending invites ─── */}
      {data.invites.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
          }}
        >
          <p
            className='para-xs'
            style={{ color: 'var(--text-soft)', margin: 0 }}
          >
            Pending invites
          </p>
          <ListHeader />
          {data.invites.map((i) => (
            <InviteRow
              key={i.id}
              invite={i}
              canManage={canManage}
              onCancel={handleCancelInvite}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
