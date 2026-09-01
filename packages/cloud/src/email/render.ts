import { render } from '@vue-email/render'

import { DocumentInvitationEmail } from './templates/document-invitation'
import type {
  DocumentInvitationEmailPayload,
  RenderedTransactionalEmail,
  TransactionalEmailKind,
  TransactionalEmailPayloadByKind
} from './types'

async function renderDocumentInvitation(
  payload: DocumentInvitationEmailPayload
): Promise<RenderedTransactionalEmail> {
  const permissionLabel = payload.permission === 'edit' ? 'edit' : 'view'
  const props = {
    inviterName: payload.inviterName,
    documentName: payload.documentName,
    permissionLabel,
    expiresAt: new Date(payload.expiresAt).toUTCString(),
    acceptanceURL: payload.acceptanceURL
  }
  const [html, text] = await Promise.all([
    render(DocumentInvitationEmail, props),
    render(DocumentInvitationEmail, props, { plainText: true })
  ])
  return {
    subject: `${payload.inviterName} invited you to ${permissionLabel} ${payload.documentName}`,
    html,
    text
  }
}

export async function renderTransactionalEmail(
  _kind: TransactionalEmailKind,
  payload: TransactionalEmailPayloadByKind['document-invitation']
): Promise<RenderedTransactionalEmail> {
  return renderDocumentInvitation(payload)
}
