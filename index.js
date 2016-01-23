var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.post('/mothers', bodyParser.urlencoded({extended: false}), function(req, res) {
  console.log(req.body);
  res.end();
});

app.listen(app.get('port'), function() {
  console.log('Yentapp is running on port', app.get('port'));
});
