import fs from 'fs'
import path from 'path'

let cachedConfig = null

let defaultConfig = {
  resourcesLocation: './.p2p-resources'
}

export function setConfig (key, value) {
  if (typeof key === 'object') {
    defaultConfig = { ...defaultConfig, ...key }
  } else {
    defaultConfig[key] = value
  }

  return defaultConfig
}

export const loadConfigs = () => {
  // Read JSON config file
  const configPath = path.join(process.cwd(), 'shareit-config.json')
  let configData = defaultConfig

  if (fs.existsSync(configPath)) {
    const rawConfigData = fs.readFileSync(configPath, 'utf8')
    configData = {
      ...defaultConfig,
      ...JSON.parse(rawConfigData)
    }
  }

  cachedConfig = {
    ...configData
  }

  return cachedConfig
}

// Getter function
export const getConfig = (key = null, defaultValue = null) => {
  if (cachedConfig === null) {
    loadConfigs()
  }

  if (key === null) {
    return cachedConfig
  }

  return Object.prototype.hasOwnProperty.call(cachedConfig, key) ? cachedConfig[key] : defaultValue
}
