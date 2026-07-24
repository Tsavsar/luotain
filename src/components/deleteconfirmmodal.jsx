'use client'

import { useId, useState } from 'react'
import Modal, { ModalIcon, ModalBody, ModalActions, ModalButton } from './modal'

// Not a Figma export — a trash can is about as standard an icon as
// exists, safe to hand-draw rather than chase down the exact asset.
function TrashIcon() {
  return (
    <svg width='28' height='28' viewBox='0 0 28 28' fill='none'>
      <path
        d='M5 8h18'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M11 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M7 8l1 15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-15'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M11.5 13v7M16.5 13v7'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

// itemType/itemLabel keep this reusable past just links — same
// modal will fit a QR code or an org later without a copy-paste.
export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemType = 'link',
  itemLabel,
  recoveryDays = 30,
  origin,
}) {
  const [submitting, setSubmitting] = useState(false)
  const uid = useId()
  const titleId = `delete-confirm-title-${uid}`
  const descId = `delete-confirm-desc-${uid}`

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm?.()
      onClose?.()
    } catch (err) {
      // Real delete logic doesn't exist yet (see the TODO where this
      // is wired in) — this catch is here so that when it does, a
      // failed request re-enables the button instead of leaving it
      // stuck on "Deleting...".
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={descId}
      origin={origin}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ModalIcon tone='danger'>
          <TrashIcon />
        </ModalIcon>
        <ModalBody
          titleId={titleId}
          descriptionId={descId}
          title={`Delete this ${itemType}?`}
          description={`You are about to delete ${itemLabel}, you will have ${recoveryDays} days to recover it, after that it will be gone forever.`}
        />
      </div>

      <ModalActions>
        <ModalButton
          variant='neutral'
          autoFocus
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </ModalButton>
        <ModalButton
          variant='danger'
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? 'Deleting...' : 'Delete'}
        </ModalButton>
      </ModalActions>
    </Modal>
  )
}
