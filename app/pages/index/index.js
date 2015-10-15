/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        MAIN = require('hbs!./index.tpl'),
        Backbone = require('backbone'),
        SiteEdit = require('./index/site-edit'),
        SiteWidget = require('./index/site-widget'),
        TypeWidget = require('./index/type-widget'),
        ExecutionStatus = require('models/execution-status'),
        Dialog = require('views/controls/dialog'),
        Sites = require('collections/site'),
        StatusCollection = require('collections/status'),
        Modules = require('collections/module'),
        Types = require('collections/type'),
        Site = require('models/site'),
        Status = require('models/status'),
        moment = require('moment'),
        StatusWidget = require('views/controls/status'),
        Chart = require('vendors/Chart.js/Chart.min'),
        GraphWidget = require('views/controls/graph'),
        StatCollection = require('collections/stat');

    var Page = Super.extend({});
    var activeTypeArray = [];

    Page.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(that, options);

        that.sites = new Sites();
        that.types = new Types();
        that.modules = new Modules();
        this.statuses = new StatusCollection();
        this.stats = new StatCollection();
        this.moduleNamesMap = {};
    };

    Page.prototype.renderStats = function(d, type) {
        var that = this;
        if (!d) {
            var currentMonth = window.app.user.get('stats').error.months.dates[window.app.user.get('stats').error.months.dates.length - 1].total;
            var lastMonth = window.app.user.get('stats').error.months.dates[window.app.user.get('stats').error.months.dates.length - 2].total;
            var percentage = ((currentMonth - lastMonth) / currentMonth) * 100;
           var statusWidget = new StatusWidget({
                errors: window.app.user.get('stats').error.total || 0,
                el: that.$el.find('.statuses'),
                yesterday: window.app.user.get('stats').error.days.dates.length < 2 ? 0 : window.app.user.get('stats').error.days.dates[window.app.user.get('stats').error.days.dates.length - 2].total || 0,
                weeks: window.app.user.get('stats').error.weeks.dates[window.app.user.get('stats').error.weeks.dates.length - 1] || 0,
                percentage: percentage
            });

            statusWidget.render();

            var graphWidget = new GraphWidget({
                el: that.$el.find('.status-graph'),
                type: type || 'days'
            });

            graphWidget.render();


        } else {
            var s = {
                el: that.$el.find('.statuses'),
                errors: 0,
                yesterday: 0,
                weeks: 0,
                months: 0
            };
            var month = 0, lastMonth = 0;
            var curMonth = moment().month();
            
            _.each(d, function(item) {
                s.errors += item.get('stats').error.total;
                s.yesterday += item.get('stats').error.days.dates.length < 2 ? 0 : item.get('stats').error.days.dates[item.get('stats').error.days.dates.length - 2].total || 0;
                s.weeks += (item.get('stats').error.weeks.dates[item.get('stats').error.weeks.dates.length - 1] || {}).total || 0;
                month += (item.get('stats').error.months.dates[item.get('stats').error.months.dates.length - 1] || {}).total;
                lastMonth += (item.get('stats').error.months.dates[item.get('stats').error.months.dates.length - 2] || {}).total;
                //s.percentage = item.get('stats').error.months.dates.length < 2 ? 100 : item.get('stats').error.months.dates[item.get('stats').error.months.dates.length - 1].total - item.get('stats').error.months.dates[item.get('stats').error.months.dates.length - 2].total / item.get('stats').error.months.dates[item.get('stats').error.months.dates.length - 1].total * 100
            });

            if(month - lastMonth === 0) {
                s.percentage = 0;
            } else {
                s.percentage = (month - lastMonth) / month * 100;    
            }            
            
            var statusWidget = new StatusWidget(s);

            statusWidget.render();
            
            var graphWidget = new GraphWidget({
                el: that.$el.find('.status-graph'),
                sites: d,
                type: type || 'days'
            });
    
            graphWidget.render();
        }

    };


    // Page.prototype.renderStatus = function(d) {
    //     var that = this;
    //     this.errors = d.findWhere({status: 0}).collection.length;
    //     var now = moment();
    //     var yesterday = 0;
    //     var weeks = 0;
    //     var lastMonth = 0;
    //     var thisMonth = 0;

    //     d.findWhere({status: 0}).collection.each(function(model) {
    //         if (moment(model.get('dateCreated')).isAfter(now.subtract(1, 'days'))) {
    //             yesterday++;
    //         }

    //         if (moment(model.get('dateCreated')).isAfter(now.subtract(1, 'weeks'))) {
    //             weeks++;
    //         }

    //         if (moment(model.get('dateCreated')).isBefore(now.subtract(1, 'months'))) {
    //             lastMonth++;
    //         }

    //         if (moment(model.get('dateCreated')).isAfter(now.subtract(1, 'months'))) {
    //             thisMonth++;
    //         }
    //     });

    //     var statusWidget = new StatusWidget({
    //         errors: this.errors || 0,
    //         el: that.$el.find('.statuses'),
    //         yesterday: yesterday || 0,
    //         weeks: weeks || 0,
    //         percentage: (thisMonth - lastMonth) / thisMonth  * 100
    //     });

    //     statusWidget.render();

    //     that.statuses.on('add change', that.renderStatus.bind(that));

    //     var graphWidget = new GraphWidget({
    //         el: that.$el.find('.status-graph')
    //     });

    //     graphWidget.render();
    // };

    Page.prototype.render = function() {
        var that = this;

        that.$el.html(MAIN({
            id: that.id
        }));

        that.renderStats(null, 'days');

        that.mapControls();

        var events = {};
        events['keyup ' + that.toId('query')] = 'onQueryKeyup';
        events['click ' + that.toId('new')] = 'onNewClick';
        events['click ' + that.toId('run-all')] = 'onRunAllClick';
        events['click ' + that.toId('stop')] = 'onStopClick';
        events['click ' + '.types .btn'] = 'onTypesClick';

        that.delegateEvents(events);

        that.sites.on('sync add', that.renderSites.bind(that));
        that.sites.on('remove', that.onSiteRemove.bind(that));
        that.sites.on('change', that.onSiteChange.bind(that));
        //that.statuses.on('sync', that.renderStatus.bind(that));
        //that.stats.on('sync', that.renderStats.bind(that));
        that.sites.on('update-module-labels', that.mapModuleNames.bind(that));

        that.on('search', that.performSearch.bind(that));
        that.layout.nav.on('search', that.performSearch.bind(that));
        that.layout.nav.on('add-new-site', that.onNewClick.bind(that));
        that.layout.nav.on('run-all-sites', that.onRunAllClick.bind(that));
        that.layout.nav.on('stop-all-sites', that.onStopClick.bind(that));


        B.resolve(that.sites.fetch()).
            then(function() {
                //that.setInitialAbbreviations();
                that.mapModuleNames();
                //that.stopAllSites();
            });

        //keep updating airlines
        return B.resolve(that.types.fetch())
            .then(function() {
                return that.fetch();
            })
            .then(function() {
                that.children.types = new TypeWidget({
                    el: that.$el.find('.types'),
                    types: that.types
                });
                that.children.types.render();
                that.children.types.on('change', that.onTypesChange.bind(that));
                return Super.prototype.render.call(that);
            });
    };

    Page.prototype.stopAllSites = function() {
        var that = this;
        that.sites.each(function (site) {
            site.stop();
        });
    };

    Page.prototype.setInitialAbbreviations = function() {
        var that = this,
            sites = that.sites;

        sites.each(function (site) {
            _.each(site.get('modules'), function (module) {
                switch(module.name) {
                    case 'Book My Flight':
                    case 'Booking Flow':
                    case 'Booking':
                        module.abbreviation = 'BK';
                        break;

                    case 'Flight Status':
                        module.abbreviation = 'FS';
                        break;

                    case 'Flight Schedule':
                        module.abbreviation = 'FSC';
                        break;

                    case 'Check In':
                        module.abbreviation = 'CI';
                        break;

                    default:
                        module.abbreviation = module.name.substr(0,3).toUpperCase();
                        break;
                }
            });
            site.save();
        });
    };

    Page.prototype.onTypesChange = function(event) {
        this.trigger('search', {
            selectedType: event.selectedTypes
        });
    };

    Page.prototype.onSiteChange = function() {
        this.updateUI();
    };
    Page.prototype.updateUI = function() {
        var that = this;
        if (that.sites.every(function(site) {
                if (_.contains([ExecutionStatus.ID_RUNNING, ExecutionStatus.ID_SCHEDULED], site.get('status'))) {
                    return false;
                }
                return true;
            })) {
            //that.controls.runAll.prop('disabled', false);
        }
    }

    Page.prototype.onSiteRemove = function(removedSite) {
        //TODO: why the heck I'm not getting this event
        removedSite.view.remove();
    };

    Page.prototype.addSiteToCollection = function(site) {
        this.sites.add(site);
    }

    Page.prototype.renderSites = function() {
        var that = this;

        B.all(_.map(that.sites.filter(function(site) {
            return !site.isRendered;
        }), function(site) {
            site.view = new SiteWidget({
                model: site,
                types: that.types
            });
            site.isRendered = true;

            site.view.on('cloned', function(clonedModel) {
                that.addSiteToCollection(clonedModel);
            });

            return site.view.render()
                .then(function() {
                    that.controls.sites.append(site.view.$el);
                    site.view.on('schedule', that.onSiteScheduled.bind(that));
                });
        }));

        that.updateUI();
    };

    Page.prototype.mapModuleNames = function(sites) {
        var that = this,
            sites = that.sites;

        that.moduleNamesMap = {};

        sites.each(function (site) {
            _.each(site.get('modules'), function (module) {
                if (module.name !== '' && module.abbreviation !== '') {
                    that.moduleNamesMap[module.abbreviation] = module.name;
                }
            });
        });

        that.controls.moduleLabels.html('');

        _.each(that.moduleNamesMap, function(name, abbreviation) {
            var formattedName = name;
            if (name.length > 20) {
                formattedName = formattedName.substr(0,20) + '...';
            }
            var $label = $('<span>').addClass('label hidden-xs hidden-sm').text(abbreviation + ' - ' + formattedName);
            that.controls.moduleLabels.append($label);
            that.controls.moduleLabels.append('\n');
        });
    };

    Page.prototype.performSearch = function(options) {
        var that = this;
        var query = options.query ? options.query : (that.controls.query ? that.controls.query.val().trim() : '');
        var visibleSites = that.sites.models;
        var selectedTypes = options.selectedType || that.children.types.val();

        if (!_.isEmpty(selectedTypes)) {
            var typeIds = _.pluck(selectedTypes, 'id');

            if (!_.isEmpty(query)) {
                var re = new RegExp(query, 'i');
                visibleSites = _.filter(visibleSites, function(site) {
                    return _.contains(typeIds, site.get('typeId')) &&
                            re.test(site.get('tags') + ',' + site.get('name'));
                });
            } else {
                visibleSites = _.filter(visibleSites, function(site) {
                    return _.contains(typeIds, site.get('typeId'));
                });
            }
        } else {
            if (!_.isEmpty(query)) {
                var re = new RegExp(query, 'i');
                visibleSites = _.filter(visibleSites, function(site) {
                    return re.test(site.get('tags') + ',' + site.get('name'));
                });
            }
        }

        that.sites.forEach(function(site) {
            if (site.view) {
                var visible = _.find(visibleSites, function(vs){
                    return site.id === vs.id;
                });
                site.view.$el.toggleClass('hidden', !visible);
            }
        });
        
        if(_.isEmpty(options.query) && _.isEmpty(selectedTypes)) {
            that.renderStats(null, 'days');    
        } else {
            that.renderStats(visibleSites, 'days');    
        }
        
    };

    Page.prototype.onSiteScheduled = function() {
        var that = this;
        that.toast.success('Job has been scheduled to start in 10 seconds.');
    };

    Page.prototype.onRunAllCompleted = function() {
        this.controls.runAll.removeClass('hidden');
        this.controls.new.removeClass('hidden');
        this.controls.stop.addClass('hidden');
    };

    Page.prototype.onRunAllTerminated = function() {
        this.controls.runAll.removeClass('hidden');
        this.controls.new.removeClass('hidden');
        this.controls.stop.addClass('hidden');
    };

    Page.prototype.onRunAllStarted = function() {
        this.controls.runAll.addClass('hidden');
        this.controls.new.addClass('hidden');
        this.controls.stop.removeClass('hidden');
    };

    Page.prototype.onStopClick = function(event) {
        var that = this;
        that.runAllStopRequested = true;
    };

    Page.prototype.onRunAllClick = function(event) {
        var that = this;
        //that.layout.nav.controls.runAll.prop('disabled', true);
        that.layout.nav.controls.runAll.addClass('hidden');
        that.layout.nav.controls.stop.removeClass('hidden');
        B.all(_.map(that.sites.filter(function(site) {
                return site.view && !site.view.$el.hasClass('hidden');
            }), function(site) {
                return site.run();
            }))
            .then(function() {
                that.toast.success('All matched sites have been scheduled to run.');
            });
    };

    Page.prototype.run = function() {
        var that = this;
        var runningAirline = that.airlineCollection.at(that.runningAirlineIndex);

        that.listenToOnce(runningAirline.view, 'completed', function() {
            that.runningAirlineIndex++;
            if (that.runAllStopRequested) {
                that.runAllStopRequested = false;
                that.trigger('run-all-terminated');
            }
            else {
                if (that.runningAirlineIndex < that.airlineCollection.length) {
                    that.run();
                }
                else {
                    that.trigger('run-all-completed');
                }
            }
        });

        runningAirline.view.run();
    };

    Page.prototype.openSiteDialog = function(model, types) {
        var that = this,
            isNew = model.isNew();

        var view = new SiteEdit({
            model: model,
            types: types
        });

        var dlg = new Dialog({
            title: isNew ? 'New Site' : 'Edit: ' + model.get('name'),
            body: view,
            buttons: [{
                id: 'save',
                label: 'Save',
                iconClass: 'fa fa-save',
                buttonClass: 'btn-primary',
                align: 'left'
            }, {
                id: 'cancel',
                label: 'Cancel',
                iconClass: 'fa fa-times',
                buttonClass: 'btn-default',
                align: 'left',
                autoClose: true
            }]
        })

        dlg.on('save', function() {
            B.resolve(model.save(view.val()))
                .then(function() {
                    if (isNew) {
                        that.sites.add(model);
                    }
                    that.toast.success('New site has been added.');
                    dlg.close();
                });
        });
    };

    Page.prototype.onNewClick = function(event) {
        event.preventDefault();
        var that = this;
        var model = new Site({
            name: 'New Site'
        });

        that.openSiteDialog(model, that.types);
    };

    Page.prototype.refresh = function() {
        var that = this;
        //clean up
        that.airlineCollection.forEach(function(airline) {
            if (airline.view) {
                airline.view.remove();
            }
        });

        return that.fetch()
            .then(function() {
                that.renderAirlines();
            });
    };

    Page.prototype.onAirlineCreated = function(airline) {
        this.refresh();
        this.toast.success("Airline has been created!");
    };

    Page.prototype.onAirlineSaved = function(airline) {
        this.refresh();
        this.toast.success("Airline has been saved!");
    };

    Page.prototype.onAirlineDeleted = function(airline) {
        this.airlineCollection.remove(airline);
        this.refresh();
        this.toast.success("Airline has been deleted!");
    };

    Page.prototype.onAirlineCloned = function(airline) {
        this.refresh();
        this.toast.success("Airline has been cloned!");
    };

    Page.prototype.fetch = function() {
        var that = this;
        return B.all([that.sites.fetch(), that.statuses.fetch(), this.stats.fetch()]);
    };

    return Page;
});