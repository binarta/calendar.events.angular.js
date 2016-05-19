angular.module('calendar.events', ['calendar.events.sources', 'checkpoint', 'notifications', 'momentx'])
    .controller('ListCalendarEventsController', ['$injector', '$scope', 'calendarEventSourceFactory', 'calendarEventDeleter', 'activeUserHasPermission', 'calendarEventUpdater', 'calendarEventWriterHelper', 'moment', ListCalendarEventsController])
    .controller('ViewCalendarEventController', ['$scope', 'isCatalogItemPredicate', 'calendarEventViewer', ViewCalendarEventController])
    .controller('AddCalendarEventController', ['$scope', 'topicMessageDispatcher', 'isCatalogItemPredicate', 'calendarEventWriterHelper', 'addCalendarEventPresenter', 'moment', AddCalendarEventController])
    .controller('UpdateCalendarEventController', ['$scope', 'calendarEventUpdater', 'topicMessageDispatcher', UpdateCalendarEventController])
    .controller('DeleteCalendarEventController', ['$scope', 'calendarEventDeleter', 'topicMessageDispatcher', DeleteCalendarEventController])
    .factory('isCatalogItemPredicate', [IsCatalogItemPredicateFactory])
    .factory('calendarEventWriterHelper', ['calendarEventWriter', CalendarEventWriterHelperFactory]);

function ListCalendarEventsController($injector, $scope, calendarEventSourceFactory, calendarEventDeleter, activeUserHasPermission, calendarEventUpdater, calendarEventWriterHelper, moment) {
    $scope.resetTemplate = function () {
        $scope.eventTemplate = {};
    };
    $scope.resetTemplate();
    $scope.connectUI = function(connectorId) {
        $injector.get(connectorId)(function (connector) {
            connector.$scope = $scope;
            $scope.useWindowSize = connector.useWindowSize;
            $scope.addSource = function (sourceName) {
                connector.addSource(calendarEventSourceFactory({id: sourceName}));
            };
            $scope.showCreateEvent = function(date, allDay, presenter) {
                activeUserHasPermission({
                    yes: function() {
                        if (allDay) {
                            $scope.eventTemplate.start = moment(date).hour(moment().hour()).format();
                        } else {
                            $scope.eventTemplate.start = moment(date).format();
                        }
                        $scope.eventTemplate.end = moment($scope.eventTemplate.start).add('hours', 1).format();
                        presenter();
                    },
                    no: function() {}
                }, 'calendar.event.add');
            };
            addWriterUtils();
            $scope.openEvent = function(evt) {
                $scope.evt = evt;
                connector.openEvent(evt);
            };
            $scope.deleteEvent = function() {
                calendarEventDeleter($scope.evt, {
                    success: function() {
                        connector.removeEvent($scope.evt);
                    }
                });
            };
            $scope.updateEvent = function(event) {
                calendarEventUpdater(event, $scope, {
                    success: function() {
                        connector.refresh();
                    }
                });
            };

            function addWriterUtils() {
                calendarEventWriterHelper.create($scope, {success: function() {
                    connector.renderEvent($scope.eventTemplate);
                    $scope.resetTemplate();
                }});
                calendarEventWriterHelper.createAnother($scope, {success: function() {
                    connector.renderEvent($scope.eventTemplate);
                    var type = $scope.eventTemplate.type;
                    $scope.resetTemplate();
                    $scope.eventTemplate.start = moment().minutes(0).format();
                    $scope.eventTemplate.end = moment().minutes(0).add(1, 'hours').format();
                    $scope.eventTemplate.type = type;
                }});
            }
        });
    };
}

function ViewCalendarEventController($scope, isCatalogItemPredicate, calendarEventViewer) {
    $scope.init = function(id) {
        calendarEventViewer(id, $scope);
    };

    $scope.isCatalogItem = isCatalogItemPredicate;
}

function AddCalendarEventController($scope, topicMessageDispatcher, isCatalogItemPredicate, calendarEventWriterHelper, addCalendarEventPresenter, moment) {
    calendarEventWriterHelper.create($scope);

    calendarEventWriterHelper.createAnother($scope, {success: function() {
        var type = $scope.eventTemplate.type;
        topicMessageDispatcher.fire('system.success', {message: 'calendar.event.created.success', default: 'Show has been added'});
        $scope.eventTemplate = {};
        $scope.eventTemplate.start = moment().minutes(0).format();
        $scope.eventTemplate.end = moment().minutes(0).add(1, 'hours').format();
        $scope.eventTemplate.movie = $scope.path;
        $scope.eventTemplate.type = type;
    }});

    $scope.show = function() {
        $scope.eventTemplate = {};
        $scope.eventTemplate.start = moment().minutes(0).format();
        $scope.eventTemplate.end = moment().minutes(0).add(1, 'hours').format();
        $scope.eventTemplate.movie = $scope.path;
        addCalendarEventPresenter($scope);
    };

    $scope.isCatalogItem = isCatalogItemPredicate;
}

function IsCatalogItemPredicateFactory() {
    return function(id) {
        return /^\/.*\/.*$/.test(id);
    }
}

function CalendarEventWriterHelperFactory(calendarEventWriter) {
    return {
        create: function($scope, presenter) {
            $scope.createEvent = function(args) {
                calendarEventWriter($scope.eventTemplate, $scope, {success: function () {
                    if(presenter && presenter.success) presenter.success();
                    if(args && args.success) args.success();
                }});
            }
        },
        createAnother: function($scope, presenter) {
            $scope.createAnother = function() {
                calendarEventWriter($scope.eventTemplate, $scope, presenter);
            }
        }
    }
}

function UpdateCalendarEventController($scope, calendarEventUpdater, topicMessageDispatcher) {
    $scope.updateEvent = function(args) {
        calendarEventUpdater(args.event, $scope, {
            success: function() {
                if(args.success) args.success();
                topicMessageDispatcher.fire('calendar.event.updated', args.event);
            }
        });
    }
}

function DeleteCalendarEventController($scope, calendarEventDeleter, topicMessageDispatcher) {
    $scope.deleteEvent = function(event) {
        calendarEventDeleter(event, {
            success: function() {
                topicMessageDispatcher.fire('calendar.event.deleted', event);
            }
        });
    };
}
