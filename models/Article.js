// require mongoose
var mongoose = require('mongoose');
// create Schema class
var Schema = mongoose.Schema;

// Create article schema
var ArticleSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    link: {
        type: String,
        required: true,
        unique: true
    },
    // this only saves one note's ObjectId. ref refers to the Note model.
    note: {
        type: Schema.Types.ObjectId,
        ref: 'Note'
    }
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model('Article', ArticleSchema);

// export the model
module.exports = Article;
