const { authCLI } = require('p2p-auth')

/**
 * Authenticate the user.
 * authFn makes this easier to test
 *
 * @param {*} authFn
 * @returns
 */
module.exports = async (authFn = null) => {
  try {
    const auth = authFn || authCLI
    const { keyPair, seed } = await auth()

    return { keyPair, seed }
  } catch (error) {
    console.error('Authentication failed:', error)
    process.exit(1)
  }
}
