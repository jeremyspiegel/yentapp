var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fb = require('fb');

function isError(res) {
  return !res || res.error;
}

function getError(res) {
  return res ? res.error : new Error('request failed for unknown reason');
}

function getUserId(accessToken) {
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

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.post('/mothers', bodyParser.urlencoded({extended: false}), function(req, res) {
  getUserId(req.body.access_token)
    .then(function(info) {
      res.json(info);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).end('Facebook API request failed');
    });
});

app.get('/fbhook', function(req, res) {
  if (req.param('hub.mode') === 'subscribe' && req.param('hub.verify_token') === 'token') {
    res.send(req.param('hub.challenge'));
  } else {
    res.send(400);
  }
});

app.listen(app.get('port'), function() {
  console.log('Yentapp is running on port', app.get('port'));
});
