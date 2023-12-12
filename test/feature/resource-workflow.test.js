import fs from 'fs/promises'
import { test } from 'brittle'
import { createUser } from 'p2p-auth'
import authenticate from '../../src/auth/index.js'
import { getKeyPair } from '../../src/utils/keyPair.js'
import { getSeed } from '../../src/utils/seed.js'
import { initMasterComponents, getMasterCore, getMasterDb } from '../../src/utils/masterComponents.js'
import { clearCore, createCore, deleteCore, writeToCore } from '../../src/utils/cores.js'
import { getConfig, setConfig } from '../../src/utils/config.js'
import { createDrive, deleteDrive } from '../../src/utils/drives.js'

setConfig('resourcesLocation', './test/.p2p-resources')

const username = 'username'
const password = 'password'
const { keyPair, seed } = await createUser({ username, password })
const authFn = async () => Promise.resolve({ username, keyPair, seed })

test('Workflow to manage resources', async (t) => {
  // Authenticate the user
  await authenticate(authFn)

  t.ok(getKeyPair(), 'Key pair should be set after auth')
  t.ok(getKeyPair('pubkey'), 'Public key should be set after auth')
  t.ok(getKeyPair('secretKey'), 'Secret key should be set after auth')
  t.ok(getSeed(), 'Seed should be set after auth')

  // Master components
  await initMasterComponents({ dbOpts: { keyEncoding: 'binary', valueEncoding: 'json' } })
  const masterCore = getMasterCore()
  const masterDb = getMasterDb()
  t.ok(masterCore, 'Master core should be set after master components are initialized')
  t.ok(masterDb, 'Master db should be set after master components are initialized')
  t.alike(masterDb.keyEncoding.name, 'binary', 'Key encoding should match')
  t.alike(masterDb.valueEncoding.name, 'json', 'Value encoding should match')

  // List resources
  let resources = await masterDb.getResources()
  let details = await masterDb.getDetails()
  t.is(resources.length, 0, 'Resources list should be empty')
  t.is(details.length, 0, 'Details list should be empty')

  // Create core
  const testCoreA = await createCore(masterDb, { name: 'test-a', encrypted: false })
  t.is(testCoreA.details.name, 'test-a', 'Creatd core name should match')
  t.is(testCoreA.details.encrypted, false, 'Created core should NOT be encrypted')
  t.alike(testCoreA.details.key, testCoreA.core.key.toString('hex'), 'Created cores key should match')

  // List resources
  resources = await masterDb.getResources()
  details = await masterDb.getDetails()
  t.is(resources.length, 1, 'After core is created, resources list should have one item')
  t.is(details.length, 1, 'After core is created, details list should have one item')

  // Write to core
  const txt = 'Write to core'
  let resource = await masterDb.findResourceByName('test-a')
  await writeToCore({ db: masterDb, key: testCoreA.core.key, data: txt })

  // Read core
  const fullStream = resource.hypercore.createReadStream()
  t.is(resource.hypercore.length, 1, 'Length should be 1')
  for await (const data of fullStream) {
    t.alike(data.toString(), txt, 'Texts should match')
  }

  // Clear core
  resource = await masterDb.findResourceByName('test-a', { skipCache: true })
  // await clearCore(resource.hypercore)
  await clearCore({ db: masterDb, key: testCoreA.core.key })
  resource = await masterDb.findResourceByName('test-a', { skipCache: true })
  t.is(resource.hypercore.length, 1, 'Length should be 1')

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 1, 'After core is cleared, resources list should still have one item')
  t.is(details.length, 1, 'After core is cleared, details list should still have one item')

  // Delete core
  await deleteCore({ db: masterDb, key: testCoreA.core.key })
  resource = await masterDb.findResourceByName('test-a', { skipCache: true })
  t.absent(resource, 'Resource should not be found')

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 0, 'After core is deleted, resources list should have 0 item')
  t.is(details.length, 1, 'After core is deleted, details list should still have one item')

  // Create another core
  const testCoreB = await createCore(masterDb, { name: 'test-b', encrypted: true })
  t.is(testCoreB.details.name, 'test-b', 'Creatd core name should match')
  t.is(testCoreB.details.encrypted, true, 'Created core should be encrypted')
  t.alike(testCoreB.details.encrypted, !!testCoreB.core.encryptionKey, 'Confirm the actual Hypercore is encrypted')
  t.alike(testCoreB.details.key, testCoreB.core.key.toString('hex'), 'Created cores key should match')

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 1, 'After another core is created, resources list should have 1 item')
  t.is(details.length, 2, 'After another core is created, details list should have two item')

  // Create drive
  const testDriveA = await createDrive(masterDb, { name: 'test-a', encrypted: true })
  t.is(testDriveA.details.name, 'test-a', 'Creatd drive name should match')
  t.is(testDriveA.details.encrypted, true, 'Created drive should be encrypted')
  t.alike(testDriveA.details.encrypted, !!testDriveA.drive.encryptionKey, 'Confirm the actual Hyperdrive is encrypted')
  t.alike(testDriveA.details.resourceKey, testDriveA.drive.key.toString('hex'), 'Created drives key should match')

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 2, 'After drive is created, resources list should have two item')
  t.is(details.length, 3, 'After drive is created, details list should have three item')

  // Delete drive
  await deleteDrive({ db: masterDb, resourceKey: testDriveA.drive.key })
  resource = await masterDb.findResourceByName('test-a', { skipCache: true, resource: 'hyperdrive' })
  t.absent(resource, 'Resource should not be found')

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 1, 'After drive is deleted, resources list should have one item')
  t.is(details.length, 3, 'After drive is deleted, details list should have three item')

  // Tests clean up
  await fs.rm(getConfig('resourcesLocation'), { recursive: true })
})
