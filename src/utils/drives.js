import Hyperdrive from 'hyperdrive'
import { getChildStoragePath, getCorestore } from './cores.js'
import goodbye from 'graceful-goodbye'
import { Memory, generateChildKeyPair, generateEncryptionKeyFromKeyPair, getNextDerivedPath } from 'p2p-auth'
import { deleteDirectory, toKebabCase, toTitleCase } from './helpers.js'

const drives = new Map()
export async function makePrivateDrive (storagePath, keyPair, opts = {}) {
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

export async function makeDrive (storagePath, keyPair, opts = {}) {
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

export async function createDrive (db, opts = {}) {
  const { name, encrypted } = opts
  const pathList = await db.getPathList()
  const path = getNextDerivedPath(pathList)
  const keyPair = generateChildKeyPair(Memory.getSeed(), path)

  const time = new Date().getTime()
  const details = {
    type: 'keypair',
    title: toTitleCase(name),
    name: toKebabCase(name),
    key: keyPair.publicKey.toString('hex'),
    encrypted,
    resource: 'hyperdrive',
    path,
    deleted_at: null,
    updated_at: time,
    created_at: time
  }

  const suffix = encrypted ? `filesystem/private/${details.name}` : `filesystem/public/${details.name}`
  const storagePath = getChildStoragePath(suffix)
  details.storagePath = storagePath

  const drive = encrypted ? await makePrivateDrive(storagePath, keyPair) : await makeDrive(storagePath, keyPair)
  details.resourceKey = drive.key.toString('hex')

  await db.push('derived-paths', path)
  await db.push('keys', details.key)
  await db.putJson(`details:${details.key}`, details)

  return { drive, details }
}

export async function deleteDrive ({ db, key, resourceKey }) {
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
