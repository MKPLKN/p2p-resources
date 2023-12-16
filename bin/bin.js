#!/usr/bin/env node
const { program } = require('commander')
const authenticate = require('../src/auth/index.js')
const { listCommand } = require('../src/commands/list.js')
const { createCoreCommand } = require('../src/commands/createCore.js')
const { deleteCoreCommand } = require('../src/commands/deleteCore.js')
const { writeToCoreCommand } = require('../src/commands/writeToCore.js')
const { readCoreCommand } = require('../src/commands/readCore.js')
const { clearCoreCommand } = require('../src/commands/clearCore.js')
const { createDriveCommand } = require('../src/commands/createDrive.js')
const { deleteDriveCommand } = require('../src/commands/deleteDrive.js')
const { initMasterComponents } = require('../src/index.js')

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
