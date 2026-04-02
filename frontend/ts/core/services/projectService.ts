declare var angular: any;

interface ProjectParams {
  area?: string;
  keyword?: string;
  page?: number;
  per_page?: number;
  company?: string;
  minValue?: number;
  maxValue?: number;
  startDateFrom?: string;
  startDateTo?: string;
}

const projectService = angular.module('gleniganApp').factory('ProjectService', ['$http', function($http: ng.IHttpService) {
  return {
    getProjects(params: ProjectParams) {
      return $http.get('/api/projects', { params });
    },
    getAreas() {
      return $http.get('/api/areas');
    },
    getCompanies() {
      return $http.get('/api/companies');
    }
  };
}]);