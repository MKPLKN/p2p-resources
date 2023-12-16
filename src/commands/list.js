const { Memory } = require('p2p-auth')
const { getMasterComponents } = require('../utils/masterComponents.js')

const listCommand = async () => {
  console.log(`Listing all resources for ${Memory.getKeyPair('pubkey')}`)

  const { masterDb } = getMasterComponents()
  const resources = await masterDb.getResources()
  const details = await masterDb.getDetails()

  console.log({ resources, details })
}

module.exports = { listCommand }
