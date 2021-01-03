// The old strategy for getting calls involved looking up all tactical talkgroups
// Unfortunately, most of those are unencrypted
// This is worth keeping around in case I need to do anything similar later...

// example usage:
// const talkGroups = await getTalkGroups()
// const encryptedTalkGroups = determineEncryptedTalkGroups(talkGroups)

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

// in: Set<talkGroup>, out: filtered Array<talkGroup>
function determineEncryptedTalkGroups(talkGroups) {
  return Object.keys(talkGroups).map((key) => talkGroups[key])
                   .filter((talkGroup) => talkGroup.group === "seattle police")
                   .filter((talkGroup) => talkGroup.tag === "law tac")
                   .map((talkGroup) => talkGroup.num)
}

// in: nothing, out: Promise<Set<talkGroup>>
function getTalkGroups() {
  const url = 'https://api.openmhz.com/kcers1b/talkgroups'
  return fetch(url).then((res) => res.json()).then((json) => json.talkgroups)
}

