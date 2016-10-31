const openwhisk = require('openwhisk')

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

let openWhiskClient = null

function fetchActivation (activationId) {
  return openWhiskClient.activations.get({ activation: activationId }).catch(error => {
    console.log(`[${activationId}] ${typeof activationId}`)
    console.log(error)

    //ui.terminate()
  })
}

function main () {
  const ui = new UI(fetchActivation)

  loadClient().then(owClient => {
    openWhiskClient = owClient
    ui.setStatus('Loading activations...')

    owClient.activations.list({ skip: 0, limit: 100, docs: true }).then(result => {
      ui.setStatus('Activations loaded.')
      ui.addActivations(result)
    })
  }).catch(error => {
    console.error(error)
    ui.terminate()
  })
}

module.exports.main = main
