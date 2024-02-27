const { generateChildKeyPair, Memory } = require('p2p-auth')
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
  const kebabName = toKebabCase(name)
  if ((await db.getDetails({ name: kebabName })).length) throw new Error('Resource name is not unique!')

  const { seed, keyPair } = opts.getKeyPair
    ? opts.getKeyPair(kebabName)
    : { seed: null, keyPair: generateChildKeyPair(Memory.getSeed(), kebabName) }

  const details = {
    type: 'keypair',
    title: toTitleCase(name),
    name: kebabName,
    resource: 'hyperdht',
    seed,
    key: keyPair.publicKey.toString('hex'),
    opts: { bootstrap: opts.bootstrap || null },
    deleted_at: null,
    updated_at: new Date().getTime(),
    created_at: new Date().getTime()
  }

  const suffix = `nodes/${details.name}`
  const storagePath = getChildStoragePath(suffix)
  details.storagePath = storagePath
  details.resourceKey = keyPair.publicKey.toString('hex')

  await db.push('keys', details.key)
  await db.putJson(`details:${details.key}`, details)

  return { node: details, details }
}

async function createSwarm (db, opts = {}) {
  const { name } = opts
  const kebabName = toKebabCase(name)
  if ((await db.getDetails({ name: kebabName })).length) throw new Error('Resource name is not unique!')

  const { seed, keyPair } = opts.getKeyPair
    ? opts.getKeyPair(kebabName)
    : { seed: null, keyPair: generateChildKeyPair(Memory.getSeed(), kebabName) }

  delete opts.name
  const details = {
    type: 'keypair',
    title: toTitleCase(name),
    name: kebabName,
    resource: 'hyperswarm',
    seed,
    key: keyPair.publicKey.toString('hex'),
    opts,
    deleted_at: null,
    updated_at: new Date().getTime(),
    created_at: new Date().getTime()
  }

  const suffix = `swarms/${details.name}`
  const storagePath = getChildStoragePath(suffix)
  details.storagePath = storagePath
  details.resourceKey = keyPair.publicKey.toString('hex')

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
