var phonecatApp = angular.module('tomatoApp', ['LocalStorageModule']);
phonecatApp.controller('TomatoController', ['$scope', '$interval', '$sce', 'localStorageService', function TomatoController($scope, $interval, $sce, localStorageService) {
    $scope.movieUrl = localStorageService.get('movieUrl') ||
        'https://www.youtube.com/embed/QH2-TGUlwu4?autoplay=1';
    //https://www.youtube.com/embed/1paueaTWFRE?autoplay=1&start=1&end=4
    $scope.rules =
        localStorageService.get('pomodoroRules') ||
        "09:00|Stand Up\n" +
        "09:10|Pomodoro\n" +
        "10:00|Break\n" +
        "10:10|Pomodoro\n" +
        "11:00|Break\n" +
        "11:10|Pomodoro\n" +
        "12:00|Lunch\n" +
        "13:00|Pomodoro\n" +
        "13:50|Break\n" +
        "14:00|Pomodoro\n" +
        "14:45|Team Meeting\n" +
        "15:20|Pomodoro\n" +
        "16:10|Break\n" +
        "16:20|Pomodoro\n" +
        "16:58|Do Actuals\n" +
        "17:00|Go Home";
    $scope.schedule = [];
    var lastTimeout = null;

    var colorRules = {
        "Pomodoro": "red",
        "Break": "green",
        "Stand Up": "green",
        "Lunch": "blue",
        "Team Meeting": "blue",
        "Do Actuals": "green",
        "Go Home": "blue"
    };

    $scope.getCurrentColor = function () {
        if ($scope.current) {
            var color = colorRules[$scope.current.label];
            return color || 'green';
        }
        return 'black';
    };

    $scope.sizingClass = function () {
        return $scope.showMinutes() ? $scope.showHours() ? '' : 'hoursHidden' : 'minutesHidden';
    }

    $scope.getTimeRepresentation = function () {
        return ($scope.showHours() ? $scope.clock.hours + ':' : '')
            + ($scope.showMinutes() ? $scope.clock.minutes + ':' : '')
            + $scope.clock.seconds;
    }

    $scope.showHours = function () {
        return $scope.clock.hours !== '00';
    }

    $scope.showMinutes = function () {
        return $scope.showHours() || $scope.clock.minutes !== '00';
    }

    var calculateMsTillTime = function (time) {
        var now = new Date();
        var dateAndTime = new Date().toDateString() + " " + time;
        var msTillTime = new Date(Date.parse(dateAndTime)) - now;
        if (msTillTime < 0) { // it's after that time today, try tomorrow.
            msTillTime += 86400000;
        }
        return msTillTime;
    };

    var performCallbackAtTime = function (time, callback) {
        if (lastTimeout) {
            clearTimeout(lastTimeout);
        }
        var msTillTime = calculateMsTillTime(time);
        lastTimeout = setTimeout(function () {
            lastTimeout = null;
            callback();
        }, msTillTime);
    }

    var tick = function () {
        var timeTill = calculateMsTillTime($scope.next.time);
        var hours = Math.trunc(timeTill / 1000 / 60 / 60);
        var zerofilledHours = ('0000' + hours).slice(-2);
        var minutes = Math.trunc(timeTill / 1000 / 60) - hours * 60;
        var zerofilledMinutes = ('0000' + minutes).slice(-2);
        var seconds = Math.trunc(timeTill / 1000) - (minutes + hours * 60) * 60;
        var zerofilledSeconds = ('0000' + seconds).slice(-2);
        $scope.clock = { hours: zerofilledHours, minutes: zerofilledMinutes, seconds: zerofilledSeconds };
    }
    $interval(tick, 1000);

    var setupCallback = function () {
        var lines = $scope.rules.split('\n');
        $scope.schedule = _.map(lines, function (line) {
            var parts = line.split('|');
            if (parts.length !== 2) {
                return null;
            }
            return { time: parts[0], label: parts[1] };
        });

        var sorted = _.sortBy($scope.schedule, function (item) {
            if (item) {
                var msTillTime = calculateMsTillTime(item.time);
                return msTillTime;
            }
        });

        $scope.next = sorted[0];
        $scope.current = _.last(sorted);

        var playMusic = function () {
            $scope.sound = $sce.trustAsHtml('<iframe width="560" height="315" src="' + $scope.movieUrl + '" frameborder="0">' + new Date().toString() + '</iframe>');
            $scope.playing = true;
        };

        var callback = function () {
            playMusic();
            setupCallback();
        };

        performCallbackAtTime($scope.next.time, callback);

    };

    $scope.stopMusic = function () {
        $scope.sound = $sce.trustAsHtml('<div></div>');
        $scope.playing = false;
    };

    $scope.$watch('rules', function (newValue, oldValue) {
        setupCallback();
        tick();
        localStorageService.set('pomodoroRules', newValue);
    });

    $scope.$watch('movieUrl', function (newValue, oldValue) {
        localStorageService.set('movieUrl', newValue);
    });
}]);