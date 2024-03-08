# p2p-resources
> This is an experimental package and is subject to changes, including breaking changes.

> 02/2024 @TODO [`p2p-auth 2.0`](https://github.com/MKPLKN/p2p-auth) switched to [`Keypear`](https://github.com/holepunchto/keypear), which allows simplifying many of this package's functionalities.

## A Brief Overview

The package has an `initMasterComponents` function that creates [`Hypercore`](https://github.com/holepunchto/hypercore) and [`Hyperbee`](https://github.com/holepunchto/hyperbee) based on the authenticated user (authenticated user = KeyPair in memory, handled by [`p2p-auth`](https://github.com/MKPLKN/p2p-auth)).

"Master components" are the main data structure/database for an authenticated user, which is used to store all the other resources the given user may create. For example, using `p2p-resources create:core`, you can authenticate as any user and create a public or private [`Hypercore`](https://github.com/holepunchto/hypercore) that is dedicated to the app you're building.

The child keypair used to create the new [`Hypercore`](https://github.com/holepunchto/hypercore) is derived from the "Master key" (the original user key pair), and the derivation path is stored in the master DB. The data is then available anytime the user needs to re-create or access the [`Hypercore`](https://github.com/holepunchto/hypercore). The authentication itself is based on a username/password that is then stored in the user's local filesystem.

## Usage Example

This is an example of how I have used this package to build p2p apps.

```js
// Create or restore user
import { createUser, restoreUser } from 'p2p-auth'
await createUser({ username, password })
await restoreUser({ seedPhrase, username, password })

// Authenticate the user
import { authUser } from 'p2p-auth'
await authUser({ username, password })
// Create DB for your app
const { masterDb } = await initMasterComponents()
const user = new User({ db: masterDb })
await user.createPrivateDatabase({ name: 'you-app' })

// Whenever the user needs to read/write something
const encryptedDatabaseDedicatedForYourApp = await masterDb.findResourceByName('your-app')
// Lets say your app has some settings the user can change
const settings = await encryptedDatabaseDedicatedForYourApp.getJsonValue('settings')
settings.allowNotifications = false
await encryptedDatabaseDedicatedForYourApp.putJson('settings', settings)
// You can find a helper class named "HandyBee" in './src/utils/databases.js'
// The HandyBee class serves as a basic (handy) helper wrapper and is subject to changes.

// User.js
import { createCore, createDrive } from 'p2p-resources'

class User {
  constructor ({ db }) {
    this.db = db
  }

  async getResources (opts) {
    return this.db.getResources(opts)
  }

  async createDatabase (opts = {}) {
    const { name } = opts
    await createCore(this.db, { name, encrypted: false })
  }

  async createPrivateDatabase (opts = {}) {
    const { name } = opts
    await createCore(this.db, { name, encrypted: true })
  }

  async createFilesystem (opts = {}) {
    const { name } = opts
    await createDrive(this.db, { name, encrypted: false })
  }

  async createPrivateFilesystem (opts = {}) {
    const { name } = opts
    await createDrive(this.db, { name, encrypted: true })
  }
}
```

## CLI

Before executing each CLI command, the user is authenticated (using [`p2p-auth`](https://github.com/MKPLKN/p2p-auth)), and the master components are initialized. The master DB is then utilized to store all necessary information (derivation path) regarding the created resources' key pairs, enabling the authenticated user to access them anywhere, at any time.

#### `p2p-resources create:core`
This command creates a new [`Hypercore`](https://github.com/holepunchto/hypercore) for the authenticated user. A child key pair, derived from the master key pair, is generated.

It prompts the user to name the new resource and decide if it should be encrypted. By default, resources are encrypted. The encryption key is derived from the master key pair.

#### `p2p-resources create:drive`
This command creates a new [`Hyperdrive`](https://github.com/holepunchto/hyperdrive) (p2p filesystem) for the authenticated user. Similar to `create:core`, a child key pair is created, derived from the master key pair.

It asks for a name for the new resource and whether it should be encrypted. The default setting is to encrypt resources, using an encryption key based on the master key pair.

#### `p2p-resources delete:core`
This command deletes a selected core. The list of available cores is fetched from the master DB.

#### `p2p-resources delete:drive`
This command deletes a selected drive. The list of available drives is fetched from the master DB.
