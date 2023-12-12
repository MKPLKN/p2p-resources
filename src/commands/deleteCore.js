import inquirer from 'inquirer'
import { getMasterDb } from '../utils/masterComponents.js'
import { deleteCore } from '../utils/cores.js'

export const deleteCoreCommand = async () => {
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
      message: answers => `Are you sure you want to purge all data from the core '${answers.selectedCore.name}'? This action cannot be undone. Please confirm.`,
      default: false
    }
  ])

  if (!confirmDelete) {
    return console.log('Deletion cancelled.')
  }

  console.log(`You chose to DELETE "${selectedCore.name}" core.`)
  await deleteCore({ db: masterDb, key: selectedCore.key })
  console.log('Deletion completed.')
}
