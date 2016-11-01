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

  this.db = new Loki(path.join(homedir(), '.wskwabdb.json'))

  this.activationDB = this.db.addCollection('activations', {
    unique: [ 'activationId' ]
  })

  this.pollingFrequency = +options.pollingFrequency || 0
  this.client = openWhiskClient
  this.listeners = []

  // 0 in this array is always most recent.
  this.activations = []

  self.onLokiLoaded()
}

ActivationDB.prototype.onLokiLoaded = function () {
  /*this.activationDB = this.db.getCollection('activations')
  if (this.activationDB === null) {
    this.activationDB = this.db.addCollection('activations')
  }
*/
  if (this.pollingFrequency > 0) {
    this.pollingIntervalID = setInterval(this.fetchActivations(), this.pollingFrequency)
  } else {
    this.pollingIntervalID = null
  }

  // First one is free.
  this.fetchActivations()
}

ActivationDB.prototype.fetchActivations = function () {
  const self = this

  const startingEmpty = (this.activations.length === 0)

  let options = {
    skip: 0,
    limit: 100,
    docs: true
  }

  if (!startingEmpty) {
    options.since = this.activations[0].start
  }

  this.client.activations.list(options).then(activations => {
    // Loki handles batch insert just fine.
    self.activationDB.insert(activations)

    for (let listener of self.listeners) {
      listener(activations)
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
    return this.activations.slice()
  } else {
    throw new Error(`Unsupported event type: ${eventName}.`)
  }
}

module.exports = ActivationDB
