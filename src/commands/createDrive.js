const inquirer = require('inquirer')
const { getMasterDb } = require('../utils/masterComponents.js')
const { toKebabCase, toTitleCase } = require('../utils/helpers.js')
const { createDrive } = require('../utils/drives.js')
const { Memory } = require('p2p-auth')

const createDriveCommand = async () => {
  const masterDb = getMasterDb()

  const { name, encrypted } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'encrypted',
      message: 'Should the drive be encrypted?',
      default: true
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the drive:',
      validate: async (input, answers) => {
        const { encrypted } = answers
        const hyperdrives = (await masterDb.getDetails('hyperdrive'))
        const names = hyperdrives.filter(d => !d.deleted_at && d.encrypted === encrypted).map(d => d.name)
        const titles = hyperdrives.filter(d => !d.deleted_at && d.encrypted === encrypted).map(d => d.title)

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

  const { details, drive } = await createDrive(masterDb, { name, encrypted })

  console.log(`New drive ${drive.id} created, for ${Memory.getKeyPair('pubkey')} key`)
  console.log('Details', details)
}

module.exports = { createDriveCommand }
