var db = require('../db'),
    Super = require('./base'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    Model = require('../models/step');

var Collection = Super.extend({
    model: Model
});
module.exports = Collection;
