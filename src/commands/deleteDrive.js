const inquirer = require('inquirer')
const { getMasterDb } = require('../utils/masterComponents.js')
const { deleteDrive } = require('../utils/drives.js')

const deleteDriveCommand = async () => {
  const masterDb = getMasterDb()
  const resources = await masterDb.getResources({ resource: 'hyperdrive' })

  const { selectedDrive, confirmDelete } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedDrive',
      message: 'Select a drive:',
      choices: resources.map(c => ({ name: `${c.details.storagePath} - ${c.details.title}`, value: c.details }))
    },
    {
      type: 'confirm',
      name: 'confirmDelete',
      message: answers => `Are you sure you want to purge all data from the drive '${answers.selectedDrive.name}'? This action cannot be undone. Please confirm.`,
      default: false
    }
  ])

  if (!confirmDelete) {
    return console.log('Deletion cancelled.')
  }

  console.log(`You chose to DELETE "${selectedDrive.name}" drive.`)
  await deleteDrive({ db: masterDb, key: selectedDrive.key })
  console.log('Deletion completed.')
}

module.exports = { deleteDriveCommand }
