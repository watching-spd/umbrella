const fetch = require('node-fetch')
const sparkly = require('sparkly')

const debug = true
const rangeSize = 8*60*60*1000
const rangeEnd = Date.now()
const rangeStart = (new Date(rangeEnd - rangeSize)).getTime()
const binCount = 32

// in: nothing, out: Promise<Set<talkGroup>>
function getTalkGroups() {
  const url = 'https://api.openmhz.com/kcers1b/talkgroups'
  return fetch(url).then((res) => res.json()).then((json) => json.talkgroups)
}

// in: Set<talkGroup>, out: filtered Array<talkGroup>
function determineEncryptedTalkGroups(talkGroups) {
  return Object.keys(talkGroups).map((key) => talkGroups[key])
                   .filter((talkGroup) => talkGroup.group === "seattle police")
                   .filter((talkGroup) => talkGroup.tag === "law tac")
                   .map((talkGroup) => talkGroup.num)
}

// in: Array<talkGroup>, out: Promise<Array<call>>
// this is recursive; calls is an accumulator
async function getCallsForTalkGroups(talkGroups, startTime, calls) {
  if (!calls) calls = []
  if (!startTime) startTime = rangeStart
  if (debug) console.log(startTime)

  const filter = talkGroups.join('%2C')
  const url = `https://api.openmhz.com/kcers1b/calls/newer?time=${startTime}&filter-type=talkgroup&filter-code=${filter}`

  console.log('Fetching', url)
  const theseCalls = await fetch(url).then((res) => res.json()).then((json) => json.calls)
  if (theseCalls.length === 50) {
    if (debug) console.log('theseCalls[0].time', dateStringToUnixTime(theseCalls[0].time), theseCalls[0]._id)
    if (debug) console.log('theseCalls[49].time', dateStringToUnixTime(theseCalls[49].time), theseCalls[49]._id)
    return getCallsForTalkGroups(talkGroups, dateStringToUnixTime(theseCalls[49].time), [...calls, ...theseCalls])
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
    // console.log('bin start', binStart)
    // console.log('bin end', binEnd)
    // console.log('matching calls', matchingCalls)
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
  tweetBody += '#ProtestCommsSeattle'
  return tweetBody
}

function sendTweet() {
}

function dateStringToUnixTime(dateString) {
  return Date.parse(dateString)
}

async function main() {
  const talkGroups = await getTalkGroups()
  const encryptedTalkGroups = determineEncryptedTalkGroups(talkGroups)
  const calls = await getCallsForTalkGroups(encryptedTalkGroups)
  if (debug) console.log(calls.map((call) => `${call.time} (${call._id}) [${call.len}]`).join('\n'))
  const body = buildTweetBodyFromCalls(calls)
  if (debug) console.log(body)
}

main()
