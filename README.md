## Umbrella
This is a tool for monitoring the amount of encrypted radio chatter from local police departments and (optionally) publishing this info to twitter. It does not include any sort of scheduler.

### Setup
If you don't intend to tweet, the only thing you'll need is a recent version of node.

If you want to tweet, you'll need to make a twitter account, apply for developer access, and then generate and save consumer keys and access tokens. Then, populate a file named `secrets.json` with these fields:
```json
{
  "consumer_key": "",
  "consumer_secret": "",
  "access_token_key": "",
  "access_token_secret": ""
}
```

### Using umbrella
To run it once: `node umbrella.js`. This will not publish to twitter. You can add these flags to customize behavior:
- `--tweet`: Publish to twitter
- `--debug`: Output debug info

#### Running on a schedule
Add a cron job to a machine that'll be up often. I recommend something like this, which will tweet and print debug logs to `/cron-log.log`: `0,15,30,45 * * * * /absolute/path/to/node /absolute/path/to/umbrella.js --tweet --debug > /cron-log.log 2>&1`

### Upcoming features
- Generalizable for different jurisdictions
- Graphs as images, not ascii sparklines
- Better metrics
- Alarming
