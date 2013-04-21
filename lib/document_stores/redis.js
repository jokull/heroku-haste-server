var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
var winston = require('winston');

// For storing in redis
// options[type] = redis
// options[host] - The host to connect to (default localhost)
// options[port] - The port to connect to (default 5379)
// options[db] - The db to use (default 0)
// options[expire] - The time to live for each key set (default never)

var RedisDocumentStore = function(options, client) {
  this.expire = options.expire;
  if (client) {
    winston.info('using predefined redis client');
    RedisDocumentStore.client = client;
  } else if (!RedisDocumentStore.client) {
    winston.info('configuring redis');
    RedisDocumentStore.connect(options);
  }
};

// Create a connection according to config
RedisDocumentStore.connect = function(options) {
  RedisDocumentStore.client = redis;
};

// Save file in a key
RedisDocumentStore.prototype.set = function(key, data, callback, skipExpire) {
  var _this = this;
  RedisDocumentStore.client.set(key, data, function(err, reply) {
    if (err) {
      callback(false);
    }
    else {
      if (!skipExpire) {
        _this.setExpiration(key);
      }
      callback(true);
    }
  });
};

// Expire a key in expire time if set
RedisDocumentStore.prototype.setExpiration = function(key) {
  if (this.expire) {
    RedisDocumentStore.client.expire(key, this.expire, function(err, reply) {
      if (err) {
        winston.error('failed to set expiry on key: ' + key);
      }
    });
  }
};

// Get a file from a key
RedisDocumentStore.prototype.get = function(key, callback, skipExpire) {
  var _this = this;
  RedisDocumentStore.client.get(key, function(err, reply) {
    if (!err && !skipExpire) {
      _this.setExpiration(key);
    }
    callback(err ? false : reply);
  });
};

module.exports = RedisDocumentStore;
