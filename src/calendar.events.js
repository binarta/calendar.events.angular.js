angular.module('calendar.events', ['calendar.events.connector', 'calendar.events.sources'])
    .controller('ListCalendarEventsController', ['$scope', 'connectWithCalendarEventsUi', 'calendarEventSourceFactory', 'calendarEventWriter', 'calendarEventDeleter', ListCalendarEventsController]);

function ListCalendarEventsController($scope, connectWithCalendarEventsUi, calendarEventSourceFactory, calendarEventWriter, calendarEventDeleter) {
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
        $scope.createEvent = function() {
            var evt = $scope.eventTemplate;
            calendarEventWriter(evt);
            connector.renderEvent(evt);
            $scope.resetTemplate();
        };
        $scope.openEvent = function(evt) {
            $scope.evt = evt;
            connector.openEvent(evt);
        };
        $scope.deleteEvent = function() {
            calendarEventDeleter($scope.evt);
            connector.removeEvent($scope.evt);
        }
    });
}