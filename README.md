Let's figure out how openMHZ works.

Recipes (Chrome debugger, with result of talkgroups api call as variable temp1)

#### All tags in all groups
Object.keys(temp1.talkgroups)
      .map((key) => temp1.talkgroups[key])
      .map((talkGroup) => talkGroup.tag)
      .reduce((collection, tag) => {
        if (collection.indexOf(tag) === -1) {
          collection.push(tag)
        }
        return collection
      }, [])

Results:
["fire-talk","fire-tac","fire dispatch","ems-tac","emergency ops","law talk","law dispatch","law tac","business","public works","security","utilities","multi-tac","schools","interop","transportation","ems dispatch","corrections","hospital","ems-talk"]

#### All groups with (tac or encrypt) and SPD in their short names
Object.keys(temp1.talkgroups).map((key) => temp1.talkgroups[key]).map((group) => `${group.num}: ${group.alpha}`).reduce((collection, talkGroup) => { if(collection.indexOf(talkGroup) === -1) collection.push(talkGroup); return collection; }, []).filter((talkGroup) => talkGroup.includes("Tac") || talkGroup.includes("tac") || talkGroup.includes("Encrypt") || talkGroup.includes("encrypt")).filter((talkGroup) => talkGroup.includes("SPD"))

10 results for this filter, all look correct visually

#### All groups with group "seattle police" and tag "law tac"
Object.keys(temp1.talkgroups).map((key) => temp1.talkgroups[key])
      .filter((talkGroup) => talkGroup.group === "seattle police")
      .filter((talkGroup) => talkGroup.tag === "law tac")

32 results, including training, narcotics, hostage negotiator, TMobile field events, etc. Interesting!

#### All group numbers for groups with group "seattle police" and tag "law tac"
Object.keys(temp1.talkgroups).map((key) => temp1.talkgroups[key])
      .filter((talkGroup) => talkGroup.group === "seattle police")
      .filter((talkGroup) => talkGroup.tag === "law tac")
      .map((talkGroup) => talkGroup.num)

#### "Get talk groups"
https://api.openmhz.com/kcers1b/talkgroups

#### "Get calls" by filter
https://api.openmhz.com/kcers1b/calls?filter-type=group&filter-code=5ee350e04983d0002586456f
https://api.openmhz.com/kcers1b/calls/older?time=1609515932000&filter-type=group&filter-code=5ee350e04983d0002586456f

#### "Get calls" by talkgroup name
https://api.openmhz.com/kcers1b/calls?filter-type=talkgroup&filter-code=1616%2C1680%2C1744

#### Plan
Quick testing shows I can fit 32 spark segments per line on mobile. Let's do 15 minutes per segment, for a total of 8 hours of "coverage". Each segment costs 2 "twitter characters".

#### Example tweet
All segments are 15 minute intervals.

Frequency (min: 0, max: 4):
▁▃▄▇▄▃▄█▁▃▄▇▄▃▄█▁▃▄▇▄▃▄█▄▃▄█

Longest scan, seconds (min: 15, max: 287):
▁▃▄▇▄▃▄█▁▃▄▇▄▃▄█▁▃▄▇▄▃▄█▄▃▄█
