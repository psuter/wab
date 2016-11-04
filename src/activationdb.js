const homedir = require('homedir')
const Loki = require('lokijs')
const path = require('path')

// This module requires a working OpenWhisk client, and maintains a local view
// of the activations accessible through it.
// In particular, it can:
//  - poll for new activations
//  - fetch activation details on demand
//  - synchronize with a local store

// Supported options:
//   - pollingFrequency: #milliseconds. 0 or less disables polling. Default 0.
function ActivationDB (openWhiskClient, options = {}) {
  const self = this

  const dbFileName = path.join(homedir(), '.wskwabdb.json')

  this.activationDB = null

  this.pollingFrequency = +options.pollingFrequency || 0
  this.client = openWhiskClient
  this.listeners = []

  this.db = new Loki(dbFileName, {
    autosave: true,
    autosaveInterval: 1000,
    autoload: true,
    persistenceAdapter: 'fs',
    autoloadCallback: () => self.onLokiLoaded()
  })
}

ActivationDB.prototype.onLokiLoaded = function () {
  this.activationDB = this.db.getCollection('activations')
  if (!this.activationDB) {
    this.activationDB = this.db.addCollection('activations', {
      unique: [ 'activationId' ]
    })
  }

  if (this.pollingFrequency > 0) {
    this.pollingIntervalID = setInterval(() => this.fetchActivations(), this.pollingFrequency)
  } else {
    this.pollingIntervalID = null
  }

  if (this.activationDB.data.length > 0 && this.listeners.length > 0) {
    for (let listener of this.listeners) {
      listener(this.activationDB.chain().find().simplesort('start', true).data())
    }
  }

  // First one is free.
  this.fetchActivations()
}

ActivationDB.prototype.fetchActivations = function () {
  const self = this

  const startingEmpty = (this.activationDB.data.length === 0)

  let options = {
    skip: 0,
    limit: 100,
    docs: true
  }

  if (!startingEmpty) {
    options.since = this.activationDB.chain().find().simplesort('start', true).data()[0].start
  }

  this.client.activations.list(options).then(activations => {
    const withoutDuplicates = activations.filter(a => {
      const r = self.activationDB.by('activationId', a.activationId)
      return !r
    })

    if (withoutDuplicates.length > 0) {
      self.activationDB.insert(withoutDuplicates)
      self.db.save()

      for (let listener of self.listeners) {
        listener(withoutDuplicates)
      }
    }
  })
}

// FIXME: either remove, or lookup DB first, etc.
ActivationDB.prototype.fetchActivation = function (activationId) {
  const inCollection = this.activationDB.by('activationId', activationId)

  if (inCollection) {
    return Promise.resolve(inCollection)
  } else {
    return this.client.activations.get({ activation: activationId })
  }
}

ActivationDB.prototype.shutdown = function () {
  if (this.pollingIntervalID) {
    clearInterval(this.pollingIntervalID)
  }
  this.db.close()
}

ActivationDB.prototype.on = function (eventName, callback) {
  if (eventName === 'newActivations') {
    this.listeners.push(callback)

    if (this.activationDB) {
      return this.activationDB.chain().find().simplesort('start', true).data()
    } else {
      return []
    }
  } else {
    throw new Error(`Unsupported event type: ${eventName}.`)
  }
}

module.exports = ActivationDB
