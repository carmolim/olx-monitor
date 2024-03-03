const $logger = require("./Logger.js")
const { getCycleTLSInstance } = require("./CycleTls")
const { requestsFingerprints } = require("../requestsFingerprints.js")

const headers = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
}

const httpClient = async (url) => {
  const cycleTLS = await getCycleTLSInstance()

  const randomRequestFingerprint =
    requestsFingerprints[
      Math.floor(Math.random() * requestsFingerprints.length)
    ]

  try {
    // Send request
    const response = await cycleTLS(
      url,
      {
        userAgent: randomRequestFingerprint[0],
        ja3: randomRequestFingerprint[1],
        headers,
      },
      "get"
    )

    return response.body
  } catch (error) {
    $logger.error(error)
  }
}

module.exports = httpClient
