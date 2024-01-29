const authenticate = require('./auth/index.js')
const { setConfig, getConfig, loadConfigs } = require('./utils/config.js')
const { createCore, deleteCore } = require('./utils/cores.js')
const { createDrive, deleteDrive } = require('./utils/drives.js')
const { createNode, createSwarm, makeNode, makeSwarm, deleteResource } = require('./utils/nodes.js')
const { initMasterComponents, getMasterComponents } = require('./utils/masterComponents.js')
const { makeDatabase } = require('./utils/databases.js')

module.exports = {
  authenticate,
  initMasterComponents,
  getMasterComponents,

  // Hypercore
  createCore,
  deleteCore,

  // Hyperbee
  makeDatabase,

  // Hyperdrive
  createDrive,
  deleteDrive,

  // DHT
  createNode,
  makeNode,

  // Swarm
  createSwarm,
  makeSwarm,

  // Helper
  deleteResource,

  // Config
  getConfig,
  setConfig,
  loadConfigs
}
