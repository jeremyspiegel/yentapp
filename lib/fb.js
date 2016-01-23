var fb = require('fb');

function isError(res) {
  return !res || res.error;
}

function getError(res) {
  return res ? res.error : new Error('request failed for unknown reason');
}

module.exports.getMe = function(accessToken) {
  return new Promise(function(resolve, reject) {
    fb.api('me', {access_token: accessToken}, function(res) {
      if (isError(res)) {
        reject(getError(res));
      } else {
        resolve(res);
      }
    });
  });
}
