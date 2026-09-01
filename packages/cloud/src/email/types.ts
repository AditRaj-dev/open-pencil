import type { DocumentPermission } from '#cloud/contract'

export type TransactionalEmailKind = 'document-invitation'

export type DocumentInvitationEmailPayload = {
  inviterName: string
  documentName: string
  permission: DocumentPermission
  expiresAt: string
  acceptanceURL: string
}

export type TransactionalEmailPayloadByKind = {
  'document-invitation': DocumentInvitationEmailPayload
}

export type TransactionalEmailMessage<
  Kind extends TransactionalEmailKind = TransactionalEmailKind
> = {
  id: string
  kind: Kind
  recipientEmail: string
  payload: TransactionalEmailPayloadByKind[Kind]
}

export type RenderedTransactionalEmail = {
  subject: string
  html: string
  text: string
}
