declare var angular: any;

interface Project {
  project_name: string;
  project_start: string;
  project_end: string;
  company: string;
  description: string;
  project_value: number;
  area: string;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface ProjectService {
  getProjects(params: {
    area?: string;
    keyword?: string;
    page?: number;
    per_page?: number;
  }): ng.IHttpPromise<Project[] | { data: Project[]; pagination: Pagination }>;
}

const projectService = angular.module('gleniganApp').factory('ProjectService', ['$http', function($http: ng.IHttpService) {
  return {
    getProjects(params: {
      area?: string;
      keyword?: string;
      page?: number;
      per_page?: number;
    }) {
      return $http.get('/api/projects', { params });
    },
    getAreas() {
      return $http.get('/api/areas');
    }
  };
}]);