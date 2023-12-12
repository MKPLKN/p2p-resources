import inquirer from 'inquirer'
import { createCore } from '../utils/cores.js'
import { getKeyPair } from '../utils/keyPair.js'
import { getMasterDb } from '../utils/masterComponents.js'
import { toKebabCase, toTitleCase } from '../utils/helpers.js'

export const createCoreCommand = async () => {
  const masterDb = getMasterDb()

  const { name, encrypted } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'encrypted',
      message: 'Should the core be encrypted?',
      default: true
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the core:',
      validate: async (input, answers) => {
        const { encrypted } = answers
        const hypercores = (await masterDb.getDetails('hypercore'))
        const names = hypercores.filter(d => !d.deleted_at && d.encrypted === encrypted).map(d => d.name)
        const titles = hypercores.filter(d => !d.deleted_at && d.encrypted === encrypted).map(d => d.title)

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

  const { details, core } = await createCore(masterDb, { name, encrypted })

  // const core = await makeCore(keyPair)
  console.log(`New core ${core.id} created, for ${getKeyPair('pubkey')} key`)
  console.log('Details', details)
}
