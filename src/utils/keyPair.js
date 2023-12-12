let keyPairInstance = null

export const setKeyPair = (keyPair) => {
  keyPairInstance = {
    ...keyPair,
    publicKeyHex: keyPair.publicKey.toString('hex'),
    pubkey: keyPair.publicKey.toString('hex')
  }
}

export const getKeyPair = (key = null) => {
  if (!keyPairInstance) {
    throw new Error('KeyPair is not initialized')
  }
  return key ? keyPairInstance[key] ?? null : keyPairInstance
}
