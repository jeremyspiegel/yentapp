var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var db = require('./lib/db')();
var fb = require('./lib/fb');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/dumpdb', function(req, res) {
  res.json(db.dump());
});

app.post('/mothers', bodyParser.urlencoded({extended: false}), function(req, res) {
  var accessToken = req.body.access_token;
  if (accessToken === undefined) {
    return res.status(400).end('missing access token');
  }
  
  fb.getMe(accessToken)
    .then(function(user) {
      db.createMomIfNotExists(user.id, accessToken);
      res.json({id: user.id, name: user.name});
    })
    .catch(function(err) {
      console.error(err);
      res.status(400).end('Invalid access token');
    });
});

app.post('/child-of/:id', bodyParser.urlencoded({extended: false}), function(req, res) {
  var accessToken = req.body.access_token;
  if (accessToken === undefined) {
    return res.status(400).end('missing access token');
  }
  
  var mom = db.getMom(req.params.id);
  if (mom === undefined) {
    return res.status(404).end('bad mom id');
  }
  
  fb.getMe(accessToken)
    .then(function(user) {
      db.createChild(user.id, accessToken);
      db.addChild(mom, user.id);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).end('Failed to add child');
    });
});

app.get('/fbhook', function(req, res) {
  if (req.param('hub.mode') === 'subscribe' && req.param('hub.verify_token') === 'token') {
    res.send(req.param('hub.challenge'));
  } else {
    res.send(400);
  }
});

var posts = [];
app.post('/fbhook', function(req, res) {
  res.send(200);
  posts.push(req.body);
});

app.get('/posts', function(req, res) {
  res.send(posts);
});

app.listen(app.get('port'), function() {
  console.log('Yentapp is running on port', app.get('port'));
});
