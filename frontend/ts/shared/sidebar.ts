declare var angular: any;

var sidebarModule = angular.module('gleniganApp.sidebar', []);

sidebarModule.directive('sidebar', ['$location', function($location: any) {
    return {
        restrict: 'E',
        templateUrl: 'ts/shared/sidebar.html',
        link: function(scope: any) {
            scope.$location = $location;
        }
    };
}]);