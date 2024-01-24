const inquirer = require('inquirer')
const { getMasterDb } = require('../utils/masterComponents.js')
const { deleteResource } = require('../utils/nodes.js')

const deleteDhtNodeCommand = async () => {
  const masterDb = await getMasterDb()
  const resources = await masterDb.getResources({ resource: 'hyperdht' })

  const { selectedDHT, confirmDelete } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedDHT',
      message: 'Select a DHT:',
      choices: resources.map(c => ({ name: `${c.details.storagePath} - ${c.details.title}`, value: c.details }))
    },
    {
      type: 'confirm',
      name: 'confirmDelete',
      message: answers => `Are you sure you want to delete '${answers.selectedDHT.name}' DHT node? This action cannot be undone. Please confirm.`,
      default: false
    }
  ])

  if (!confirmDelete) {
    return console.log('Deletion cancelled.')
  }

  console.log(`You chose to DELETE "${selectedDHT.name}" DHT node.`)
  await deleteResource({ db: masterDb, key: selectedDHT.key })
  console.log('Deletion completed.')
}

module.exports = { deleteDhtNodeCommand }
