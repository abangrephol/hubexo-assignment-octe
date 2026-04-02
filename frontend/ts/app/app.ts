declare var angular: any;

var appModule = angular.module('gleniganApp', ['ngRoute']);

appModule.config(['$routeProvider', function($routeProvider: any) {
  $routeProvider
    .when('/', {
      templateUrl: 'ts/features/project-list/project-list.html',
      controller: 'ProjectListController'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);