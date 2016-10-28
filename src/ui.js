const blessed = require('blessed')

// Will be a callback of type activationId => Promise[Activation]
let fetchActivation = null

let screen = null
let activationList = null
let activationPane = null
let statusBar = null

let allActivations = []

function rerender (doIt) {
  if (doIt) {
    screen.render()
  }
}

function makeActivationList () {
  activationList = blessed.list({
    top: 0,
    left: 0,
    height: '50%-1',
    width: '100%',
    style: {
      selected: {
        fg: 'white',
        bg: 'green'
      }
    }
  })
}

function makeActivationPane () {
  activationPane = blessed.box({
    top: '50%',
    left: 0,
    height: '50%-1',
    width: '100%'
  })
}

function makeStatusBar () {
  statusBar = blessed.box({
    bottom: 0,
    left: 0,
    height: 1,
    width: '100%',
    fg: 'white',
    bg: 'blue'
  })
}

function addActivations (activations) {
  for (let a of activations) {
    let txt = `${a.activationId} ${a.name}`
    activationList.pushItem(txt)
  }
  rerender(true)

  allActivations = allActivations.concat(activations)
}

function setMainMode (render = true) {
  screen.key([ 'escape', 'q', 'C-c' ], function (ch, key) {
    terminate()
  })

  screen.key([ 'j', 'down' ], (ch, key) => {
    activationList.down(1)
    rerender(true)
  })

  screen.key([ 'k', 'up' ], (ch, key) => {
    activationList.up(1)
    rerender(true)
  })

  screen.key([ 'enter' ], (ch, key) => {
    loadActivation(activationList.selected)
  })

  screen.append(activationList)

  screen.append(blessed.line({
    orientation: 'horizontal',
    top: '50%-1',
    height: 1,
    width: '100%',
    left: 0,
    type: 'line'
  }))

  screen.append(activationPane)
  screen.append(statusBar)
}

function setStatus (msg) {
  statusBar.setContent(msg)
  rerender(true)
}

function loadActivation (id) {
  const activationId = allActivations[id].activationId
  setStatus(`Retrieving activation ${activationId}...`)

  fetchActivation(activationId).then(activation => {
    activationPane.setContent(JSON.stringify(activation, null, 2))
    rerender(true)

    setStatus('Done.')
  }).catch(error => {
    setStatus(`There was an error retrieving activation ${id}: ${error}.`)
  })
}

/* This function starts it all. Only way out after that is a fatal error, or
 * the user exiting. In both cases the process terminates.
 * It would be cleaner if such a factory method returned (a promise of?) an
 * object with all the other methods, but meh.
 */
function start (activationFetcher) {
  fetchActivation = activationFetcher

  screen = blessed.screen({
    smartCSR: true,
    // debug: true,
    plip: 'plop'
  })

  screen.on('resize', () => {
    screen.render()
  })

  makeActivationList()
  makeActivationPane()
  makeStatusBar()

  setMainMode()

  screen.render()
}

function terminate () {
  process.exit(0)
}

module.exports = {
  start: start,
  setStatus: setStatus,
  addActivations: addActivations,
  terminate: terminate
}
