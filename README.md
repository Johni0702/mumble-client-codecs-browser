# mumble-client-codecs-browsers

This module provides the [Opus codec] for the [mumble-client] module for use in the browser via [browserify].
Neither CELT nor Speex are supported at this time.
When native libraries are acceptable and more performance is required, consider using [mumble-client-codecs-node] instead.

[WebWorker]s are used for en/decoding.

### Usage

```javascript
var BrowserCodecs = require('mumble-client-codecs-browsers')

var client = new MumbleClient({
  username: 'Test',
  codecs: BrowserCodecs
})
```

### License
MIT

[Opus codec]: https://github.com/johni0702/libopus.js
[browserify]: http://browserify.org/
[mumble-client]: https://github.com/johni0702/mumble-client
[mumble-client-codecs-node]: https://github.com/johni0702/mumble-client-codecs-node
[WebWorker]: https://github.com/substack/webworkify
