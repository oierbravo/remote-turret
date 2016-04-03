'use strict';
var config = {
  server: 'http://entzun.jazar.org:3030',
  idProperty: 'id'
}
/**
 * @ngdoc overview
 * @name remoteTurretApp
 * @description
 * # remoteTurretApp
 *
 * Main module of the application.
 */
angular
  .module('remoteTurretApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngFeathers'
  ])
  .config(function ($routeProvider,FeathersProvider) {
     FeathersProvider.defaults.server = config.server;
     FeathersProvider.defaults.idProperty = config.idProperty;
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/turret', {
        templateUrl: 'views/turret.html',
        controller: 'TurretCtrl',
        controllerAs: 'turret'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
