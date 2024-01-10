const authenticate = require('./auth/index.js')
const { setConfig, getConfig } = require('./utils/config.js')
const { createCore, deleteCore } = require('./utils/cores.js')
const { createDrive, deleteDrive } = require('./utils/drives.js')
const { initMasterComponents, getMasterComponents } = require('./utils/masterComponents.js')

module.exports = { authenticate, initMasterComponents, getMasterComponents, createCore, deleteCore, createDrive, deleteDrive, getConfig, setConfig }
