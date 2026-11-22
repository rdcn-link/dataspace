/** AGUI 对话接口路径（开发走 Vite 代理，生产与站点同域） */
export const AGUI_RUN_PATH = '/tds-agent/agui/run'

export type AguiMessage = {
  id: string
  role: string
  content: string
}

export type AguiRunPayload = {
  threadId: string
  runId: string
  messages: AguiMessage[]
}

export type AguiRunCallbacks = {
  onRunStarted?: (threadId: string, runId: string) => void
  onRunFinished?: (threadId: string, runId: string) => void
  onTextMessageStart?: (messageId: string, role: string) => void
  onTextContent?: (delta: string, messageId: string) => void
  onTextMessageEnd?: (messageId: string) => void
  onError?: (error: string) => void
}

/** 生成随机 id（thread / run / message 通用） */
export function createAguiId(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  return `${prefix}-${suffix}`
}

/** 打开页面时生成会话 threadId / runId（可相同） */
export function createAguiSession(): { threadId: string; runId: string } {
  const id = createAguiId('session')
  return { threadId: id, runId: id }
}

let abortController: AbortController | null = null

function handleAguiEvent(event: { type?: string; [key: string]: unknown }, callbacks: AguiRunCallbacks) {
  if (!event?.type) return
  switch (event.type) {
    case 'RUN_STARTED':
      callbacks.onRunStarted?.(event.threadId as string, event.runId as string)
      break
    case 'RUN_FINISHED':
      callbacks.onRunFinished?.(event.threadId as string, event.runId as string)
      break
    case 'TEXT_MESSAGE_START':
      callbacks.onTextMessageStart?.(event.messageId as string, event.role as string)
      break
    case 'TEXT_MESSAGE_CONTENT':
      if (event.delta) {
        callbacks.onTextContent?.(event.delta as string, event.messageId as string)
      }
      break
    case 'TEXT_MESSAGE_END':
      callbacks.onTextMessageEnd?.(event.messageId as string)
      break
    case 'ERROR':
      callbacks.onError?.((event.error as string) || 'Unknown error')
      break
    default:
      break
  }
}

/** POST /tds-agent/agui/run，SSE 流式响应 */
export async function postAguiRun(payload: AguiRunPayload, callbacks: AguiRunCallbacks): Promise<void> {
  abortController = new AbortController()
  const signal = abortController.signal

  const response = await fetch(AGUI_RUN_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    },
    body: JSON.stringify(payload),
    signal
  })

  if (!response.ok) {
    abortController = null
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let delimiter = '\n\n'
      let delimiterIndex = buffer.indexOf(delimiter)
      if (delimiterIndex === -1) {
        delimiter = '\r\n\r\n'
        delimiterIndex = buffer.indexOf(delimiter)
      }

      while (delimiterIndex !== -1) {
        const message = buffer.substring(0, delimiterIndex)
        buffer = buffer.substring(delimiterIndex + delimiter.length)

        for (const line of message.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue
          try {
            const jsonStr = line.startsWith('data: ') ? line.slice(6) : line.slice(5)
            handleAguiEvent(JSON.parse(jsonStr), callbacks)
          } catch (e) {
            console.warn('Failed to parse AGUI event:', line, e)
          }
        }

        delimiterIndex = buffer.indexOf('\n\n')
        if (delimiterIndex === -1) {
          delimiterIndex = buffer.indexOf('\r\n\r\n')
          if (delimiterIndex !== -1) delimiter = '\r\n\r\n'
        } else {
          delimiter = '\n\n'
        }
      }
    }

    if (buffer.trim()) {
      for (const line of buffer.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue
        try {
          const jsonStr = line.startsWith('data: ') ? line.slice(6) : line.slice(5)
          handleAguiEvent(JSON.parse(jsonStr), callbacks)
        } catch (e) {
          console.warn('Failed to parse remaining AGUI event:', line, e)
        }
      }
    }
  } finally {
    reader.releaseLock()
    abortController = null
  }
}

export function abortAguiRun(): void {
  abortController?.abort()
  abortController = null
}
