// dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var PORT = process.env.PORT || 3000;

// use morgan and bodyparser with our app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// make public a static dir
app.use(express.static('public'));


// Database configuration with mongoose
mongoose.connect('mongodb://localhost/scraper');
var db = mongoose.connection;

// show any mongoose errors
db.on('error', function(err) {
    console.log('Mongoose Error: ', err);
});

// once logged in to the db through mongoose, log a success message
db.once('open', function() {
    console.log('Mongoose connection successful.');
});


// And we bring in our Note and Article models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// Routes

app.get('/', function(req, res) {
    res.send(index.html);
});

// A GET request to scrape the echojs website.
app.get('/scrape', function(req, res) {
    // first, we grab the body of the html with request
    request('https://www.reddit.com/r/news/', function(error, response, html) {
        // then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // now, we grab every .title class, and do the following:
        $('.title').each(function(i, element) {

            // save an empty result object
            var result = {};

            // add the text and href of every link, 
            // and save them as properties of the result obj
            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            // using our Article model, create a new entry.
            // this passes the result object to the entry (and the title and link)
            var entry = new Article(result);

            // now, save that entry to the db
            entry.save(function(err, doc) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(doc);
                }
            });


        });
    });
    // redirect back to main page 
    // res.redirect('/');
    //message when done scraping
    res.send("<h1>Scrape Complete</h1>\n" + "<p>There is a slight bug in the system. Please remove /scrape from the browser and press enter to return to the main page.</p>");

});

// this will get the articles we scraped from the mongoDB
app.get('/articles', function(req, res) {
    // grab every doc in the Articles array
    Article.find({}, function(err, doc) {
        if (err) {
            console.log(err);
        }
        else {
            res.json(doc);
        }
    });
});

// grab an article by it's ObjectId
app.get('/articles/:id', function(req, res) {
    // using the id passed in the id parameter, 
    // prepare a query that finds the matching one in our db...
    Article.findOne({ '_id': req.params.id })
        .populate('note')
        .exec(function(err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.json(doc);
            }
        });
});


//create a comment for the article
app.post('/articles/:id', function(req, res) {
    // create a new note and pass the req.body to the entry.
    var newNote = new Note(req.body);

    // and save the new note the db
    newNote.save(function(err, doc) {
        if (err) {
            console.log(err);
        }
        else {
            Article.findOneAndUpdate({ '_id': req.params.id }, {'note': doc._id })
                .exec(function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });
        }
    });
});

// Delete Note from the DB
app.post('/delete/:id', function(req, res) {
    Article.find({'_id': req.params.id}, 'note', function(err, doc){
        Note.find({'_id': doc[0].note}).remove().exec(function(err, doc){
            if(err) {
                console.log(err);
            }
        });
    });
    //this gets rid of note associated with article
    Article.findOneAndUpdate({'_id': req.params.id}, {$unset: {'note':1}}).exec(function(err, doc){
        if(err) {
            console.log(err);
        } else {
            res.send(doc);
        }
    });

});





// listen on port
app.listen(PORT, function() {
    console.log('App running on port 3000!');
});
