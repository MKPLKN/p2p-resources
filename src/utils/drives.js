const Hyperdrive = require('hyperdrive')
const { getChildStoragePath, getCorestore } = require('./cores.js')
const goodbye = require('graceful-goodbye')
const { Memory, generateChildKeyPair, generateEncryptionKeyFromKeyPair } = require('p2p-auth')
const { deleteDirectory, toKebabCase, toTitleCase } = require('./helpers.js')

const drives = new Map()
async function makePrivateDrive (storagePath, keyPair, opts = {}) {
  if (drives.has(storagePath)) {
    return drives.get(storagePath)
  }

  const primaryKey = opts.primaryKey || generateEncryptionKeyFromKeyPair(keyPair)
  const store = await getCorestore(`${storagePath}/corestore`, { primaryKey })
  delete opts.primaryKey
  const drive = keyPair.publicKey
    ? new Hyperdrive(store, { encryptionKey: primaryKey, ...opts })
    : new Hyperdrive(store, keyPair, { encryptionKey: primaryKey, ...opts })
  await drive.ready()
  goodbye(() => drive.close())
  drives.set(storagePath, drive)
  return drive
}

async function makeDrive (storagePath, keyPair, opts = {}) {
  if (drives.has(storagePath)) return drives.get(storagePath)

  const primaryKey = opts.primaryKey || generateEncryptionKeyFromKeyPair(keyPair)
  const store = await getCorestore(`${storagePath}/corestore`, { primaryKey })
  delete opts.primaryKey
  const drive = keyPair.publicKey
    ? new Hyperdrive(store, { ...opts })
    : new Hyperdrive(store, keyPair, { ...opts })
  await drive.ready()
  goodbye(() => drive.close())
  drives.set(storagePath, drive)
  return drive
}

async function createDrive (db, opts = {}) {
  const { name, encrypted } = opts
  const kebabName = toKebabCase(name)

  if ((await db.getDetails({ name: kebabName })).length) throw new Error('Resource name is not unique!')

  const keyPair = opts.getKeyPair ? opts.getKeyPair(kebabName) : generateChildKeyPair(Memory.getSeed(), kebabName)
  const time = new Date().getTime()
  const details = {
    type: 'keypair',
    title: toTitleCase(name),
    name: kebabName,
    key: keyPair.publicKey.toString('hex'),
    encrypted,
    resource: 'hyperdrive',
    deleted_at: null,
    updated_at: time,
    created_at: time
  }

  const suffix = encrypted ? `filesystem/private/${details.name}` : `filesystem/public/${details.name}`
  const storagePath = getChildStoragePath(suffix)
  details.storagePath = storagePath

  const drive = encrypted ? await makePrivateDrive(storagePath, keyPair) : await makeDrive(storagePath, keyPair)
  details.resourceKey = drive.key.toString('hex')

  await db.push('keys', details.key)
  await db.putJson(`details:${details.key}`, details)

  return { drive, details }
}

async function deleteDrive ({ db, key, resourceKey }) {
  const resource = key ? await db.findResourceByKey(key) : resourceKey ? await db.findResourceByResourceKey(resourceKey) : null
  if (!resource) return null

  const drive = resource.hyperdrive
  if (drive) {
    await drive.purge()
    resource.details.deleted_at = new Date().getTime()
    await db.putJson(`details:${resource.details.key}`, resource.details)
    await deleteDirectory(resource.details.storagePath)
  }
}

module.exports = {
  makePrivateDrive,
  makeDrive,
  createDrive,
  deleteDrive
}
