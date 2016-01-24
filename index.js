var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var request = require('request-json');
var client = request.createClient('https://graph.facebook.com/');

var db = require('./lib/db')();
var fb = require('./lib/fb');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/dumpdb', function(req, res) {
  res.json(db.dump());
});

app.get('/yents', function(req, res) {
  res.json(db.yents());
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

app.get('/invitation-sent', function(req, res) {
  res.sendFile(__dirname + '/public/invitation-sent.html');
});

app.get('/child-signup/:id', function(req, res) {
  res.sendFile(__dirname + '/public/child-signup.html');
});

app.post('/child-signup/:id', bodyParser.urlencoded({extended: false}), function(req, res) {
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
      db.addChild(req.params.id, user.id);
      res.json(user);
    })
    .catch(function(err) {
      console.error(err);
      res.status(500).end('Failed to add child');
    });
});

app.listen(app.get('port'), function() {
  console.log('Yentapp is running on port', app.get('port'));
});

var commentingTools = require('./comments');

setInterval(poll, 15000);

function poll() {
  var yents = db.yents();
  
  for (var i = 0; i < yents.length; ++i) {
    checkFeed(yents[i], 'me/feed?fields=picture,type,story,message,caption,description,place,comments&since=1+minute+ago');
  }
}

function checkFeed(yent, url) {
  fb.fbApi(url, yent.childToken)
	.then(function(feed) {
		feed.data.forEach(function(post) {
			if (!post.comments || post.comments.data.length === 0) {
	          commentOnPost(yent, post);
	        }
	  });
    if (feed.paging) {
      checkFeed(yent, feed.paging.next);
    }
  })
  .catch(function(err) {
  	console.log(err);
  });
}

function commentOnPost(yent, post) {
  var comment = commentingTools.makeComments(commentingTools.parsingPost(post));
  if (!comment) {
    return;
  }
  console.log(comment);
  client.post(post.id + '/comments?access_token=' + yent.motherToken, { message: comment }, function(error, res, body) {
    console.log(res.body);
  });
}
