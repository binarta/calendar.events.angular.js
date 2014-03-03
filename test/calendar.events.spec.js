describe('calendar.events', function () {
    var $scope, ctrl, events;

    beforeEach(module('calendar.events'));
    beforeEach(module('calendar.events.connector'));
    beforeEach(inject(function($rootScope, calendarEvents) {
        $scope = $rootScope.$new();
        events = calendarEvents;
    }));

    describe('provides ListCalendarEventsController', function() {
        beforeEach(inject(function($controller) {
            ctrl = $controller('ListCalendarEventsController', {$scope:$scope});
        }));

        it('exposes an event template for creating new events on $scope', function() {
            expect($scope.eventTemplate).toEqual({});
        });

        describe('which when wired to ui', function() {
            var connector;

            beforeEach(inject(function(ui) {
                connector = ui.connector;
            }));

            it('exposes $scope on connector', function() {
                expect(connector.$scope).toEqual($scope);
            });

            it('can add an event source', function() {
                $scope.addSource('source-name');
                expect(connector.eventSources).toEqual(['source-name-loader']);
            });

            it('can switch window sizes', function() {
                $scope.useWindowSize('day');
                expect(connector.windowSize).toEqual('day');
            });

            describe('which when given an event template', function() {
                beforeEach(function() {
                    $scope.eventTemplate = 'my-custom-event';
                });

                it('clears the event on reset', function() {
                    $scope.resetTemplate();
                    expect($scope.eventTemplate).toEqual({});
                });

                describe('and creating an event from the template', function() {
                    beforeEach(function() {
                        $scope.createEvent();
                    });

                    it('then the template is passed to the event writer', function() {
                        expect(events).toEqual(['my-custom-event']);
                    });

                    it('then the template is rendered on the ui', function() {
                        expect(connector.rendered).toEqual('my-custom-event');
                    });

                    it('then the template is reset', function() {
                        expect($scope.eventTemplate).toEqual({});
                    });
                });
            });

            describe('and opened an event', function() {
                beforeEach(function() {
                    $scope.openEvent({id:'evt'});
                });

                it('then the event is exposed on $scope', function() {
                    expect($scope.evt).toEqual({id:'evt'});
                });

                it('then the event is opened in the ui', function() {
                    expect(connector.opened).toEqual({id:'evt'});
                });

                describe('when deleting the event', function() {
                    beforeEach(inject(function(calendarEvents) {
                        calendarEvents.push({id:'evt'});
                        calendarEvents.push({id:'alternate-evt'});
                        $scope.deleteEvent();
                    }));

                    it('then the event is removed from the backing storage', inject(function(calendarEvents) {
                        expect(calendarEvents).toEqual([{id:'alternate-evt'}]);
                    }));

                    it('the ui should remove the event', function() {
                        expect(connector.removed).toEqual({id:'evt'});
                    });
                });
            });
        });
    });
});

angular.module('calendar.events.connector', [])
    .factory('ui', function() {
        return {};
    })
    .factory('connectWithCalendarEventsUi', function(ui) {
        return function(connect) {
            var spy = {eventSources:[]};
            var connector = {
                addSource:function(source) {
                    spy.eventSources.push(source);
                },
                useWindowSize:function(size) {
                    spy.windowSize = size;
                },
                renderEvent:function(evt) {
                    spy.rendered = evt;
                },
                openEvent:function(evt) {
                    spy.opened = evt;
                },
                removeEvent:function(evt) {
                    spy.removed = evt;
                }
            };
            connect(connector);
            spy.$scope = connector.$scope;
            ui.connector = spy;
        }
    });

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
    .factory('calendarEventWriter', function(calendarEvents, idgen) {
        return function(evt) {
            evt.id = idgen();
            calendarEvents.push(evt);
        }
    })
    .factory('calendarEventDeleter', function(calendarEvents) {
        return function(args) {
            calendarEvents.splice(calendarEvents.reduce(function (p, c, i) {
                return c.id == args.id ? i : p;
            }, -1), 1);
        }
    });