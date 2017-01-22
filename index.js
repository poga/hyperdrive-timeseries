const events = require('events')
const later = require('later')
var inherits = require('inherits')
const toStream = require('string-to-stream')
const toString = require('stream-to-string')
const async = require('async')

module.exports = HyperdriveTimeseries

function HyperdriveTimeseries (archive, opts) {
  events.EventEmitter.call(this)
  this._archive = archive
  this._buffer = []
  this._intervalSecond = opts.interval
  this._interval = later.parse.recur().every(opts.interval).second()

  this._timer = later.setInterval(() => {
    if (this._buffer.length === 0) return

    var key = Math.floor(new Date(later.schedule(this._interval).prev(1)).getTime() / 1000)
    var ws = this._archive.createFileWriteStream(`${key}`)

    toStream(JSON.stringify(this._buffer)).pipe(ws).on('finish', () => {
      var pushed = this._buffer.length
      this._buffer = []
      this.emit('flush', key * 1000, pushed)
    })
  }, this._interval)
}

inherits(HyperdriveTimeseries, events.EventEmitter)

HyperdriveTimeseries.prototype.push = function (data) {
  this._buffer.push({ts: Date.now(), data: data})
}

HyperdriveTimeseries.prototype.close = function () {
  this._timer.clear()
}

HyperdriveTimeseries.prototype.range = function (start, end, cb) {
  // TODO might be easier if we have snapshot?
  this._archive.list((err, entries) => {
    if (err) return cb(err)

    var results = []
    var keysToRead = []
    entries.forEach(e => {
      var entryTime = new Date(parseInt(e.name, 10)).getTime()
      if ((entryTime + this._intervalSecond) * 1000 >= start && entryTime * 1000 < end) {
        keysToRead.push(e.name)
      }
    })

    async.each(keysToRead, (key, next) => {
      toString(this._archive.createFileReadStream(key), (err, body) => {
        if (err) next(err)

        JSON.parse(body).forEach(x => { results.push(x) })
        next()
      })
    }, (err) => {
      if (err) cb(err)

      cb(null, results)
    })
  })
}
