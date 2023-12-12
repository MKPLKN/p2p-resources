let userInstance = null

export const setUser = (user) => {
  userInstance = user
}

export const hasUser = (user) => {
  return !!userInstance
}

export const getUser = () => {
  if (!userInstance) {
    throw new Error('User is not initialized')
  }
  return userInstance
}
