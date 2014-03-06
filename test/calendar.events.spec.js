describe('calendar.events', function () {
    var $scope, ctrl, events, rest, topicRegistry;
    var permissionCheck;
    var presenter;

    beforeEach(module('calendar.events'));
    beforeEach(module('calendar.events.mock.ui'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));
    beforeEach(module('notifications'));
    beforeEach(inject(function($rootScope, calendarEvents, restServiceHandler, topicRegistryMock) {
        $scope = $rootScope.$new();
        events = calendarEvents;
        rest = restServiceHandler;
        topicRegistry = topicRegistryMock;
        permissionCheck = jasmine.createSpy('activeHasUserPermission');
        presenter = jasmine.createSpy('presenter');
    }));

    describe('provides ListCalendarEventsController', function() {
        var connector;

        beforeEach(inject(function($controller) {
            ctrl = $controller('ListCalendarEventsController', {$scope:$scope, activeUserHasPermission: permissionCheck});

        }));

        it('exposes an event template for creating new events on $scope', function() {
            expect($scope.eventTemplate).toEqual({});
        });

        describe('which when wired to ui', function() {
            beforeEach(inject(function(ui) {
                $scope.connectUI('mockUIConnector');
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

            describe('when showing the create event ui', function() {
                var date = moment();
                var allDay = true;

                beforeEach(function() {
                    $scope.showCreateEvent(date, allDay, presenter);
                });

                it('permission checker is called for calendar.event.add', function() {
                    expect(permissionCheck.calls[0].args[1]).toEqual('calendar.event.add');
                });

                describe('and user has permission', function() {
                    beforeEach(function() {
                        permissionCheck.calls[0].args[0].yes();
                    });

                    it('then start date gets populated', function() {
                        expect(moment($scope.eventTemplate.start).format()).toEqual(moment(date).format());
                    });

                    it('and end date gets populated', function() {
                        expect($scope.eventTemplate.end).toEqual(moment(date).add('days', 1));
                    });

                    it('and presenter gets called', function() {
                        expect(presenter.calls[0]).toBeDefined();
                    });

                    describe('when event is not all day', function() {
                        beforeEach(function() {
                            allDay = false;
                            $scope.resetTemplate();
                            $scope.showCreateEvent(date, allDay);
                        });

                        it('then end date is not populated', function() {
                            expect($scope.eventTemplate.end).toBeUndefined();
                        })
                    });
                });

                describe('and user does not have permission', function() {
                    beforeEach(function() {
                        permissionCheck.calls[0].args[0].no();
                    });

                    it('nothing happens', function() {
                        expect(true).toBeTruthy();
                    })
                });
            });

            describe('which when given an event template', function() {
                beforeEach(function() {
                    $scope.eventTemplate = {title:'my-custom-event'};
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
                        expect(events).toEqual([{title: 'my-custom-event', id: 0, scope: $scope}]);
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
                });

                describe('when updating the event', function() {
                    beforeEach(inject(function(calendarEvents) {
                        calendarEvents.push({id:'id', field:'old', field2:'old2'});
                        calendarEvents.push({id:'id2', field:'old', field2:'old2'});
                        $scope.updateEvent({id:'id', field:'value', field2:'value2'});
                    }));

                    it('then the event is updated', inject(function(calendarEvents) {
                        expect(calendarEvents).toEqual([
                            {id:'id', field:'value', field2:'value2'},
                            {id:'id2', field:'old', field2:'old2'}
                        ]);
                    }));
                });
            });

            describe('subscribes to some events', function() {
                beforeEach(function() {
                    $scope.eventTemplate = 'my-custom-event';
                });

                it('test', function() {
                    expect(topicRegistry['calendar.event.created']).toBeDefined();
                    expect(topicRegistry['calendar.event.removed']).toBeDefined();
                    expect(topicRegistry['calendar.event.updated']).toBeDefined();
                });

                describe('when firing calendar.event.created', function() {
                    beforeEach(function() {
                        topicRegistry['calendar.event.created']();
                    });

                    it('then the template is rendered on the ui', function() {
                        expect(connector.rendered).toEqual('my-custom-event');
                    });

                    it('then the template is reset', function() {
                        expect($scope.eventTemplate).toEqual({});
                    });

                    it('and the ui is hidden', function() {
                        expect(connector.hidden).toBeTruthy();
                    })
                });

                describe('when firing calendar.event.removed', function() {
                    beforeEach(function() {
                        topicRegistry['calendar.event.removed']();
                    });

                    it('the ui should remove the event', function() {
                        expect(connector.removed).toEqual('my-custom-event');
                    });
                });

                describe('when firing calendar.event.updated', function() {
                    beforeEach(function() {
                        topicRegistry['calendar.event.updated']();
                    });

                    it('then hide the ui', function() {
                        expect(connector.hidden).toBeTruthy();
                    });

                    it('then ui is refreshed', function() {
                        expect(connector.refreshed).toBeTruthy();
                    })
                });
            });
        });
    });

    describe('ViewCalendarEventController', function() {
        var id = 'id';
        var usecase;
        var context;
        var config;

        beforeEach(inject(function($controller, usecaseAdapterFactory, restServiceHandler) {
            context = {};
            config = {};
            usecase = usecaseAdapterFactory;
            usecase.andReturn(context);
            ctrl = $controller(ViewCalendarEventController, {$scope: $scope, config: config});
        }));

        describe('on init', function() {

            beforeEach(function() {
                config.namespace = 'namespace';
                config.baseUri = 'base-uri/';
                $scope.init(id);
            });

            it('then context is created', function() {
                expect(usecase.calls[0].args[0]).toEqual($scope);
            });

            it('http params are populated', function() {
                expect(context.params.method).toEqual('GET');
                expect(context.params.headers['x-namespace']).toEqual(config.namespace);
                expect(context.params.url).toEqual(config.baseUri + 'api/entity/calendarevent/'+id);
            });

            it('http call is executec', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            describe('on success', function() {
                var payload;

                beforeEach(function() {
                    payload = {};
                    context.success(payload);
                });

                it('payload gets put on scope as event', function() {
                    expect($scope.event).toEqual(payload);
                })
            });
        });
    });
});

angular.module('calendar.events.mock.ui', [])
    .factory('ui', function() {
        return {};
    })
    .factory('mockUIConnector', function(ui) {
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
                },
                refresh:function() {
                    spy.refreshed = true;
                }
            };
            connect(connector);
            spy.$scope = connector.$scope;
            ui.connector = spy;
            spy.$scope.hide = function() {
                spy.hidden = true;
            }
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
        return function(evt, $scope) {
            evt.id = idgen();
            evt.scope = $scope;
            calendarEvents.push(evt);
        }
    })
    .factory('calendarEventDeleter', function(calendarEvents) {
        return function(args) {
            calendarEvents.splice(calendarEvents.reduce(function (p, c, i) {
                return c.id == args.id ? i : p;
            }, -1), 1);
        }
    })
    .factory('calendarEventUpdater', function(calendarEvents) {
        return function(event) {
            var index = calendarEvents.reduce(function(previous, current, index) {
                return current.id == event.id ? index : previous;
            }, -1);
            Object.keys(event).forEach(function(key) {
                calendarEvents[index][key] = event[key];
            });
        }
    });