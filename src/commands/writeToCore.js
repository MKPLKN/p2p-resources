import inquirer from 'inquirer'
import { getMasterDb } from '../utils/masterComponents.js'
import { writeToCore } from '../utils/cores.js'

export const writeToCoreCommand = async () => {
  const masterDb = await getMasterDb()
  const resources = await masterDb.getResources({ resource: 'hypercore' })

  const { selectedCore, textToWrite } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedCore',
      message: 'Select a core:',
      choices: resources.map(c => ({ name: `${c.details.storagePath} - ${c.details.title}`, value: c.details }))
    },
    {
      type: 'input',
      name: 'textToWrite',
      message: 'Enter the text you want to write to the core:',
      validate: input => {
        if (input.trim() === '') {
          return 'Content cannot be empty'
        }

        return true
      }
    }
  ])

  await writeToCore({ db: masterDb, key: selectedCore.key, data: textToWrite })

  console.log(`You successfully wrote "${textToWrite}" into "${selectedCore.name}" core!`)
}
