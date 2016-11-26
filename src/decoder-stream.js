import { Transform } from 'stream'
import createPool from 'reuse-pool'
import webworkify from 'webworkify'
import toArrayBuffer from 'to-arraybuffer'

import decodeWorker from './decode-worker'

var pid = 0
const pool = createPool(function () {
  var o = webworkify(decodeWorker)
  o.id = pid++
  return o
})
// Prepare first worker
pool.recycle(pool.get())
var id = 0

class DecoderStream extends Transform {
  constructor () {
    super({ objectMode: true })

    this._gid = id++
    this._id = 0
    this._worker = pool.get()
    console.log(this._gid, this._worker.id)
    this._worker.onmessage = msg => {
      if (this._worker.objectURL) {
        // The object URL can now be revoked as the worker has been loaded
        window.URL.revokeObjectURL(this._worker.objectURL)
        this._worker.objectURL = null
      }
      console.log(this._gid, msg.data)
      this._onMessage(msg.data)
    }
  }

  _onMessage (data) {
    if (data.action === 'decoded') {
      this.push({
        target: data.target,
        pcm: new Float32Array(data.buffer),
        numberOfChannels: data.numberOfChannels,
        position: data.position
      })
    } else if (data.action === 'reset') {
      this._flushCallback()
    } else {
      throw new Error('unexpected message:' + data)
    }
  }

  _transform (chunk, encoding, callback) {
    console.log(this._gid, 'transform', this._id)
    if (chunk.frame) {
      const buffer = toArrayBuffer(chunk.frame)
      this._worker.postMessage({
        id: this._id++,
        action: 'decode' + chunk.codec,
        buffer: buffer,
        target: chunk.target,
        position: chunk.position
      }, [buffer])
    } else {
      this._worker.postMessage({
        id: this._id++,
        action: 'decode' + chunk.codec,
        buffer: null,
        target: chunk.target,
        position: chunk.position
      })
    }
    callback()
  }

  _flush (callback) {
    console.log(this._gid, 'flush')
    this._worker.postMessage({ id: this._id++, action: 'reset' })
    this._flushCallback = () => {
      pool.recycle(this._worker)
      this._worker = null
      console.log(this._gid, 'flush_cb')
      callback()
    }
  }
}

export default DecoderStream
