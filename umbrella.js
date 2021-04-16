const fetch = require('node-fetch')
const sparkly = require('sparkly')
const defaults = {
  // enable for verbose output
  debug: false,

  // enable to tweet the result instead of just logging it to stdout
  tweet: false
}
const cliArgs = require('minimist')(process.argv.slice(2), defaults)

const debug = cliArgs.debug
const rangeSize = 8*60*60*1000
const rangeEnd = Date.now()
const rangeStart = (new Date(rangeEnd - rangeSize)).getTime()
const binCount = 32
const hashtag = '#SeattleEncryptedComms'

// this is recursive; calls is an accumulator
// in: nothing (all args optional and used only for recursing), out: Promise<Array<call>>
async function getEncryptedCalls(startTime, calls) {
  if (!startTime) startTime = rangeStart
  if (!calls) calls = []
  if (debug) console.log(startTime)

  // the filter-code (5efd78...) filters for SPD encrypted
  const url = `https://api.openmhz.com/kcers1b/calls/newer?time=${startTime}&filter-type=group&filter-code=5efd784760e5840025aebad8`

  console.log('Fetching', url)
  const theseCalls = await fetch(url).then((res) => res.json()).then((json) => json.calls)
  if (theseCalls.length === 50) {
    if (debug) console.log('theseCalls[0].time', dateStringToUnixTime(theseCalls[0].time), theseCalls[0]._id)
    if (debug) console.log('theseCalls[49].time', dateStringToUnixTime(theseCalls[49].time), theseCalls[49]._id)
    return getEncryptedCalls(dateStringToUnixTime(theseCalls[49].time), [...calls, ...theseCalls])
  } else {
    return [...calls, ...theseCalls]
  }
}

function bin(calls) {
  const bins = []
  while(bins.length < binCount) {
    const binStart = rangeStart + bins.length * rangeSize / binCount
    const binEnd = rangeStart + (bins.length + 1) * rangeSize / binCount
    const matchingCalls = calls.filter((call) => dateStringToUnixTime(call.time) >= binStart && dateStringToUnixTime(call.time) < binEnd)
    bins.push(matchingCalls)
  }

  return bins
}

function buildFrequencySparkline(calls) {
  const binsOfFreqs = bin(calls).map((bin) => bin.length)
  const min = [...binsOfFreqs].sort((a, b) => a - b)[0]
  const max = [...binsOfFreqs].sort((a, b) => b - a)[0]
  if (debug) console.log(binsOfFreqs)
  return `Frequency (calls, min: ${min}, max: ${max}): \n${sparkly(binsOfFreqs)}`
}

function buildDurationSparkline(calls) {
  const bins = bin(calls)
  const binsOfLengths = bins.map((bin) => {
    const lengths = bin.map((call) => call.len)
    lengths.sort((a, b) => b - a)
    return lengths[0] || 0
  })
  const min = [...binsOfLengths].sort((a, b) => a - b)[0]
  const max = [...binsOfLengths].sort((a, b) => b - a)[0]
  if (debug) console.log(binsOfLengths)
  return `Duration (seconds, min: ${min}, max: ${max}): \n${sparkly(binsOfLengths)}`
}

function buildTweetBodyFromCalls(calls) {
  let tweetBody = 'Each segment is a 15 minute interval.\n\n'
  tweetBody += `${buildFrequencySparkline(calls)}\n\n`
  tweetBody += `${buildDurationSparkline(calls)}\n\n`
  tweetBody += hashtag
  return tweetBody
}

async function sendTweet(body) {
  const Twitter = require('twitter')
  const secrets = require('./secrets.json')
  const client = new Twitter(secrets)
  return client.post('statuses/update', { status: body })
}

function dateStringToUnixTime(dateString) {
  return Date.parse(dateString)
}

async function main() {
  const calls = await getEncryptedCalls()
  if (debug) {
    const lineItems = calls.map((call) => {
      let lineItem = ''
      lineItem += `${call.time} `
      lineItem += `${call._id} `
      lineItem += `[${call.len}] `
      // lineItem += `talkgroup ${talkGroups[call.talkgroupNum].description} ${call.talkgroupNum}`
      lineItem += `talkgroup ${call.talkgroupNum}`
      return lineItem
    })
    console.log(lineItems.join('\n'))
  }
  if (!calls.length) {
    if (debug) console.log("No encrypted calls for this period")
    return
  }
  const body = buildTweetBodyFromCalls(calls)
  if (debug) console.log(body)
  if (cliArgs.tweet) {
    if (debug) console.log('Submitting tweet')
    const response = await sendTweet(body)
    if (debug) console.log('Submitted tweet', response)
  }
}

main()
