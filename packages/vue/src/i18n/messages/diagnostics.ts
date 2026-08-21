import { params } from '@nanostores/i18n'

import { i18n } from '#vue/i18n/create'

export const diagnosticsMessageDefaults = {
  usageDescription: 'Local usage summaries from recorded AI requests.',
  usageRequests: 'Requests',
  usageCompleted: 'Completed',
  usageInputTokens: 'Input tokens',
  usageOutputTokens: 'Output tokens',
  usageByModel: 'By model',
  usageNoData: 'No usage data recorded.',
  usageNotReported: 'Not reported',
  usageCacheNote: 'Cache values are shown only when the provider reports them.',
  diagnosticsTitle: 'Diagnostics',
  diagnosticsModelStepCompleted: 'AI model step completed',
  diagnosticsChatCompleted: 'AI chat completed',
  diagnosticsChatFailed: 'AI chat failed',
  diagnosticsStorageFailed: 'Storage operation failed',
  diagnosticsDocumentFailed: 'Document operation failed',
  diagnosticsACPFailed: 'ACP transport failed',
  diagnosticsMCPFailed: 'MCP connection failed',
  diagnosticsTechnicalEvent: 'Technical event',
  diagnosticsRetention: 'Diagnostics retention',
  diagnosticsRetentionDescription: 'Keep up to this many recent events locally.',
  diagnosticsDescription:
    'Store technical events locally to help troubleshoot OpenPencil. Prompts, design content, credentials, and API keys are excluded.',
  localDiagnostics: 'Local diagnostics',
  localDiagnosticsDescription: 'Keep recent technical events on this device.',
  usageHistory: 'Usage history',
  usageHistoryDescription: 'Keep local AI usage summaries.',
  diagnosticsEventCount: params('{count} events · {size} KB'),
  diagnosticsCopy: 'Copy diagnostics',
  diagnosticsClear: 'Clear',
  diagnosticsClearDescription: 'This removes locally stored diagnostic events from this device.',
  diagnosticsCleared: 'Diagnostics cleared.',
  diagnosticsCopied: 'Diagnostics copied to clipboard.',
  diagnosticsCopyFailed: 'Could not copy diagnostics to the clipboard.'
} as const

export const diagnosticsMessages = i18n('diagnostics', diagnosticsMessageDefaults)
