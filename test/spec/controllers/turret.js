'use strict';

describe('Controller: TurretCtrl', function () {

  // load the controller's module
  beforeEach(module('remoteTurretApp'));

  var TurretCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TurretCtrl = $controller('TurretCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(TurretCtrl.awesomeThings.length).toBe(3);
  });
});
