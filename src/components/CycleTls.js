const initCycleTLS = require("cycletls")

let cycleTLSInstance

async function initializeCycleTLS() {
  cycleTLSInstance = await initCycleTLS()
}

async function exitCycleTLS() {
  cycleTLSInstance.exit()
}

function getCycleTLSInstance() {
  return cycleTLSInstance
}

module.exports = {
  initializeCycleTLS,
  getCycleTLSInstance,
  exitCycleTLS,
}
