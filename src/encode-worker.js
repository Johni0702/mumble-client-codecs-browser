import { Encoder as OpusEncoder } from 'libopus.js'
import toArrayBuffer from 'to-arraybuffer'

const MUMBLE_SAMPLE_RATE = 48000

export default function (self) {
  var opusEncoder
  self.addEventListener('message', e => {
    const data = e.data
    if (data.action === 'reset') {
      if (opusEncoder) {
        opusEncoder.destroy()
        opusEncoder = null
      }
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
    }
  })
}
