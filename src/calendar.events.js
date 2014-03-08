angular.module('calendar.events', ['calendar.events.sources'])
    .controller('ListCalendarEventsController', ['$injector', '$scope', 'calendarEventSourceFactory', 'calendarEventWriter', 'calendarEventDeleter', 'topicRegistry', 'activeUserHasPermission', 'calendarEventUpdater', ListCalendarEventsController])
    .controller('ViewCalendarEventController', ['$scope', 'usecaseAdapterFactory', 'config', 'restServiceHandler', ViewCalendarEventController]);

function ListCalendarEventsController($injector, $scope, calendarEventSourceFactory, calendarEventWriter, calendarEventDeleter, topicRegistry, activeUserHasPermission, calendarEventUpdater) {
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
                        $scope.eventTemplate.start = moment(date);
                        if (allDay) $scope.eventTemplate.end = moment(date).add('days', 1);
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
    };
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