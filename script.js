var app = angular.module("bCal", []);

      app.controller("bookingCalendar", ['$scope', function($scope) {

      }]);

      app.directive("calendar", ['$http', function($http) {
          return {
              restrict: "E",
              templateUrl: "templates/calendar.html",
              scope: {
                  selected: "="
              },
              link: function(scope) {
                  scope.selected = _removeTime(scope.selected || moment());
                  scope.month = scope.selected.clone();
                  scope.selectedDays = {};
                  scope.modal = false;
                  var start = scope.selected.clone();
                  start.date(1);
                  _removeTime(start.day(0));

                  _buildMonth(scope, start, scope.month);

                  _loadDates(scope, $http);

                  scope.select = function(day) {
                    scope.selected = day.date;
                  };

                  scope.daySelected = null;

                  scope.mouseDownSelect = function(day) {
                    if (!scope.modal) {
                      scope.daySelected = day;
                      day.isSelected = true;
                      _clearSelection(scope);
                      scope.selectedDays.dates = [{ date: day.date.format('YYYY MM D') }];
                    }
                  };

                  scope.mouseOverSelect = function(day) {
                    if (scope.daySelected && !scope.modal) {
                      _selectRange(scope, scope.daySelected, day);
                    }
                  };

                  scope.mouseUpSelect = function(day) {
                    if (!scope.modal) {
                      scope.daySelected = null;
                      scope.modal = true;
                    }
                    // alert(day.date.format('YYYY MM D'));
                  };

                  scope.next = function() {
                    var next = scope.month.clone();
                    _removeTime(next.month(next.month()+1).date(1));
                    scope.month.month(scope.month.month()+1);
                    _buildMonth(scope, next, scope.month);
                    _markAvailable(scope);
                  };

                  scope.previous = function() {
                    var previous = scope.month.clone();
                    _removeTime(previous.month(previous.month()-1).date(1));
                    scope.month.month(scope.month.month()-1);
                    _buildMonth(scope, previous, scope.month);
                    _markAvailable(scope);
                  };

                  scope.cancel = function(){
                    scope.modal = false;
                    _clearSelection(scope);
                  }

                  scope.submit = function(){
                    scope.modal = false;
                    _makeDatesAvailable(scope);
                    _updateDates(scope, $http);
                    scope.price = '';
                  }
              }
          };

          function _removeTime(date) {
              return date.day(0).hour(0).minute(0).second(0).millisecond(0);
          }

          function _buildMonth(scope, start, month) {
              scope.weeks = [];
              var done = false, date = start.clone(), monthIndex = date.month(), count = 0;
              while (!done) {
                  scope.weeks.push({ days: _buildWeek(date.clone(), month) });
                  date.add(1, "w");
                  done = count++ > 2 && monthIndex !== date.month();
                  monthIndex = date.month();
              }
          }

          function _buildWeek(date, month) {
              var days = [];
              for (var i = 0; i < 7; i++) {
                  days.push({
                      name: date.format("dd").substring(0, 1),
                      number: date.date(),
                      isCurrentMonth: date.month() === month.month(),
                      isToday: date.isSame(new Date(), "day"),
                      isSelected: false,
                      isAvailable: false,
                      date: date
                  });
                  date = date.clone();
                  date.add(1, "d");
              }
              return days;
          }

          function _selectRange(scope, startDay, endDay) {
            _clearSelection(scope);
            startDay.isSelected = true;
            endDay.isSelected = true;
            scope.selectedDays.dates = [{ date: startDay.date.format('YYYY MM D')}, {date: endDay.date.format('YYYY MM D') } ];
            for (var i in scope.weeks) {
              for (var j = 0; j < 7; j++) {
                if ((startDay.date.isBefore(scope.weeks[i].days[j].date) && endDay.date.isAfter(scope.weeks[i].days[j].date))
                    || (startDay.date.isAfter(scope.weeks[i].days[j].date) && endDay.date.isBefore(scope.weeks[i].days[j].date)))
                {
                  scope.weeks[i].days[j].isSelected = true;
                  scope.selectedDays.dates.push({
                    date: scope.weeks[i].days[j].date.format('YYYY MM D')
                  });
                }
              }
            }
          }

          function _clearSelection(scope){
            for (var i = 0; i < scope.weeks.length; i++) {
              for (var j = 0; j < 7; j++) {
                  scope.weeks[i].days[j].isSelected = false;
                }
              }
              scope.selectedDays = {};
              scope.selectedDays.dates = [];
          };

          function _markAvailable(scope) {
            _clearAvailable(scope);
            for (var i in scope.weeks) {
              for (var j = 0; j < 7; j++) {
                for (var k = 0; k < scope.dates.dates.length; k++){
                  if (scope.weeks[i].days[j].date.isSame(scope.dates.dates[k].date))
                  {
                    scope.weeks[i].days[j].isAvailable = true;
                    scope.weeks[i].days[j].price = scope.dates.dates[k].price;
                  }
                }
              }
            }
          }

          function _clearAvailable(scope){
            for (var i = 0; i < scope.weeks.length; i++) {
              for (var j = 0; j < 7; j++) {
                  scope.weeks[i].days[j].isAvailable = false;
                  scope.weeks[i].days[j].price = '';
                }
              }
          };

          function _makeDatesAvailable(scope){
            for (var i in scope.selectedDays.dates){
              scope.selectedDays.dates[i].price = scope.price;
              scope.selectedDays.dates[i].status = "available";
            }
          };

          function _loadDates(scope, $http){
            $http({
              url: 'dates.php',
              method: 'GET',
              transformResponse: [function (data) {
                  scope.dates = JSON.parse(data);
                  _clearSelection(scope);
                  _markAvailable(scope);
              }]
            });
          }

          function _updateDates(scope, $http){
            scope.postDates = { dates: scope.selectedDays.dates };
            $http.post('dates.php', scope.postDates).then(function (response){
              scope.dates = response.data;
              _clearSelection(scope);
              _clearAvailable(scope);
              _markAvailable(scope);
            });
          }

      }]);
