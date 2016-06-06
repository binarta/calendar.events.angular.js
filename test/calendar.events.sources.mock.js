angular.module('calendar.events.sources', [])
    .factory('calendarEventSourceFactory', function() {
        return function(it) {
            return it.id + '-loader';
        }
    })
    .factory('calendarEvents', function() {
        return [];
    })
    .factory('idgen', function() {
        var id = 0;
        return function() {
            return id++;
        }
    })
    .factory('calendarEventWriter', function(calendarEvents, idgen, metadata) {
        return function(evt, $scope, p) {
            metadata.$scope = $scope;
            metadata.presenter = p;
            evt.id = idgen();
            calendarEvents.push(evt);
        }
    })
    .factory('metadata', function() {
        return {};
    })
    .factory('calendarEventDeleter', function(calendarEvents, metadata) {
        return function(args, presenter) {
            metadata.presenter = presenter;
            calendarEvents.splice(calendarEvents.reduce(function (p, c, i) {
                return c.id == args.id ? i : p;
            }, -1), 1);
        }
    })
    .factory('calendarEventUpdater', function(calendarEvents, metadata) {
        return function(event, $scope, presenter) {
            metadata.$scope = $scope;
            metadata.presenter = presenter;
            var index = calendarEvents.reduce(function(previous, current, index) {
                return current.id == event.id ? index : previous;
            }, -1);
            Object.keys(event).forEach(function(key) {
                calendarEvents[index][key] = event[key];
            });
        }
    });