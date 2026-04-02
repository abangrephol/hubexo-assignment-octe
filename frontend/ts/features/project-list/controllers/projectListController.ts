declare var angular: any;

interface ProjectListScope extends ng.IScope {
  projects: any[];
  pagination: any;
  area: string;
  keyword: string;
  loading: boolean;
  error: string;
  emptyMessage: string;
  areas: string[];
  search: () => void;
  nextPage: () => void;
  prevPage: () => void;
}

appModule.controller('ProjectListController', ['$scope', 'ProjectService', function($scope: ProjectListScope, ProjectService: any) {
  $scope.projects = [];
  $scope.area = '';
  $scope.keyword = '';
  $scope.loading = false;
  $scope.error = '';
  $scope.emptyMessage = '';
  $scope.pagination = null;
  $scope.areas = [];

  ProjectService.getAreas().then(function(response: any) {
    if (response.data && response.data.areas) {
      $scope.areas = response.data.areas;
    }
  }).catch(function(_error: any) {
    $scope.areas = [];
  });

  $scope.search = function() {
    $scope.loading = true;
    $scope.error = '';

    const params: any = {};
    if ($scope.area && $scope.area !== '') {
      params.area = $scope.area;
    }
    if ($scope.keyword && $scope.keyword !== '') {
      params.keyword = $scope.keyword;
    }
    params.page = 1;

    ProjectService.getProjects(params).then(function(response: any) {
      $scope.error = '';
      $scope.emptyMessage = '';
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        if (response.data.data.length === 0) {
          $scope.emptyMessage = 'No projects found matching your search criteria.';
        }
        $scope.projects = response.data.data;
        $scope.pagination = response.data.pagination;
      } else if (response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          $scope.emptyMessage = 'No projects found matching your search criteria.';
        }
        $scope.projects = response.data;
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

  $scope.nextPage = function() {
    if ($scope.pagination && $scope.pagination.page < $scope.pagination.total_pages) {
      $scope.loading = true;
      const params: any = {};
      if ($scope.area && $scope.area !== '') params.area = $scope.area;
      if ($scope.keyword && $scope.keyword !== '') params.keyword = $scope.keyword;
      params.page = $scope.pagination.page + 1;

      ProjectService.getProjects(params).then(function(response: any) {
        $scope.emptyMessage = '';
        
        if (response.data && response.data.data) {
          if (response.data.data.length === 0) {
            $scope.emptyMessage = 'No projects found matching your search criteria.';
          }
          $scope.projects = response.data.data;
          $scope.pagination = response.data.pagination;
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
      const params: any = {};
      if ($scope.area && $scope.area !== '') params.area = $scope.area;
      if ($scope.keyword && $scope.keyword !== '') params.keyword = $scope.keyword;
      params.page = $scope.pagination.page - 1;

      ProjectService.getProjects(params).then(function(response: any) {
        $scope.emptyMessage = '';
        
        if (response.data && response.data.data) {
          if (response.data.data.length === 0) {
            $scope.emptyMessage = 'No projects found matching your search criteria.';
          }
          $scope.projects = response.data.data;
          $scope.pagination = response.data.pagination;
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