import { Encoder as OpusEncoder } from 'libopus.js'
import { Encoder as Celt7Encoder } from 'libcelt7.js'
import toArrayBuffer from 'to-arraybuffer'

const MUMBLE_SAMPLE_RATE = 48000

export default function (self) {
  var opusEncoder, celt7Encoder
  self.addEventListener('message', e => {
    const data = e.data
    if (data.action === 'reset') {
      if (opusEncoder) {
        opusEncoder.destroy()
        opusEncoder = null
      }
      if (celt7Encoder) {
        celt7Encoder.destroy()
        celt7Encoder = null
      }
      self.postMessage({reset: true})
    } else if (data.action === 'encodeOpus') {
      if (!opusEncoder) {
        opusEncoder = new OpusEncoder({
          unsafe: true,
          channels: data.numberOfChannels,
          rate: MUMBLE_SAMPLE_RATE
        })
      }
      const encoded = opusEncoder.encode(new Float32Array(data.buffer))
      const buffer = toArrayBuffer(encoded)
      self.postMessage({
        target: data.target,
        buffer: buffer,
        position: data.position
      }, [buffer])
    } else if (data.action === 'encodeCELT_Alpha') {
      if (!celt7Encoder) {
        celt7Encoder = new Celt7Encoder({
          unsafe: true,
          channels: data.numberOfChannels,
          frameSize: MUMBLE_SAMPLE_RATE / 100,
          rate: MUMBLE_SAMPLE_RATE
        })
      }
      const encoded = celt7Encoder.encode(new Float32Array(data.buffer), 960)
      const buffer = toArrayBuffer(encoded)
      self.postMessage({
        target: data.target,
        buffer: buffer,
        position: data.position
      }, [buffer])
    }
  })
}
