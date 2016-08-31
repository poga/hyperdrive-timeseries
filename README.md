# Hyperdrive Timeseries

Share timeseries data with p2p hyperdrive.

## Synopsis

```javascript
const ts = require('hyperdrive-timeseries')
const hyperdrive = require('hyperdrive')
const memdb = require('memdb')

var drive = hyperdrive(memdb())
var archive = drive.createArchive({live: true, sparse: true})
var db = ts(archive, {interval: 1}) // flush every 1 second

db.on('flush', (key, size) => {
  // called with filename(key) and flushed data count(size)
})

var begin = Date.now()
db.push('foo') // push a value with timestamp: now

var end = Date.now()
db.range(begin, end, (err, values) => {
  console.log(values) // [{ts: ..., data: 'foo'}]
})
```

## Install

```
npm i hyperdrive-timeseries
```

## License

MIT
