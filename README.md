node-modern-rcon [![npm package](https://img.shields.io/npm/v/modern-rcon.svg?style=flat-square)](https://www.npmjs.com/package/modern-rcon)
==============
A modern RCON client implementation written in ES2015

**NOTE: This has only been tested with Minecraft. So be aware of possible bugs with other server implementations. Feel free to submit a PR if you have any problems.**

## Installation

```
npm install modern-rcon --save
```

## API

#### `new Rcon(host, port = 25575, password, timeout = 5000)`

Creates a new `Rcon` object.

#### `rcon.connect()` -> `Promise`

Connects with the credentials provided in the constructor.

#### `rcon.send(data)` -> `Promise<string>`

Executes the provided command on the open connection and returns the response.

#### `rcon.disconnect()` -> `Promise`

Disconnects gracefully.

## Example

```javascript
const Rcon = require('modern-rcon');

const rcon = new Rcon('localhost', 'some password');

rcon.connect().then(() => {
  return rcon.send('help'); // That's a command for Minecraft
}).then(res => {
  console.log(res);
}).then(() => {
  return rcon.disconnect();
});
```

## Contribute

1. Install the dependencies with `npm install`
2. Setup a Minecraft Server for the tests by using `npm run setup-minecraft`  
   **Important: This script will automatically accept the [Minecraft EULA](https://account.mojang.com/documents/minecraft_eula)**

To run the tests you need to start the Minecraft Server with `npm run start-minecraft` in another Terminal.

## License

[MIT](LICENSE)