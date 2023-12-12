#!/usr/bin/env node
import { program } from 'commander'
import authenticate from '../src/auth/index.js'
import listCommand from '../src/commands/list.js'
import { createCoreCommand } from '../src/commands/createCore.js'
import { deleteCoreCommand } from '../src/commands/deleteCore.js'
import { writeToCoreCommand } from '../src/commands/writeToCore.js'
import { readCoreCommand } from '../src/commands/readCore.js'
import { clearCoreCommand } from '../src/commands/clearCore.js'
import { createDriveCommand } from '../src/commands/createDrive.js'
import { deleteDriveCommand } from '../src/commands/deleteDrive.js'
import { initMasterComponents } from '../src/index.js'

const startCLI = async () => {
  await authenticate()
  await initMasterComponents()

  program
    .command('list')
    .description('List all resources')
    .action(listCommand)

  program
    .command('write')
    .description('Write to selected core')
    .action(writeToCoreCommand)

  program
    .command('read')
    .description('Read from core')
    .action(readCoreCommand)

  program
    .command('create:core')
    .alias('add:core')
    .alias('make:core')
    .description('Create a new core')
    .action(createCoreCommand)

  program
    .command('clear:core')
    .description('Clear an existing core')
    .action(clearCoreCommand)

  program
    .command('delete:core')
    .alias('del:core')
    .description('Delete an existing core')
    .action(deleteCoreCommand)

  program
    .command('create:drive')
    .alias('add:drive')
    .alias('make:drive')
    .description('Create a new drive')
    .action(createDriveCommand)

  program
    .command('delete:drive')
    .alias('del:drive')
    .description('Delete an existing drive')
    .action(deleteDriveCommand)

  program.parse(process.argv)
}

startCLI().catch(error => console.error(error))
