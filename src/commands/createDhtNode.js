const inquirer = require('inquirer')
const { getMasterDb } = require('../utils/masterComponents.js')
const { toKebabCase, toTitleCase } = require('../utils/helpers.js')
const { Memory } = require('p2p-auth')
const { createNode } = require('../utils/nodes.js')

const createDhtNodeCommand = async () => {
  const masterDb = getMasterDb()

  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the DHT node:',
      validate: async (input) => {
        const hyperdht = (await masterDb.getDetails('hyperdht'))
        const names = hyperdht.filter(d => !d.deleted_at).map(d => d.name)
        const titles = hyperdht.filter(d => !d.deleted_at).map(d => d.title)

        if (input.trim() === '') {
          return 'Name cannot be empty'
        }
        if (!/^[A-Za-z0-9\s]+$/.test(input)) {
          return 'Name must contain only letters and numbers'
        }
        if (titles.includes(toTitleCase(input)) || names.includes(toKebabCase(input))) {
          return 'Name must be unique'
        }
        return true
      }
    }
  ])

  const { details } = await createNode(masterDb, { name })

  console.log(`New DHT node ${details.key} created, for ${Memory.getKeyPair('pubkey')} key`)
  console.log('Details', details)
}

module.exports = { createDhtNodeCommand }
