const wskprops = require('./src/wskprops')
const openwhisk = require('openwhisk')

const clientPromise = wskprops.retrieve().then(function (props) {
  return openwhisk({
    api: `https://${props.apiHost}/api/v1/`,
    api_key: props.auth,
    namespace: props.namespace || '_'
  })
}).catch(function (error) {
  console.error(`There was an error initializing the OpenWhisk client: ${error}.`)
})

clientPromise.then(function (owClient) {
  owClient.activations.list({ skip: 0, limit: 2 }).then(function (result) {
    for (let a of result) {
      console.log(a.activationId)
    }
  })
})

clientPromise.then(owClient => {
  owClient.activations.get({ activation: 'f3bc22bbec3243009d5be425b9bb1eda' }).then(result => {
    console.log(JSON.stringify(result))
  })
})
