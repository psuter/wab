const fs = require('fs')
const path = require('path')
const homedir = require('homedir')

function parseContent (content) {
  const lines = content.split('\n').map(l => l.trim())

  let host = null
  let auth = null
  let nspc = null

  for (let line of lines) {
    let parts = line.split('=')
    if (parts.length === 2) {
      if (parts[0] === 'APIHOST') {
        host = parts[1]
      } else if (parts[0] === 'AUTH') {
        auth = parts[1]
      } else if (parts[0] === 'NAMESPACE') {
        nspc = parts[1]
      }
    }
  }

  if (host && auth) {
    return Promise.resolve({
      apiHost: host,
      auth: auth,
      namespace: nspc || undefined
    })
  } else {
    return Promise.reject('APIHOST and/or AUTH undefined in .wskprops.')
  }
}

function retrieve () {
  return new Promise(
    function (resolve, reject) {
      const wskpropsPath = path.join(homedir(), '.wskprops')

      fs.readFile(wskpropsPath, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.toString('utf8'))
        }
      })
    }
  ).then(parseContent)
};

module.exports.retrieve = retrieve
