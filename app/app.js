var express = require('express')
	, bodyParser = require('body-parser')
	, app = express()
	, request = require('request')
	, sanitizeHtml = require('sanitize-html')
	, twilio = require('twilio');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('/', function(req, res){
	res.send('running')
})

app.route('/twilio')
	.post(function(req,res){
		console.log(req.body.Body)
		wiki(req, res, req.body.Body)
	})

var wiki = function(req, res, query) {
	var queryEncoded = encodeURIComponent(query)
		, wikiUrl = 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&titles='+queryEncoded+'&format=json'

	request(wikiUrl, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var wikiContent = JSON.parse(body)
				, pageID = Object.keys(wikiContent.query.pages)
				, extract = wikiContent.query.pages[pageID].extract
				, firstParagraph = extract.split(/(\W|^)<\/p>(\W|$)/)[0]
				, clean = sanitizeHtml(firstParagraph, {
					allowedTags: []
				})

			var twiml = new twilio.TwimlResponse();
			twiml.message(clean);
			res.writeHead(200, { 'Content-Type':'text/xml' });
			res.end(twiml.toString());
		}
	})
}

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port)
})
