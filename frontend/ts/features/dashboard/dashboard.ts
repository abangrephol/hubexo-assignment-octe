declare var angular: any;

appModule.controller('DashboardController', ['$scope', 'ProjectService', function($scope: any, ProjectService: any) {
  $scope.stats = {
    totalProjects: 0,
    totalValue: 0,
    areasCount: 0,
    companiesCount: 0
  };
  $scope.loading = true;

  ProjectService.getProjects({ per_page: 1 }).then(function(response: any) {
    if (response.pagination) {
      $scope.stats.totalProjects = response.pagination.total;
    }
  }).finally(function() {
    $scope.loading = false;
  });

  ProjectService.getAreas().then(function(response: any) {
    if (response.data && response.data.areas) {
      $scope.stats.areasCount = response.data.areas.length;
    }
  });

  ProjectService.getCompanies().then(function(response: any) {
    if (response.data && response.data.companies) {
      $scope.stats.companiesCount = response.data.companies.length;
    }
  });
}]);