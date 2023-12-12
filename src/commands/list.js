import { getKeyPair } from '../utils/keyPair.js'
import { getMasterComponents } from '../utils/masterComponents.js'

const listCommand = async () => {
  console.log(`Listing all resources for ${getKeyPair('pubkey')}`)

  const { masterDb } = getMasterComponents()
  const resources = await masterDb.getResources()
  const details = await masterDb.getDetails()

  console.log({ resources, details })
}

export default listCommand
