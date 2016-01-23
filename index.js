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

app.get('/child-of/:id', function(req, res) {
  res.sendFile(__dirname + '/public/child-of.html');
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

var yents = [];
yents.push({
  motherId: 108500652866978,
  childId: 115174682198616,
  motherToken: 'CAAXsM7yAFHgBAA2WQqKieQQNh2VOKqbtJDU6NHZB3ZA0FEntQGZAhHgxxhXE3GpSmwvTzXQyewq2HSDgY3XggsstqBC0y1U3HLPeoSXo4thdJRIQHIl98jHXQ7flW8kAZBQT4EbceAeKgW6KQnwgsmUoNGdZCMKZBrJ93eh2izOzYKE7y2uZC2kzooZBUBNglXZBQtXw4Q4IQVQZDZD',
  childToken: 'CAAXsM7yAFHgBAD4qwb5WaOJYplFauj3fmBUOjH7TTx0f8MrLgjYHWE5IZCJ2QyT4nJNpjdTzLanyuMSUfZCyaiDa8fzFIuo5WAiCxTXseLimiheI5q26jd0iw8nOXHux5pM4N4mM8fQwYBbLb153pmyThv7NknMLhuqgRKMbGNeiCYumRySUbpDwZCaZBThkqBwbgaLa8lawZAYsdSdAz'
});

var commentingTools = require('./comments');

//setInterval(poll, 1000);

function poll() {
  for (var i = 0; i < yents.length; ++i) {
    checkFeed(yents[i], 'me/feed?fields=picture,type,story,message,caption,description,place');
  }
}

function checkFeed(yent, url) {
  fb.fbApi(url, yent.childToken)
	.then(function(feed) {
		feed.data.forEach(function(post) {
	    fb.fbApi(post.id + '/comments', yent.childToken)
	    	.then(function(comments) {
	        if (comments.data.length === 0) {
	          commentOnPost(yent, post);
	        }
	      })
	      .catch(function(err) {
	      	console.log(err);
	      });
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
