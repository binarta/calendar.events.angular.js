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