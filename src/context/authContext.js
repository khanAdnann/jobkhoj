import { createContext } from 'react'

/**
 * Auth context object, kept in a plain .js module so react-refresh doesn't
 * treat it as a component module.
 *
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user        Signed-in user record.
 * @property {boolean}    initialising True while the session is being restored.
 * @property {boolean}    isAuthenticated
 * @property {Function}   login        ({ email, password }) => Promise<user>
 * @property {Function}   register     (payload) => Promise<user>
 * @property {Function}   logout       () => Promise<void>
 * @property {Function}   refresh      Re-read the user from the API.
 * @property {Function}   hasRole      (...roles) => boolean
 */
export const AuthContext = createContext(null)

export default AuthContext
