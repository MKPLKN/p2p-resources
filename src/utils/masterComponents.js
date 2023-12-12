import { getMasterStoragePath, makePrivateCore } from './cores.js'
import { makeDatabase } from './databases.js'
import { getKeyPair } from './keyPair.js'

let masterCoreInstance = null
let masterDbInstance = null

export const initMasterComponents = async (opts = {}) => {
  const { coreOpts, dbOpts } = opts
  const keyPair = getKeyPair()

  const masterCore = await makePrivateCore(getMasterStoragePath(), keyPair, coreOpts || {})
  const masterDb = await makeDatabase(masterCore, dbOpts || {})

  setMasterComponents({ masterCore, masterDb })

  return { masterCore, masterDb }
}

export const setMasterComponents = ({ masterCore, masterDb }) => {
  masterCoreInstance = masterCore
  masterDbInstance = masterDb
}

export const getMasterComponents = () => {
  return { masterCore: masterCoreInstance, masterDb: masterDbInstance }
}

export const getMasterCore = () => {
  if (!masterCoreInstance) {
    throw new Error('masterCore is not initialized')
  }
  return masterCoreInstance
}

export const getMasterDb = () => {
  if (!masterDbInstance) {
    throw new Error('masterDb is not initialized')
  }
  return masterDbInstance
}
