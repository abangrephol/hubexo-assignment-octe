declare var angular: any;

angular.module('gleniganApp').controller('ProjectListController', ['$scope', 'ProjectService', function($scope: any, ProjectService: any) {
  $scope.projects = [];
  $scope.filters = {
    keyword: '',
    area: '',
    company: '',
    minValue: '',
    maxValue: '',
    startDateFrom: '',
    startDateTo: ''
  };
  $scope.loading = false;
  $scope.error = '';
  $scope.emptyMessage = '';
  $scope.pagination = null;
  $scope.areas = [];
  $scope.companies = [];
  $scope.showFilters = false;

  ProjectService.getAreas().then(function(response: any) {
    if (response.data && response.data.areas) {
      $scope.areas = response.data.areas;
    }
  }).catch(function(_error: any) {
    $scope.areas = [];
  });

  ProjectService.getCompanies().then(function(response: any) {
    if (response.data && response.data.companies) {
      $scope.companies = response.data.companies;
    }
  }).catch(function(_error: any) {
    $scope.companies = [];
  });

  function buildParams(pageNum: number): any {
    const params: any = {};
    if ($scope.filters.keyword) params.keyword = $scope.filters.keyword;
    if ($scope.filters.area) params.area = $scope.filters.area;
    if ($scope.filters.company) params.company = $scope.filters.company;
    if ($scope.filters.minValue) params.minValue = $scope.filters.minValue;
    if ($scope.filters.maxValue) params.maxValue = $scope.filters.maxValue;
    if ($scope.filters.startDateFrom) params.startDateFrom = $scope.filters.startDateFrom;
    if ($scope.filters.startDateTo) params.startDateTo = $scope.filters.startDateTo;
    params.page = pageNum;
    return params;
  }

  $scope.search = function() {
    $scope.loading = true;
    $scope.error = '';
    $scope.emptyMessage = '';

    ProjectService.getProjects(buildParams(1)).then(function(response: any) {
      const data = response.data;
      
      if (data && Array.isArray(data.data)) {
        if (data.data.length === 0) {
          $scope.emptyMessage = 'No projects found matching your search criteria.';
        }
        $scope.projects = data.data;
        $scope.pagination = data.pagination;
      } else if (data && Array.isArray(data)) {
        if (data.length === 0) {
          $scope.emptyMessage = 'No projects found matching your search criteria.';
        }
        $scope.projects = data;
        $scope.pagination = null;
      } else {
        $scope.projects = [];
        $scope.pagination = null;
      }
    }).catch(function(error: any) {
      if (error.status === 404) {
        $scope.error = 'No projects found for the selected filters.';
      } else if (error.status === 429) {
        $scope.error = 'Too many requests. Please try again later.';
      } else if (error.status === 413) {
        $scope.error = 'Too many results. Please narrow your search.';
      } else if (error.status === 0) {
        $scope.error = 'Unable to connect to server. Please check your connection.';
      } else {
        $scope.error = error.data?.message || 'An unexpected error occurred. Please try again.';
      }
    }).finally(function() {
      $scope.loading = false;
    });
  };

  $scope.clearFilters = function() {
    $scope.filters = {
      keyword: '',
      area: '',
      company: '',
      minValue: '',
      maxValue: '',
      startDateFrom: '',
      startDateTo: ''
    };
    $scope.search();
  };

  $scope.nextPage = function() {
    if ($scope.pagination && $scope.pagination.page < $scope.pagination.total_pages) {
      $scope.loading = true;
      ProjectService.getProjects(buildParams($scope.pagination.page + 1)).then(function(response: any) {
        $scope.emptyMessage = '';
        const data = response.data;
        if (data && data.data) {
          if (data.data.length === 0) {
            $scope.emptyMessage = 'No projects found matching your search criteria.';
          }
          $scope.projects = data.data;
          $scope.pagination = data.pagination;
        }
      }).catch(function(error: any) {
        if (error.status === 0) {
          $scope.error = 'Connection lost. Please try again.';
        } else {
          $scope.error = error.data?.message || 'Failed to load more projects.';
        }
      }).finally(function() {
        $scope.loading = false;
      });
    }
  };

  $scope.prevPage = function() {
    if ($scope.pagination && $scope.pagination.page > 1) {
      $scope.loading = true;
      ProjectService.getProjects(buildParams($scope.pagination.page - 1)).then(function(response: any) {
        $scope.emptyMessage = '';
        const data = response.data;
        if (data && data.data) {
          if (data.data.length === 0) {
            $scope.emptyMessage = 'No projects found matching your search criteria.';
          }
          $scope.projects = data.data;
          $scope.pagination = data.pagination;
        }
      }).catch(function(error: any) {
        if (error.status === 0) {
          $scope.error = 'Connection lost. Please try again.';
        } else {
          $scope.error = error.data?.message || 'Failed to load previous page.';
        }
      }).finally(function() {
        $scope.loading = false;
      });
    }
  };

  $scope.search();
}]);