const { Memory } = require('p2p-auth')
const { getMasterStoragePath, makePrivateCore } = require('./cores.js')
const { makeDatabase } = require('./databases.js')

let masterCoreInstance = null
let masterDbInstance = null

const initMasterComponents = async (opts = {}) => {
  const { coreOpts, dbOpts } = opts
  const keyPair = Memory.getKeyPair()

  const masterCore = await makePrivateCore(getMasterStoragePath(), keyPair, coreOpts || {})
  const masterDb = await makeDatabase(masterCore, dbOpts || {})

  setMasterComponents({ masterCore, masterDb })

  return { masterCore, masterDb }
}

const setMasterComponents = ({ masterCore, masterDb }) => {
  masterCoreInstance = masterCore
  masterDbInstance = masterDb
}

const getMasterComponents = () => {
  return { masterCore: masterCoreInstance, masterDb: masterDbInstance }
}

const getMasterCore = () => {
  if (!masterCoreInstance) {
    throw new Error('masterCore is not initialized')
  }
  return masterCoreInstance
}

const getMasterDb = () => {
  if (!masterDbInstance) {
    throw new Error('masterDb is not initialized')
  }
  return masterDbInstance
}

module.exports = {
  initMasterComponents,
  setMasterComponents,
  getMasterComponents,
  getMasterCore,
  getMasterDb
}
