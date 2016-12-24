const net = require('net');
const { Buffer } = require('buffer');

class ExtendableError extends Error {
  constructor(message = '') {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class RconError extends ExtendableError {
  constructor(message) {
    super(message);
  }
}

const PacketType = {
  AUTH: 0x03,
  COMMAND: 0x02,
  RESPONSE_AUTH: 0x02,
  RESPONSE_VALUE: 0x00
};
Object.freeze(PacketType);

class Rcon {
  constructor(host, port, password, timeout) {
    if (!host || !host.trim()) throw new TypeError('"host" argument must be not empty');
    this.host = host;
    if (typeof port === 'string') {
      [port, password, timeout] = [null, port, password];
    }
    this.port = port || 25575;
    if (!password || !password.trim()) throw new TypeError('"password" argument must be not empty');
    this.password = password;
    this.timeout = timeout || 5000;

    this.hasAuthed = false;
    this._tcpSocket = null;
    this._callbacks = new Map();
    this._timedOutRequests = [];
    this._authPacketId = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.hasAuthed) return reject(new RconError('Instance is already authed'));

      this._tcpSocket = net.createConnection(this.port, this.host);

      this._tcpSocket.on('connect', () => {
        this.send(this.password, PacketType.AUTH).then(() => {
          this.hasAuthed = true;
          return resolve();
        }).catch(reject);
      });
      this._tcpSocket.on('data', this._handleResponse.bind(this));
      this._tcpSocket.on('error', reject);
      this._tcpSocket.on('end', () => {
        this.hasAuthed = false;
        this._tcpSocket = null;
        this._callbacks.clear();
      });
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      if (!this.hasAuthed) return reject(new RconError('Instance is not authed'));

      this._tcpSocket.once('error', reject);
      this._tcpSocket.once('end', resolve);
      this._tcpSocket.end();
    });
  }

  _handleResponse(data) {
    const len = data.readInt32LE(0);
    if (!len) throw new RconError('Received empty response package');

    const id = data.readInt32LE(4);
    if (this._timedOutRequests.includes(id)) {
      this._timedOutRequests.splice(this._timedOutRequests.indexOf(id), 1);
      return;
    }

    const type = data.readInt32LE(8);

    if (type === PacketType.RESPONSE_AUTH && id === -1) {
      this._callbacks.get(this._authPacketId)(null, new RconError('Authentication failed'));
    } else if (this._callbacks.has(id)) {
      let str = data.toString('utf8', 12, len + 2);
      if (str.charAt(str.length - 1) === '\n') {
        str = str.substring(0, str.length - 1);
      }

      this._callbacks.get(id)(str);
    } else {
      throw new RconError('Responded id did not match sent id');
    }
  }

  send(data, cmd) {
    cmd = cmd || PacketType.COMMAND;

    return new Promise((resolve, reject) => {
      if (!this.hasAuthed && cmd !== PacketType.AUTH) {
        throw new RconError('Instance is not authed');
      }

      const length = Buffer.byteLength(data);
      const id = Math.trunc(Math.random() * (0x98967F - 0xF4240) + 0xF4240);
      if (cmd === PacketType.AUTH) {
        this._authPacketId = id;
      }
      const buf = Buffer.allocUnsafe(length + 14);

      buf.writeInt32LE(length + 10, 0);
      buf.writeInt32LE(id, 4);
      buf.writeInt32LE(cmd, 8);
      buf.write(data, 12);
      buf.fill(0x00, length + 12);

      this._tcpSocket.write(buf.toString('binary'), 'binary');

      const requestTimeout = setTimeout(() => {
        this._timedOutRequests.push(id);

        this._callbacks.delete(id);
        if (cmd === PacketType.AUTH) {
          this._authPacketId = null;
        }

        return reject(new RconError('Request timed out'));
      }, this.timeout);

      this._callbacks.set(id, (data, err) => {
        clearTimeout(requestTimeout);
        this._callbacks.delete(id);
        if (cmd === PacketType.AUTH) {
          this._authPacketId = null;
        }

        if (err) return reject(err);
        resolve(data);
      });
    });
  }
}

module.exports = Rcon;
module.exports.RconError = RconError;
