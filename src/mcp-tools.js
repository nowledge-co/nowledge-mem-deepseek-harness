import { MCP_TOOL_PREFIX } from './constants.js'

export function isMemToolName(name) {
  return typeof name === 'string' && name.startsWith(MCP_TOOL_PREFIX)
}

export function listMemToolNames(tools) {
  if (typeof tools?.schemas !== 'function') return []
  try {
    return tools.schemas()
      .map(schema => schema?.name)
      .filter(name => isMemToolName(name))
  } catch {
    return []
  }
}

export function memToolDeniedReason() {
  return 'Nowledge Mem is disabled for this session'
}

export function shouldDenyMemTool(name, enabled) {
  return isMemToolName(name) && enabled === false
}
