const fs = require('fs/promises')
const { test } = require('brittle')
const { Memory, createUser } = require('p2p-auth')
const { initMasterComponents, getMasterCore, getMasterDb } = require('../../src/utils/masterComponents.js')
const { clearCore, createCore, deleteCore, writeToCore } = require('../../src/utils/cores.js')
const { getConfig, setConfig } = require('../../src/utils/config.js')
const { createDrive, deleteDrive } = require('../../src/utils/drives.js')
const { createNode, createSwarm, makeSwarm, deleteResource } = require('../../src/utils/nodes.js')
const HyperDHT = require('hyperdht')

process.env.OPSLIMIT = 1
process.env.MEMLIMIT = 8192

setConfig('resourcesLocation', './test/.p2p-resources')

async function createUsers () {
  const username = 'username'
  const password = 'password'
  // This also stores the user's info into the Memory
  await createUser({ username, password })
}

test('Workflow to manage resources', async (t) => {
  await createUsers()

  // Testing the memory
  t.ok(Memory.getKeyPair(), 'Key pair should be set after auth')
  t.ok(Memory.getKeyPair('pubkey'), 'Public key should be set after auth')
  t.ok(Memory.getKeyPair('secretKey'), 'Secret key should be set after auth')
  t.ok(Memory.getSeed(), 'Seed should be set after auth')

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
  const testDriveA = await createDrive(masterDb, { name: 'test-a-drive', encrypted: true })
  t.is(testDriveA.details.name, 'test-a-drive', 'Creatd drive name should match')
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

  // Create DHT node
  const { node } = await createNode(masterDb, { name: 'test-dht-node', bootstrap: [] })
  resource = await masterDb.findResourceByName('test-dht-node', { skipCache: true, resource: 'hyperdht' })
  t.alike(node.key, resource.details.key)
  const testNode = new HyperDHT(resource.details.opts)
  t.alike(testNode.defaultKeyPair.publicKey.toString('hex'), resource.details.key)
  await testNode.destroy()

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 2, 'After DHT is created, resources list should have two item')
  t.is(details.length, 4, 'After DHT is created, details list should have four item')

  // Create Swarm
  const { swarm } = await createSwarm(masterDb, {
    name: 'test-swarm'
  })
  const swarmResource = await masterDb.findResourceByName('test-swarm', { skipCache: true, resource: 'hyperswarm' })
  t.alike(swarm.key, swarmResource.details.opts.keyPair.publicKey.toString('hex'))
  const testSwarm = makeSwarm(swarmResource.details.opts)
  t.alike(swarm.key, testSwarm.keyPair.publicKey.toString('hex'))
  await testSwarm.destroy()

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 3, 'After Swarm is created, resources list should have three item')
  t.is(details.length, 5, 'After Swarm is created, details list should have five item')

  // Delete node
  await deleteResource({ db: masterDb, resourceKey: node.resourceKey })

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 2, 'After Node is deleted, resources list should have three item')
  t.is(details.length, 5, 'After Node is deleted, details list should have six item')

  // Delete swarm
  await deleteResource({ db: masterDb, resourceKey: swarm.resourceKey })

  // List resources
  resources = await masterDb.getResources({ skipCache: true })
  details = await masterDb.getDetails()
  t.is(resources.length, 1, 'After Swarm is deleted, resources list should have three item')
  t.is(details.length, 5, 'After Swarm is deleted, details list should have six item')

  // Tests clean up
  await fs.rm(getConfig('resourcesLocation'), { recursive: true })
})
