angular.module('calendar.events', ['calendar.events.connector', 'calendar.events.sources'])
    .controller('ListCalendarEventsController', ['$scope', 'connectWithCalendarEventsUi', 'calendarEventSourceFactory', 'calendarEventWriter', 'calendarEventDeleter', 'topicRegistry', 'activeUserHasPermission', 'calendarEventUpdater', ListCalendarEventsController])
    .controller('ViewCalendarEventController', ['$scope', 'usecaseAdapterFactory', 'config', 'restServiceHandler', ViewCalendarEventController]);

function ListCalendarEventsController($scope, connectWithCalendarEventsUi, calendarEventSourceFactory, calendarEventWriter, calendarEventDeleter, topicRegistry, activeUserHasPermission, calendarEventUpdater) {
    $scope.resetTemplate = function () {
        console.log('resetTemplate(' + JSON.stringify($scope.eventTemplate) + ')');
        $scope.eventTemplate = {};
    };
    $scope.resetTemplate();
    connectWithCalendarEventsUi(function (connector) {
        connector.$scope = $scope;
        $scope.useWindowSize = connector.useWindowSize;
        $scope.addSource = function (sourceName) {
            connector.addSource(calendarEventSourceFactory({id: sourceName}));
        };
        $scope.showCreateEvent = function(date, allDay, presenter) {
            activeUserHasPermission({
                yes: function() {
                    var moment2 = moment(date);
                    moment2.minute(new Number(0));
                    $scope.eventTemplate.start = moment2.format();
                    if (allDay) $scope.eventTemplate.end = moment2.add('days', 1).format();
                    presenter();
                },
                no: function() {}
            }, 'calendar.event.add');
        };
        $scope.createEvent = function() {
            var evt = $scope.eventTemplate;
            calendarEventWriter(evt, $scope);
        };
        $scope.openEvent = function(evt) {
            $scope.evt = evt;
            connector.openEvent(evt);
        };
        $scope.deleteEvent = function() {
            calendarEventDeleter($scope.evt);
        };
        $scope.updateEvent = function(event) {
            calendarEventUpdater(event);
        };

        topicRegistry.subscribe('calendar.event.created', function() {
            connector.renderEvent($scope.eventTemplate);
            $scope.resetTemplate();
            $scope.hide();
        });

        topicRegistry.subscribe('calendar.event.removed', function() {
            connector.removeEvent($scope.eventTemplate);
        });

        topicRegistry.subscribe('calendar.event.updated', function() {
            $scope.hide();
            connector.refresh();
        });
    });
}

function ViewCalendarEventController($scope, usecaseAdapterFactory, config, restServiceHandler) {
    $scope.init = function(id) {
        var context = usecaseAdapterFactory($scope);
        context.params = {
            method:'GET',
            url: (config.baseUri || '') + 'api/entity/calendarevent/'+id,
            headers: {
                'x-namespace': config.namespace
            }
        };
        context.success = function(payload) {
            $scope.event = payload;
        };
        restServiceHandler(context);
    }
}