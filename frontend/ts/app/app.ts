declare var angular: any;

var appModule = angular.module('gleniganApp', ['ngRoute', 'gleniganApp.sidebar']);

appModule.config(['$routeProvider', function($routeProvider: any) {
  $routeProvider
    .when('/', {
      templateUrl: 'ts/features/project-list/project-list.html',
      controller: 'ProjectListController'
    })
    .when('/dashboard', {
      templateUrl: 'ts/features/dashboard/dashboard.html',
      controller: 'DashboardController'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);