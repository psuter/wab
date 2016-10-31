const blessed = require('blessed')
const moment = require('moment')

const jsonformat = require('./jsonformat')

function UI (activationFetcher) {
  const self = this

  // One of: 'LIST', 'DETAILS'
  this.mode = 'LIST'

  // If true, only the result of an activation is shown.
  this.activationResultMode = false

  // The activation that was last loaded.
  this.currentActivation = null

  // FIXME replace with a proper class.
  this.fetchActivation = activationFetcher

  this.screen = blessed.screen({
    smartCSR: true,
    // debug: true,
    plip: 'plop' // FIXME
  })

  this.screen.on('resize', () => {
    self.screen.render()
  })

  this.fullBox = blessed.box({
    top: 0,
    left: 0,
    height: '100%-1',
    width: '100%'
  })

  this.topHalfBox = blessed.box({
    top: 0,
    left: 0,
    height: '50%-1',
    width: '100%',
    scrollable: false
  })

  this.bottomHalfBox = blessed.box({
    top: '50%',
    left: 0,
    height: '50%-1',
    width: '100%',
    scrollable: false
  })

  this.middleLine = blessed.line({
    orientation: 'horizontal',
    top: '50%-1',
    height: 1,
    width: '100%',
    left: 0,
    type: 'line',
    fg: 'green'
  })

  this.statusBar = blessed.box({
    bottom: 0,
    left: 0,
    height: 1,
    width: '100%',
    fg: 'white',
    bg: 'blue'
  })

  this.activationList = blessed.list({
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    style: {
      selected: {
        fg: 'white',
        bg: 'green'
      }
    },
    keys: true,
    vi: true,
    tags: true
  })

  this.activationPane = blessed.text({
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    scrollable: true,
    keys: true,
    vi: true,
    tags: true
  })

  this.allActivations = []

  this.screen.key([ 'C-c' ], (ch, key) => {
    self.terminate()
  })

  this.screen.key([ 'q', 'escape' ], (ch, key) => {
    if (self.mode === 'LIST') {
      self.terminate()
    } else if (self.mode === 'DETAILS') {
      self.setListMode()
    }
  })

  this.screen.key([ 'enter' ], (ch, key) => {
    if (self.mode !== 'DETAILS') {
      self.setDetailsMode()
    }
    self.loadActivation(self.activationList.selected)
  })

  this.activationPane.key([ 'r' ], (ch, key) => {
    self.activationResultMode = !self.activationResultMode
    self.showCurrentActivation()
  })

  this.setListMode()
}

UI.prototype.rerender = function (doIt) {
  if (doIt) {
    this.screen.render()
  }
}

function isTrigger (a) {
  return typeof a.start === 'number' && a.end === 0
}

function makeActivationRow (a) {
  const date = a.start || a.end
  const dateStr = date
    ? moment(date).format('YYYY-MM-DD HH:mm:ss')
    : '                   '
  return `{blue-fg}${dateStr}{/blue-fg} {green-fg}${a.activationId}{/green-fg} {bold}${a.name}{/bold}`
}

UI.prototype.addActivations = function (activations) {
  for (let a of activations) {
    let txt = makeActivationRow(a)
    this.activationList.pushItem(txt)
  }
  this.rerender(true)

  this.allActivations = this.allActivations.concat(activations)
}

UI.prototype.preDetach = function () {
  // Easier to remove all structure before rebuilding it.
  function detach (elem) {
    if (elem.parent) elem.detach()
  }

  detach(this.activationList)
  detach(this.activationPane)
  detach(this.statusBar)
  detach(this.fullBox)
  detach(this.topHalfBox)
  detach(this.bottomHalfBox)
  detach(this.middleLine)
}

UI.prototype.setListMode = function () {
  this.preDetach()

  this.fullBox.append(this.activationList)

  this.screen.append(this.fullBox)
  this.screen.append(this.statusBar)

  this.activationList.focus()

  this.screen.render()

  this.mode = 'LIST'
}

UI.prototype.setDetailsMode = function () {
  this.preDetach()

  this.topHalfBox.append(this.activationList)
  this.bottomHalfBox.append(this.activationPane)

  this.screen.append(this.topHalfBox)
  this.screen.append(this.middleLine)
  this.screen.append(this.bottomHalfBox)
  this.screen.append(this.statusBar)

  this.activationPane.focus()

  this.screen.render()

  this.mode = 'DETAILS'
}

UI.prototype.setStatus = function (msg) {
  this.statusBar.setContent(msg)
  this.rerender(true)
}

UI.prototype.loadActivation = function (id) {
  const self = this

  this.currentActivation = null
  this.activationPane.setContent('')
  this.rerender(true)

  const activationId = this.allActivations[id].activationId

  this.setStatus(`Retrieving activation ${activationId}...`)

  this.fetchActivation(activationId).then(activation => {
    self.currentActivation = activation
    self.showCurrentActivation()
    self.rerender(true)
    self.setStatus('Done.')
  }).catch(error => {
    self.setStatus(`There was an error retrieving activation ${id}: ${error}.`)
  })
}

UI.prototype.showCurrentActivation = function () {
  const toDisplay = this.activationResultMode
    ? (((this.currentActivation || {}).response) || {}).result
    : this.currentActivation

  if (toDisplay) {
    this.activationPane.setContent(jsonformat.render(toDisplay))
  } else {
    this.activationPane.setContent('')
  }
  this.rerender(true)
}

UI.prototype.terminate = function () {
  process.exit(0)
}

module.exports = UI
