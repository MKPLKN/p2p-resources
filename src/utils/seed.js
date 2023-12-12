let seedInstance = null

export const setSeed = (seed) => {
  seedInstance = seed
}

export const getSeed = () => {
  if (!seedInstance) {
    throw new Error('Seed is not initialized')
  }
  return seedInstance
}
