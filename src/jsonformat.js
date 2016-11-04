const moment = require('moment')

function render (obj) {
  // return JSON.stringify(obj, null, 2)
  return r(obj, 0, true)
}

function i (n) {
  let result = ''
  for (let i = 0; i < n; ++i) {
    result = result + '  '
  }
  return result
}

function r (any, indent = 0, topLevel = false) {
  const to = typeof any

  if (to === 'boolean') {
    return colorConst(any ? 'true' : 'false')
  } else if (to === 'number') {
    return colorConst('' + any)
  } else if (to === 'string') {
    return colorConst(JSON.stringify(any)) // will escape etc.
  } else if (to === 'object') {
    if (any === null) {
      return colorConst('null')
    } else if (Array.isArray(any)) {
      return ra(any, indent, topLevel)
    } else {
      return ro(any, indent, topLevel)
    }
  } else {
    throw new Error(`Unsupported type: ${to}.`)
  }
}

function ra (arr, indent, topLevel = false) {
  // FIXME inline arrays for numbers/booleans/nulls/empty things?
  if (arr.length === 0) {
    return '[]'
  }
  let result = '[\n'
  for (let e of arr) {
    result = result + i(indent + 1) + r(e, indent + 1) + ',\n'
  }
  result = result.substring(0, result.length - 2) + '\n'
  return result + i(indent) + ']'
}

function ro (obj, indent, topLevel = false) {
  let result = '{\n'
  let empty = true
  for (let k in obj) {
    if (topLevel && k === '$loki') {
      // A little hackish, I'll give you that.
      continue
    }
    empty = false
    result = result + i(indent + 1) + colorObjectKey(JSON.stringify(k)) + ': ' + r(obj[k], indent + 1) + ',\n'
  }
  if (empty) {
    // FIXME how does one find that out earlier..
    return '{}'
  }
  result = result.substring(0, result.length - 2) + '\n'
  return result + i(indent) + '}'
}

function renderLogs (logArray) {
  let result = ''
  for (let line of logArray) {
    // Expected format..
    if (line.length >= 38 && line[37] === ':' && line[30] === ' ') {
      const datePart = line.substring(0, 30)
      const strmPart = line.substring(31, 37)
      const dateStr = moment(datePart).format('YYYY-MM-DD HH:mm:ss')

      let txt = `${dateStr}: ${line.substring(39)}`
      result = result + (strmPart === 'stderr' ? `{red-fg}${txt}{/red-fg}` : txt) + '\n'
    } else {
      result = result + line + '\n'
    }
  }
  return result
}

function colorObjectKey (str) {
  return `{blue-fg}${str}{/blue-fg}`
}

function colorConst (str) {
  return `{red-fg}${str}{/red-fg}`
}

module.exports.render = render
module.exports.renderLogs = renderLogs
