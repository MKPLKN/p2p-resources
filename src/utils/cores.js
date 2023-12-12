import Corestore from 'corestore'
import { generateEncryptionKeyFromKeyPair, generateChildKeyPair, getNextDerivedPath } from 'p2p-auth'
import { getSeed } from './seed.js'
import { toKebabCase, toTitleCase } from './helpers.js'
import { getConfig } from './config.js'
import goodbye from 'graceful-goodbye'
import { getUser } from './user.js'

export function getDefaultStoragePath () {
  const prefix = getConfig('resourcesLocation', './.p2p-resources')
  return `${prefix}/${getUser()}`
}

export function getReaderStoragePath (path) {
  const defaultPath = getDefaultStoragePath()
  const storage = `${defaultPath}/reader`
  return path ? `${storage}/${path}` : storage
}

export function getChildStoragePath (path) {
  const defaultPath = getDefaultStoragePath()
  const storage = `${defaultPath}/child`
  return path ? `${storage}/${path}` : storage
}

export function getMasterStoragePath (path) {
  const defaultPath = getDefaultStoragePath()
  const storage = `${defaultPath}/master`
  return path ? `${storage}/${path}` : storage
}

const store = {}
export async function getCorestore (path = null, opts = {}) {
  if (path && store[path]) return store[path]

  const storage = path || getDefaultStoragePath()
  store[storage] = new Corestore(storage, opts)
  await store[storage].ready()

  return store[storage]
}

export async function makeCore (path, keyPair, opts = {}) {
  if (typeof path !== 'string') {
    keyPair = path
    opts = keyPair
    path = null
  }

  const core = (await getCorestore(path)).get({
    ...opts,
    keyPair
  })

  await core.ready()
  goodbye(() => core.close())

  return core
}

export async function makePrivateCore (path, keyPair, opts = {}) {
  if (typeof path !== 'string') {
    keyPair = path
    opts = keyPair
    path = null
  }

  const encryptionKey = opts.encryptionKey || generateEncryptionKeyFromKeyPair(keyPair)

  const core = (await getCorestore(path, { primaryKey: encryptionKey })).get({
    keyPair,
    encryptionKey,
    ...opts
  })

  await core.ready()
  goodbye(() => core.close())

  return core
}

export const getKeys = (core) => {
  const { id, key, discoveryKey } = core

  return {
    id,
    key: key.toString('hex'),
    discoveryKey: discoveryKey.toString('hex')
  }
}

export async function createCore (db, opts = {}) {
  const { name, encrypted } = opts
  const pathList = await db.getPathList()
  const path = getNextDerivedPath(pathList)
  const keyPair = generateChildKeyPair(getSeed(), path)

  const details = {
    type: 'keypair',
    title: toTitleCase(name),
    name: toKebabCase(name),
    encrypted,
    resource: 'hypercore',
    key: keyPair.publicKey.toString('hex'),
    path,
    deleted_at: null,
    updated_at: new Date().getTime(),
    created_at: new Date().getTime()
  }

  const suffix = encrypted ? `private/${details.name}` : `public/${details.name}`
  const storagePath = getChildStoragePath(suffix)
  details.storagePath = storagePath
  const core = encrypted ? await makePrivateCore(storagePath, keyPair) : await makeCore(storagePath, keyPair)
  details.resourceKey = core.key

  await db.push('derived-paths', path)
  await db.push('keys', details.key)
  await db.putJson(`details:${details.key}`, details)

  return { core, details }
}

export async function writeToCore ({ db, key, data }) {
  const resource = await db.findResourceByKey(key)
  const core = resource.hypercore
  if (core) {
    await core.append(typeof data === 'string' ? Buffer.from(data) : data)
    return true
  }
  return false
}

export async function clearCore ({ db, key }) {
  const resource = await db.findResourceByKey(key)
  const core = resource.hypercore
  if (core) {
    await core.clear(0, core.length)
  }
}

export async function deleteCore ({ db, key, resourceKey }) {
  const resource = key ? await db.findResourceByKey(key) : resourceKey ? await db.findResourceByResourceKey(resourceKey) : null
  if (!resource) return null
  const core = resource.hypercore

  if (core) {
    await core.purge()
    resource.details.deleted_at = new Date().getTime()
    await db.putJson(`details:${resource.details.key}`, resource.details)
  }
}
