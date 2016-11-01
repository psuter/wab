const openwhisk = require('openwhisk')

const ActivationDB = require('./activationdb')
const UI = require('./ui')
const wskprops = require('./wskprops')

function loadClient () {
  return wskprops.retrieve().then(props => {
    return openwhisk({
      api: `https://${props.apiHost}/api/v1/`,
      api_key: props.auth,
      namespace: props.namespace || '_'
    })
  }).catch(function (error) {
    console.error(`There was an error initializing the OpenWhisk client: ${error}.`)
  })
}

function main () {
  loadClient().then(owClient => {
    const activationDB = new ActivationDB(owClient)
    const ui = new UI(activationDB)
  }).catch(error => {
    console.error(error)
  })
}

module.exports.main = main
