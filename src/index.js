import authenticate from './auth/index.js'
import { getKeyPair, setKeyPair } from './utils/keyPair.js'
import { initMasterComponents, getMasterComponents } from './utils/masterComponents.js'
import { getSeed, setSeed } from './utils/seed.js'
import { getUser, setUser } from './utils/user.js'

export { setKeyPair, getKeyPair, setSeed, getSeed, getUser, setUser, authenticate, initMasterComponents, getMasterComponents }
