const authenticate = require('./auth/index.js')
const { setConfig, getConfig, loadConfigs } = require('./utils/config.js')
const { createCore, deleteCore } = require('./utils/cores.js')
const { createDrive, deleteDrive } = require('./utils/drives.js')
const { createNode, createSwarm, makeNode, makeSwarm, deleteResource } = require('./utils/nodes.js')
const { initMasterComponents, getMasterComponents } = require('./utils/masterComponents.js')

module.exports = {
  authenticate,
  initMasterComponents,
  getMasterComponents,

  // Hypercores
  createCore,
  deleteCore,

  // Hyperdrives
  createDrive,
  deleteDrive,

  // DHT/Swarm
  createNode,
  makeNode,
  createSwarm,
  makeSwarm,
  deleteResource,

  // Config
  getConfig,
  setConfig,
  loadConfigs
}
