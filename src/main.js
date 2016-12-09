const openwhisk = require('openwhisk')
const pkgJson = require('../package.json')

const ActivationDB = require('./activationdb')
const UI = require('./ui')
const wskprops = require('./wskprops')

function loadClient () {
  return wskprops.retrieve().then(props => {
    return openwhisk({
      api: `https://${props.apiHost}/api/v1/`,
      api_key: props.auth,
      namespace: '_', // all activations live in the default namespace currently.
      ignore_certs: process.env.NODE_TLS_REJECT_UNAUTHORIZED == "0"
    })
  }).catch(function (error) {
    console.error(`There was an error initializing the OpenWhisk client: ${error}.`)
  })
}

function main () {
  const commander = require('commander')

  commander
    .command(pkgJson.name)
    .version(pkgJson.version)
    .parse(process.argv)

  loadClient().then(owClient => {
    const activationDB = new ActivationDB(owClient, { pollingFrequency: 10000 })
    const ui = new UI(activationDB)
  }).catch(error => {
    console.error(error)
  })
}

module.exports.main = main
