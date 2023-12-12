import inquirer from 'inquirer'
import { getMasterDb } from '../utils/masterComponents.js'

export const readCoreCommand = async () => {
  const masterDb = await getMasterDb()
  const resources = await masterDb.getResources({ resource: 'hypercore' })

  const { selectedCore } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedCore',
      message: 'Select a core:',
      choices: resources.map(c => ({ name: `${c.details.storagePath} - ${c.details.title}`, value: c.details }))
    }
  ])

  console.log(`You chose to read "${selectedCore.name}" core.`)
  const core = resources.find(r => r.details.resourceKey === selectedCore.key).hypercore

  // Read the full core
  const stream = core.createReadStream()
  for await (const data of stream) {
    console.log('Data: ', data.toString())
  }
}
