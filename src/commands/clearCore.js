const inquirer = require('inquirer')
const { getMasterDb } = require('../utils/masterComponents.js')
const { clearCore } = require('../utils/cores.js')

const clearCoreCommand = async () => {
  const masterDb = await getMasterDb()
  const resources = await masterDb.getResources({ resource: 'hypercore' })

  const { selectedCore, confirmDelete } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedCore',
      message: 'Select a core:',
      choices: resources.map(c => ({ name: `${c.details.storagePath} - ${c.details.title}`, value: c.details }))
    },
    {
      type: 'confirm',
      name: 'confirmDelete',
      message: answers => `Are you sure you want to clear all data from the core '${answers.selectedCore.name}'? This action cannot be undone. Please confirm.`,
      default: false
    }
  ])

  if (!confirmDelete) {
    return console.log('Clear command cancelled.')
  }

  console.log(`You chose to CLEAR "${selectedCore.name}" core.`)
  await clearCore({ db: masterDb, key: selectedCore.key })

  console.log('Clear command completed.')
}

module.exports = { clearCoreCommand }
