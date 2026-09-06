import { SESSION_ENABLE_PATH } from '../constants.js'

export { SESSION_ENABLE_PATH }

export function sessionEnableUrl(sessionId) {
  const params = new URLSearchParams({ sessionId })
  return `${SESSION_ENABLE_PATH}?${params}`
}

async function readSnapshot(response) {
  const snapshot = await response.json()
  if (!response.ok || snapshot?.ok !== true) {
    const message = typeof snapshot?.error === 'string' ? snapshot.error : `HTTP ${response.status}`
    throw new Error(message)
  }
  return snapshot
}

export async function fetchSessionEnable(sessionId, fetchImpl = fetch) {
  const response = await fetchImpl(sessionEnableUrl(sessionId), { credentials: 'include' })
  return await readSnapshot(response)
}

export async function putSessionEnable(sessionId, enabled, fetchImpl = fetch) {
  const response = await fetchImpl(SESSION_ENABLE_PATH, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, enabled }),
  })
  return await readSnapshot(response)
}
