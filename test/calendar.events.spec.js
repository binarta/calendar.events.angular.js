describe('calendar.events', function () {
    var $scope, ctrl, events, topicRegistry;
    var permissionCheck;
    var presenter;

    angular.module('checkpoint', []);
    beforeEach(module('calendar.events'));
    beforeEach(module('calendar.events.mock.ui'));
    beforeEach(module('notifications'));
    beforeEach(inject(function($rootScope, calendarEvents, topicRegistryMock) {
        $scope = $rootScope.$new();
        events = calendarEvents;
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
                var date = moment().hour(1);
                var allDay = true;

                function show() {
                    $scope.showCreateEvent(date, allDay, presenter);
                }

                function hasPermission() {
                    permissionCheck.calls[0].args[0].yes();
                }

                function permissionChecked() {
                    it('permission checker is called for calendar.event.add', function() {
                        expect(permissionCheck.calls[0].args[1]).toEqual('calendar.event.add');
                    });
                }

                function endDateAddsOneHour() {
                    it('and end date gets populated', function() {
                        expect($scope.eventTemplate.end).toEqual(moment($scope.eventTemplate.start).add('hours', 1).format());
                    });
                }

                describe('and user selected a specific time', function() {
                    beforeEach(function() {
                        allDay = false;
                        show();
                    });

                    permissionChecked();

                    describe('and user has permission', function() {
                        beforeEach(function() {
                            hasPermission();
                        });

                        it('start date is selected date and time', function() {
                            expect($scope.eventTemplate.start).toEqual(moment(date).format());
                        });

                        endDateAddsOneHour();
                    });
                });

                describe('and user selected a day', function() {
                    beforeEach(function() {
                        allDay = true;
                        show();
                    });

                    permissionChecked();

                    describe('and user has permission', function() {
                        beforeEach(function() {
                            hasPermission();
                        });

                        it('then start date gets populated', function() {
                            expect($scope.eventTemplate.start).toEqual(moment(date).hours(moment().hour()).format());
                        });

                        endDateAddsOneHour();

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
                            expect($scope.eventTemplate.start).toBeUndefined();
                            expect($scope.eventTemplate.end).toBeUndefined();
                        })
                    });
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
                        expect(events).toEqual([{title: 'my-custom-event', id: 0}]);
                    });

                    it('test', inject(function(metadata) {
                        expect(metadata.$scope).toEqual($scope);
                    }));

                    describe('', function() {
                        beforeEach(inject(function(metadata) {
                            $scope.eventTemplate = 'my-event';
                            metadata.presenter.success();
                        }));

                        it('renders event', function() {
                            expect(connector.rendered).toEqual('my-event');
                        });

                        it('then the template is reset', function() {
                            expect($scope.eventTemplate).toEqual({});
                        });
                    });
                });

                describe('and creating another event from the template', function() {
                    beforeEach(function() {
                        $scope.createAnother();
                    });

                    it('then the template is passed to the event writer', function() {
                        expect(events).toEqual([{title: 'my-custom-event', id: 0}]);
                    });

                    it('test', inject(function(metadata) {
                        expect(metadata.$scope).toEqual($scope);
                    }));

                    describe('', function() {
                        beforeEach(inject(function(metadata) {
                            $scope.eventTemplate = {type:'type'};
                            metadata.presenter.success();
                        }));

                        it('test', function() {
                            expect(connector.rendered).toEqual({type:'type'});
                        });

                        it('test', function() {
                            expect($scope.eventTemplate.start).toEqual(moment().minutes(0).format());
                            expect($scope.eventTemplate.end).toEqual(moment().minutes(0).add(1, 'hours').format());
                            expect($scope.eventTemplate.type).toEqual('type');
                        });
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

                    describe('on success callback', function() {
                        beforeEach(inject(function(metadata) {
                            metadata.presenter.success();
                        }));

                        it('ui connector removes event', function() {
                            expect(connector.removed).toEqual({id:'evt'})
                        })
                    });
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

                    it('$scope is passed to updater', inject(function(metadata) {
                        expect(metadata.$scope).toEqual($scope);
                    }));

                    describe('success callback', function() {
                        beforeEach(inject(function(metadata) {
                            metadata.presenter.success();
                        }));

                        it('ui connector refreshes', function() {
                            expect(connector.refreshed).toBeTruthy();
                        })
                    });
                });
            });
        });
    });

    describe('ViewCalendarEventController', function() {
        var id = 'id';
        var viewer = jasmine.createSpy('viewer');

        beforeEach(inject(function($controller) {
            ctrl = $controller(ViewCalendarEventController, {$scope: $scope, calendarEventViewer: viewer});
        }));

        describe('on init', function() {

            beforeEach(function() {
                $scope.init(id);
            });

            it('viewer is called', function() {
                expect(viewer.calls[0].args[0]).toEqual(id);
                expect(viewer.calls[0].args[1]).toEqual($scope);
            });
        });

        describe('on check for catalog item', function() {
            it('when item id is valid', function() {
                expect($scope.isCatalogItem('/movies/id')).toBeTruthy();
            });

            it('when item id is regular text', function() {
                expect($scope.isCatalogItem('random text')).toBeFalsy();
            })
        });

    });

    describe('IsCatalogItemPredicateFactory', function() {
        var predicate;

        beforeEach(inject(function(isCatalogItemPredicate) {
            predicate = isCatalogItemPredicate;
        }));

        it('when valid catalog item id is provided', function() {
            expect(predicate('/movies/id')).toBeTruthy();
        });

        it('when no catalog item id is provided', function() {
            expect(predicate('Some random description')).toBeFalsy();
        })
    });

    describe('CalendarEventWriterHelperFactory', function() {
        var helper;
        var createPresenter = jasmine.createSpyObj('createPresenter', ['success']);
        var createAnotherPresenter = jasmine.createSpy('createAnotherPresenter');
        var createArgs = jasmine.createSpyObj('createArgs', ['success']);

        beforeEach(inject(function(calendarEventWriterHelper) {
            helper = calendarEventWriterHelper;
            $scope.eventTemplate = {title:'my-custom-event'};
        }));

        describe('on create event', function() {
            beforeEach(function() {
                helper.create($scope, createPresenter);
                $scope.createEvent();
            });

            it('then the template is passed to the event writer', function() {
                expect(events).toEqual([{title: 'my-custom-event', id: 0}]);
            });

            it('then the scope gets passed to the writer', inject(function(metadata) {
                expect(metadata.$scope).toEqual($scope);
            }));

            it('then the callback gets passed to the writer', inject(function(metadata) {
                metadata.presenter.success();

                expect(createPresenter.success).toHaveBeenCalled();
            }));

            it('with extra success args', inject(function(metadata) {
                $scope.createEvent(createArgs);
                metadata.presenter.success();

                expect(createArgs.success).toHaveBeenCalled();
            }));

            it('when no presenter', inject(function(metadata) {
                helper.create($scope);
                $scope.createEvent();
                metadata.presenter.success();
            }));
        });

        describe('on create another', function() {
            beforeEach(function() {
                helper.createAnother($scope, createAnotherPresenter);
                $scope.createAnother();
            });

            it('then the template is passed to the event writer', function() {
                expect(events).toEqual([{title: 'my-custom-event', id: 0}]);
            });

            it('then the scope gets passed to the writer', inject(function(metadata) {
                expect(metadata.$scope).toEqual($scope);
            }));

            it('then the callback gets passed to the writer', inject(function(metadata) {
                expect(metadata.presenter).toEqual(createAnotherPresenter);
            }));
        });
    });

    describe('AddCalendarEventController', function() {
        var presenter;
        beforeEach(inject(function($controller) {
            presenter = jasmine.createSpy('presenter');
            ctrl = $controller(AddCalendarEventController, {$scope:$scope, addCalendarEventPresenter: presenter});
        }));

        describe('on show', function() {
            beforeEach(function() {
                $scope.path = '/movie/id';
                $scope.show();
            });

            it('event template receives initial values', function() {
                expect($scope.eventTemplate.start).toEqual(moment().minutes(0).format());
                expect($scope.eventTemplate.end).toEqual(moment().minutes(0).add(1, 'hours').format());
                expect($scope.eventTemplate.movie).toEqual($scope.path);
            });

            it('presenter is called', function() {
                expect(presenter.calls[0].args[0]).toEqual($scope);
            })
        });

        describe('on create another', function() {
            beforeEach(function() {
                $scope.eventTemplate = {type:'type'};
                $scope.path = '/movies/id';
                $scope.createAnother();
            });

            describe('when presenting success', function() {
                beforeEach(inject(function(metadata) {
                    metadata.presenter.success();
                }));

                it('fires notification', inject(function(topicMessageDispatcherMock) {
                    expect(topicMessageDispatcherMock['system.success']).toEqual({message:'calendar.event.created.success', default:'Show has been added'})
                }));

                it('test', function() {
                    expect($scope.eventTemplate.type).toEqual('type');
                    expect($scope.eventTemplate.start).toEqual(moment().minutes(0).format());
                    expect($scope.eventTemplate.end).toEqual(moment().minutes(0).add(1, 'hours').format());
                    expect($scope.eventTemplate.movie).toEqual($scope.path);
                })
            });
        });
    });

    describe('UpdateCalendarEventController', function() {
        beforeEach(inject(function($controller) {
            ctrl = $controller(UpdateCalendarEventController, {$scope: $scope});
        }));

        describe('on update', function() {
            var hidden = false;
            var updatedSuccessCalled;
            var updatedArgs = {
                event: {id:'id', field:'value', field2:'value2'},
                success: function () {
                    updatedSuccessCalled = true;
                }
            };

            beforeEach(inject(function(calendarEvents) {
                $scope.hide = function() {
                    hidden = !hidden;
                };
                calendarEvents.push({id:'id', field:'old', field2:'old2'});
                calendarEvents.push({id:'id2', field:'old', field2:'old2'});

                $scope.updateEvent(updatedArgs);
            }));

            it('then the event is updated', inject(function(calendarEvents) {
                expect(calendarEvents).toEqual([
                    {id:'id', field:'value', field2:'value2'},
                    {id:'id2', field:'old', field2:'old2'}
                ]);
            }));

            it('$scope is passed to updater', inject(function(metadata) {
                expect(metadata.$scope).toEqual($scope);
            }));

            describe('on success callback', function() {
                beforeEach(inject(function(metadata) {
                    metadata.presenter.success();
                }));

                it('args.success is executed', function () {
                    expect(updatedSuccessCalled).toBeTruthy();
                });

                it('notification is fired', inject(function(topicMessageDispatcherMock) {
                    expect(topicMessageDispatcherMock['calendar.event.updated']).toEqual(updatedArgs.event);
                }));
            });
        });
    });

    describe('DeleteCalendarEventController', function() {
        beforeEach(inject(function($controller) {
            ctrl = $controller(DeleteCalendarEventController, {$scope:$scope});
        }));

        describe('on delete', function() {
            beforeEach(inject(function(calendarEvents) {
                calendarEvents.push({id:'id'});
                $scope.deleteEvent({id: 'id'});
            }));

            it('event is removed', inject(function(calendarEvents) {
                expect(calendarEvents).toEqual([]);
            }));

            describe('on successfull delete', function() {
                beforeEach(inject(function(metadata) {
                    metadata.presenter.success();
                }));

                it('calendar.event.deleted is fired', inject(function(topicMessageDispatcherMock) {
                    expect(topicMessageDispatcherMock['calendar.event.deleted']).toEqual({id:'id'});
                }));
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