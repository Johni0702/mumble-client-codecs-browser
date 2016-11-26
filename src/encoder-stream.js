import { Transform } from 'stream'
import createPool from 'reuse-pool'
import webworkify from 'webworkify'

import encodeWorker from './encode-worker'

const pool = createPool(function () {
  return webworkify(encodeWorker)
})
// Prepare first worker
pool.recycle(pool.get())

class EncoderStream extends Transform {
  constructor (codec) {
    super({ objectMode: true })

    this._codec = codec

    this._worker = pool.get()
    this._worker.onmessage = msg => {
      if (this._worker.objectURL) {
        // The object URL can now be revoked as the worker has been loaded
        window.URL.revokeObjectURL(this._worker.objectURL)
        this._worker.objectURL = null
      }
      this._onMessage(msg.data)
    }
  }

  _onMessage (data) {
    this.push({
      target: data.target,
      codec: this._codec,
      frame: Buffer.from(data.buffer, data.byteOffset, data.byteLength),
      position: data.position
    })
  }

  _transform (chunk, encoding, callback) {
    var buffer = chunk.pcm.slice().buffer
    this._worker.postMessage({
      action: 'encode' + this._codec,
      target: chunk.target,
      buffer: buffer,
      numberOfChannels: chunk.numberOfChannels,
      position: chunk.position
    }, [buffer])
    callback()
  }

  _flush (callback) {
    this._cleanup()
    callback()
  }

  _cleanup () {
    this._worker.postMessage({ action: 'reset' })
    pool.recycle(this._worker)
  }
}

export default EncoderStream
