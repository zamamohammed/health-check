define(function(require) {
    var Backbone = require('backbone'),
        _ = require('underscore'),
        connection = require('connection'),
        B = require('bluebird'),
        Super = Backbone.Model;

    var Model = Super.extend({
        url: function() {
            return '/rest/' + this.name + (this.id ? '/' + this.id : '');
        },
        idAttribute: '_id'
    });

    Model.prototype.initialize = function(options) {
        var that = this,
            name = _.result(this, 'name');
        Super.prototype.initialize.call(this, options);

        that.connection = connection;
        that.resource = connection.resource(name);
    };

    Model.prototype.sync = function(method, model, options) {
        var that = this;
        options || (options = {});

        var success = options.success || function() {};
        var error = options.error || function() {};

        delete options.success;
        delete options.error;

        if (method === 'read' && !model.id) method = 'list';

        return new B(function(resolve, reject) {
            that.resource.sync(method, model, options, function(err, res) {
                if (err) {
                    error(err);
                    return reject(err);
                }
                success(res);
                return resolve(res);
            });
        });


    };

    Model.prototype.toJSON = function() {
        var data = Super.prototype.toJSON.apply(this, arguments);
        if (!data.id && this.id) {
            data.id = this.id;
        }
        return data;
    };

    return Model;
});