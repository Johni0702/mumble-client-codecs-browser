import { Transform } from 'stream'
import createPool from 'reuse-pool'
import webworkify from 'webworkify'
import toArrayBuffer from 'to-arraybuffer'

import decodeWorker from './decode-worker'

const pool = createPool(function () {
  return webworkify(decodeWorker)
})
// Prepare first worker
pool.recycle(pool.get())

class DecoderStream extends Transform {
  constructor () {
    super({ objectMode: true })

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
    if (chunk.frame) {
      const buffer = toArrayBuffer(chunk.frame)
      this._worker.postMessage({
        action: 'decode' + chunk.codec,
        buffer: buffer,
        target: chunk.target,
        position: chunk.position
      }, [buffer])
    } else {
      this._worker.postMessage({
        action: 'decode' + chunk.codec,
        buffer: null,
        target: chunk.target,
        position: chunk.position
      })
    }
    callback()
  }

  _flush (callback) {
    this._worker.postMessage({ id: this._id++, action: 'reset' })
    this._flushCallback = () => {
      pool.recycle(this._worker)
      this._worker = null
      callback()
    }
  }
}

export default DecoderStream
