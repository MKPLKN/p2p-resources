import { authCLI } from 'p2p-auth'
import { setKeyPair } from '../utils/keyPair.js'
import { setSeed } from '../utils/seed.js'
import { setUser } from '../utils/user.js'

/**
 * Authenticate the user.
 * authFn makes this easier to test
 *
 * @param {*} authFn
 * @returns
 */
const authenticate = async (authFn = null) => {
  try {
    const auth = authFn || authCLI
    const { username, keyPair, seed } = await auth()

    setUser(username)
    setKeyPair(keyPair)
    setSeed(seed)

    return { keyPair, seed }
  } catch (error) {
    console.error('Authentication failed:', error)
    process.exit(1)
  }
}

export default authenticate
