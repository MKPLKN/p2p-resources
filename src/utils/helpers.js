const fs = require('fs/promises')

const toTitleCase = (str) => {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const toKebabCase = (str) => {
  return str.toLowerCase().replace(/\s+/g, '-')
}

async function deleteDirectory (path, opts = {}) {
  if (path) {
    try {
      await fs.rm(path, { recursive: true, force: true, ...opts })
      console.log(`Directory ${path} has been removed`)
      return true
    } catch (error) {
      console.error(`Error while deleting directory: ${error.message}`)
      return false
    }
  } else {
    console.log('storagePath is not provided or invalid')
    return false
  }
}

module.exports = {
  toTitleCase,
  toKebabCase,
  deleteDirectory
}
