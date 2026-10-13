/**
 * Tool-level failures that the UI renders as guidance rather than a crash.
 *
 * BACKEND_REQUIRED is the honest path for operations that cannot be done in
 * the browser (legacy .doc parsing, server-grade compression): the flow stays
 * intact and the message names the endpoint that will serve it, instead of
 * pretending a file was produced.
 */
export class ToolError extends Error {
  /**
   * @param {string} message user-facing message
   * @param {{code?:'BACKEND_REQUIRED'|'UNSUPPORTED'|'INVALID_FILE'|'LIMIT_EXCEEDED'|'EMPTY', endpoint?:string, detail?:string}} options
   */
  constructor(message, options = {}) {
    super(message)
    this.name = 'ToolError'
    this.code = options.code ?? 'UNSUPPORTED'
    this.endpoint = options.endpoint ?? null
    this.detail = options.detail ?? null
  }
}

export const backendRequired = (message, endpoint, detail) =>
  new ToolError(message, { code: 'BACKEND_REQUIRED', endpoint, detail })

export const invalidFile = (message, detail) =>
  new ToolError(message, { code: 'INVALID_FILE', detail })

export function isToolError(error) {
  return error instanceof ToolError
}

export default ToolError
