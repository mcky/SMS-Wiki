var express = require('express')
	, bodyParser = require('body-parser')
	, app = express()
	, request = require('request')
	, sanitizeHtml = require('sanitize-html')
	, twilio = require('twilio');

var port = process.env.PORT || 3000;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('/', function(req, res){
	res.send('running')
})


app.route('/twilio')
	.all(function(req, res){
		var q = req.param('q')
		if(typeof q === 'undefined'){
			q = req.body.Body
		}

		console.log('search: ', q)
		wikiSearch(req, res, q)
	})

var sendSMS = function(req, res, body) {
	var twiml = new twilio.TwimlResponse();
	twiml.message(clean);
	res.writeHead(200, { 'Content-Type':'text/xml' });
	res.end(twiml.toString());
}

var wikiArticle = function(req, res, query) {
	var queryEncoded = encodeURIComponent(query)
		, wikiUrl = 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&format=json&titles='+queryEncoded

	request(wikiUrl, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var wikiContent = JSON.parse(body)
				, pageID = Object.keys(wikiContent.query.pages)
				, extract = wikiContent.query.pages[pageID].extract
				, firstParagraph = extract.split(/(\W|^)<\/p>(\W|$)/)[0]
				, clean = sanitizeHtml(firstParagraph, {
					allowedTags: []
				})

			sendSMS(req, res, clean)
		}
	})
}

var wikiSearch = function(req, res, query) {

	var queryEncoded = encodeURIComponent(query)
		,queryUrl = 'http://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&srprop&format=json&srsearch='+queryEncoded

	request(queryUrl, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var wikiContent = JSON.parse(body)
				,wikiTitle = wikiContent.query.search[0].title

			wikiArticle(req, res, wikiTitle)
		}
	})
}

var server = app.listen(port, function() {
	console.log('Listening on port %d', server.address().port)
})
