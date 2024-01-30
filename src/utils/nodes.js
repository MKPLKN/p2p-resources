const { getNextDerivedPath, generateChildKeyPair, Memory } = require('p2p-auth')
const { toTitleCase, toKebabCase } = require('./helpers')
const { getChildStoragePath } = require('./cores')
const HyperDHT = require('hyperdht')
const Hyperswarm = require('hyperswarm')

function makeNode (opts) {
  return new HyperDHT(opts)
}

function makeSwarm (opts) {
  return new Hyperswarm(opts)
}

async function createNode (db, opts = {}) {
  const { name } = opts
  const pathList = await db.getPathList()
  const path = getNextDerivedPath(pathList)
  const keyPair = generateChildKeyPair(Memory.getSeed(), path)

  const details = {
    type: 'keypair',
    title: toTitleCase(name),
    name: toKebabCase(name),
    resource: 'hyperdht',
    key: keyPair.publicKey.toString('hex'),
    path,
    opts: { bootstrap: opts.bootstrap || null },
    deleted_at: null,
    updated_at: new Date().getTime(),
    created_at: new Date().getTime()
  }

  const suffix = `nodes/${details.name}`
  const storagePath = getChildStoragePath(suffix)
  details.storagePath = storagePath
  details.resourceKey = keyPair.publicKey.toString('hex')

  await db.push('derived-paths', path)
  await db.push('keys', details.key)
  await db.putJson(`details:${details.key}`, details)

  return { node: details, details }
}

async function createSwarm (db, opts = {}) {
  const { name } = opts
  const pathList = await db.getPathList()
  const path = getNextDerivedPath(pathList)
  const keyPair = generateChildKeyPair(Memory.getSeed(), path)

  delete opts.name
  const details = {
    type: 'keypair',
    title: toTitleCase(name),
    name: toKebabCase(name),
    resource: 'hyperswarm',
    key: keyPair.publicKey.toString('hex'),
    path,
    opts,
    deleted_at: null,
    updated_at: new Date().getTime(),
    created_at: new Date().getTime()
  }

  const suffix = `swarms/${details.name}`
  const storagePath = getChildStoragePath(suffix)
  details.storagePath = storagePath
  details.resourceKey = keyPair.publicKey.toString('hex')

  await db.push('derived-paths', path)
  await db.push('keys', details.key)
  await db.putJson(`details:${details.key}`, details)

  return { swarm: details, details }
}

async function deleteResource ({ db, key, resourceKey }) {
  const resource = key ? await db.findResourceByKey(key) : resourceKey ? await db.findResourceByResourceKey(resourceKey) : null
  if (!resource) return null

  resource.details.deleted_at = new Date().getTime()
  await db.putJson(`details:${resource.details.key}`, resource.details)
}

module.exports = { createNode, createSwarm, makeNode, makeSwarm, deleteResource }
