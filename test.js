/* globals describe, it, beforeEach, afterEach */
const HyperdriveTimeseries = require('.')
const hyperdrive = require('hyperdrive')
const memdb = require('memdb')
const assert = require('assert')

describe('HyperdriveTimeseries', function () {
  var db
  const interval = 1 // seconds
  beforeEach(() => {
    var drive = hyperdrive(memdb())
    db = new HyperdriveTimeseries(drive.createArchive({live: true, sparse: true}), {interval: interval})
  })

  afterEach(() => {
    db.close()
  })

  describe('#push', function () {
    it('should push a value into a buffer', function () {
      db.push('foo')

      assert.deepEqual(db._buffer[0].data, 'foo')
    })

    it('should flush value every interval', function (done) {
      this.timeout(5000)
      db.push('foo')

      db.once('flush', (key, size) => {
        assert.equal(size, 1)
        assert(key > Date.now() - interval * 1000)
        assert(key < Date.now())
        db.once('flush', (key, size) => {
          assert.equal(size, 1)
          assert(key > Date.now() - interval * 1000)
          assert(key < Date.now())
          done()
        })
        db.push('bar')
      })
    })
  })

  describe('#range', function () {
    it('should find value of specified time from archive', function (done) {
      var start = Date.now()
      db.push('foo')

      db.once('flush', (key, size) => {
        db.range(start, Date.now(), (err, result) => {
          assert.equal(err, null)
          assert.equal(result[0].data, 'foo')
          done()
        })
      })
    })
  })
})
