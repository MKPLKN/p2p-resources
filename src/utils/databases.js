const Hyperbee = require('hyperbee')
const { generateChildKeyPair, Memory } = require('p2p-auth')
const { getKeys, makeCore, makePrivateCore } = require('./cores.js')
const goodbye = require('graceful-goodbye')
const { makeDrive, makePrivateDrive } = require('./drives.js')

async function makeDatabase (core, opts = {}) {
  const db = opts.handyBee === false ? new Hyperbee(core, opts) : new HandyBee(core, opts)
  await db.ready()
  goodbye(() => db.close())
  return db
}

class HandyBee extends Hyperbee {
  constructor (core, opts = {}) {
    super(core, opts)

    this.resources = []
  }

  get encryptionKey () {
    return this.core.encryptionKey
  }

  async getPathList () {
    return await this.getJsonValue('derived-paths', [])
  }

  async getValue (key, defaultValue = null) {
    try {
      return ((await this.get(key)).value) || defaultValue
    } catch (error) {
      return defaultValue
    }
  }

  async getJsonValue (key, defaultValue = null) {
    try {
      return JSON.parse(
        (await this.getValue(key, defaultValue)).toString()
      )
    } catch (error) {
      return defaultValue
    }
  }

  async putJson (key, value) {
    await this.put(key, JSON.stringify(value))
  }

  async push (key, newValue) {
    const values = await this.getJsonValue(key, [])
    if (newValue && !values.includes(newValue)) {
      values.push(newValue)
      await this.putJson(key, values)
    }
  }

  async pop (key, delValues, filterFn) {
    const arr = Array.isArray(delValues) ? delValues : [delValues]
    const curValues = await this.getJsonValue(key, [])

    const defaultFilter = c => !arr.includes(c)
    const filterFunction = filterFn || defaultFilter
    const updatedValues = curValues.filter(filterFunction)

    await this.putJson(key, updatedValues)
    return updatedValues
  }

  async getDetails (opts = {}) {
    const { resource, name } = opts
    const list = []
    for (const key of (await this.getJsonValue('keys', []))) {
      const details = (await this.getJsonValue(`details:${key}`))
      if (!details) continue
      if (name && String(details.name).toLowerCase() !== String(name).toLowerCase()) continue
      if (resource && details.resource !== resource) continue
      list.push(details)
    }
    return list
  }

  async getResources (opts = {}) {
    const { skipCache = false, resource = null, encrypted } = opts

    const filters = []
    if (encrypted === false || encrypted === true) {
      filters.push(r => r.details.encrypted === encrypted)
    }
    if (resource) {
      filters.push(r => r.details.resource === resource)
    }

    if (this.resources.length && !skipCache) {
      return filters.length ? this.resources.filter(r => filters.every(f => f(r))) : this.resources
    }

    this.resources = []
    const hyperswarms = []
    for (const key of (await this.getJsonValue('keys', []))) {
      const details = (await this.getJsonValue(`details:${key}`))
      const keyPair = generateChildKeyPair(Memory.getSeed(), details.name)
      if (details && !details.deleted_at) {
        const storagePath = details.storagePath
        if (details.resource === 'hypercore') {
          const core = details.encrypted ? await makePrivateCore(storagePath, keyPair) : await makeCore(storagePath, keyPair)
          this.resources.push({ details, hypercore: core, coreKeys: getKeys(core) })
        }

        if (details.resource === 'hyperdrive') {
          const drive = details.encrypted ? await makePrivateDrive(storagePath, keyPair) : await makeDrive(storagePath, keyPair)
          this.resources.push({ details, hyperdrive: drive })
        }

        if (details.resource === 'hyperdht') {
          // When you're ready to use the HyperDHT instance, you can initialise it like this:
          // -> makeNode(resource.details.opts)
          details.opts = { ...details.opts, keyPair }
          this.resources.push({ details })
        }

        if (details.resource === 'hyperswarm') {
          // When you're ready to use the Hyperswarm instance, you can initialise it like this:
          // -> makeSwarm(resource.details.opts)
          details.opts = { ...details.opts, keyPair }
          this.resources.push({ details })
          // hyperswarms.push({ keyPair, details })
        }
      }
    }

    for await (const swarm of hyperswarms) {
      const { details, keyPair } = swarm

      // If DHT name is not given, it will always create a new DHT instance for the Hyperswarm
      const name = details?.opts?.dht?.name
      let dht = null
      if (name) {
        const dhtResource = this.resources.find(r => String(r.details.name).toLowerCase() === String(name).toLowerCase())
        if (dhtResource && dhtResource.opts) {
          dht = dhtResource.opts
        }
      }
      this.resources.push({ details, opts: { ...details.opts, dht, keyPair } })
    }

    return filters.length ? this.resources.filter(r => filters.every(f => f(r))) : this.resources
  }

  async findResourceByName (name, opts = {}) {
    return (await this.getResources(opts)).find(r => String(r.details.name).toLowerCase() === String(name).toLowerCase())
  }

  async findResourceByKey (key, opts = {}) {
    const pubkey = typeof key === 'string' ? key : key.toString('hex')
    return (await this.getResources(opts)).find(r => r.details.key === pubkey)
  }

  async findResourceByResourceKey (key, opts = {}) {
    const rkey = typeof key === 'string' ? key : key.toString('hex')
    return (await this.getResources(opts)).find(r => r.details.resourceKey === rkey)
  }
}

module.exports = {
  makeDatabase
}
