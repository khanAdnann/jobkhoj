import { createContext } from 'react'

/**
 * Toast context object, kept in a plain .js module so the react-refresh plugin
 * doesn't treat this file as a component module.
 *
 * @typedef {Object} ToastItem
 * @property {string} id
 * @property {string} message
 * @property {'success'|'error'|'info'|'warning'} tone
 * @property {string} [title]
 * @property {number} [duration]
 */
export const ToastContext = createContext(null)

export default ToastContext
