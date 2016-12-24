const assert = require('./patchedAssert');

const Rcon = require('../rcon');

describe('rcon', () => {
  describe('#constructor', () => {
    it('throws if required arguments are missing', () => {
      assert.throws(() => new Rcon(), /"host" argument must be not empty/);
      assert.throws(() => new Rcon('some-random-host'), /"password" argument must be not empty/);
    });
  });

  describe('#connect', () => {
    it('does not throw if password is right', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await assert.doesNotThrowAsync(rcon.connect.bind(rcon), /Authentication failed/);
      assert.strictEqual(rcon.hasAuthed, true);
    });

    it('again connects successfully after disconnect', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await rcon.connect();
      await rcon.disconnect();
      await assert.doesNotThrowAsync(rcon.connect.bind(rcon), /Instance is already authed/);
    });

    it('throws if host is not available', async () => {
      const rcon = new Rcon('some-random-host', 'some password');
      await assert.throwsAsync(rcon.connect.bind(rcon), /getaddrinfo ENOTFOUND some-random-host some-random-host:25575/);
    });

    it('throws if connection refuses', async () => {
      const rcon = new Rcon('localhost', 12345, 'some password');
      await assert.throwsAsync(rcon.connect.bind(rcon), /connect ECONNREFUSED 127\.0\.0\.1:12345/);
    });

    it('throws if password is wrong', async () => {
      const rcon = new Rcon('localhost', 'some wrong password');
      await assert.throwsAsync(rcon.connect.bind(rcon), /Authentication failed/);
    });

    it('throws if you try to connect twice', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await rcon.connect();
      await assert.throwsAsync(rcon.connect.bind(rcon), /Instance is already authed/);
    });
  });

  describe('#send', () => {
    it('can execute commands and returns the response as string', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await rcon.connect();
      await assert.strictEqual(await rcon.send('someunknowncommand'), 'Unknown command. Try /help for a list of commands');
    });

    it('throws if connection not already established', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await assert.throwsAsync(rcon.send.bind(rcon, 'someunknowncommand'), /Instance is not authed/);
    });

    // NOTE: Test is deactivated because a timeout of one millisecond is not always enough
    xit('throws if command execution takes longer than timeout', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await rcon.connect();
      rcon.timeout = 1;
      await assert.throwsAsync(rcon.send.bind(rcon, 'someunknowncommand'), /Request timed out/);
    });
  });

  describe('#disconnect', () => {
    it('does not throw and clears all data', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await rcon.connect();
      await assert.doesNotThrowAsync(rcon.disconnect.bind(rcon));
      assert.strictEqual(rcon.hasAuthed, false);
      assert.strictEqual(rcon._tcpSocket, null);
      assert.strictEqual(rcon._callbacks.size, 0);
    });

    it('throws if no connection was established', async () => {
      const rcon = new Rcon('localhost', 'the one and the only one');
      await assert.throwsAsync(rcon.disconnect.bind(rcon), /Instance is not authed/);
    });
  });
});
