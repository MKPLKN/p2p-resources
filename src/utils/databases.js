import Hyperbee from 'hyperbee'
import { generateChildKeyPair } from 'p2p-auth'
import { getSeed } from './seed.js'
import { getKeys, makeCore, makePrivateCore } from './cores.js'
import goodbye from 'graceful-goodbye'
import { makeDrive, makePrivateDrive } from './drives.js'

export async function makeDatabase (core, opts = {}) {
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

  async getDetails (resource = null) {
    const list = []
    for (const path of (await this.getJsonValue('derived-paths', []))) {
      const keyPair = generateChildKeyPair(getSeed(), path)
      const pubkey = keyPair.publicKey.toString('hex')
      const details = (await this.getJsonValue(`details:${pubkey}`))
      if (details && (!resource || details.resource === resource)) {
        list.push(details)
      }
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
    for (const path of (await this.getJsonValue('derived-paths', []))) {
      const keyPair = generateChildKeyPair(getSeed(), path)
      const pubkey = keyPair.publicKey.toString('hex')
      const details = (await this.getJsonValue(`details:${pubkey}`))
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
      }
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
