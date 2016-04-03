'use strict';

/**
 * @ngdoc function
 * @name remoteTurretApp.controller:TurretCtrl
 * @description
 * # TurretCtrl
 * Controller of the remoteTurretApp
 */
angular.module('remoteTurretApp')
  .controller('TurretCtrl',['$scope','Feathers', function ($scope,Feathers) {
    var Datos = Feathers.service('arduinos');

    $scope.Datos = Datos.refresh({}).then(function(succed){
    	succed.forEach(function(el,ind){
    		$scope[el.id] = el.value;
    		if(el.id === "turretLaser"){
    			$scope.turretLaser = el.value;
    		} else {
    			if(el.id.startsWith('turret')){
    				var coord = el.id.replace('turret','');
    				if(coord === 'X'){
    					$scope.turretX = el.value;
    				} else {
    					$scope.turretY = el.value;
    				}
    			}
    		}

    	});
    },function(reject){
    	console.log(reject);
    });
    Datos.on('updated',function(id,data){
    	if(id === 'turretLaser'){
    		console.log('laser');
    	}
    });
    $scope.drawImage = function(y,x){
	  if ($scope.mouseIsDown)
	    $scope.map[y][x] = "green";
	}

	$scope.setFlag = function(y,x){
	   $scope.mouseIsDown = true;
	   this.drawImage(y,x)
	}

	$scope.removeFlag = function(){
	   $scope.mouseIsDown = false;
	}

	$scope.mouseMoving = function(event){
		//console.log('mooving',event.offsetX,event.offsetY);
		//console.log(event);
		var x =Math.round((event.offsetX * 255)/450);
		var y =255 -Math.round((event.offsetY * 255)/450);
		$scope.turretX = x;
		$scope.turretY = y;
		Datos.update({id:'turretX',value:x});
		Datos.update({id:'turretY',value:y});
	/*	var el = $('.turret-pointer').css({
			'left':event.offsetX,
			'top':event.offsetY
		})*/
		//console.log(el);
	}
	$scope.laserToggle = function($event){
		//console.log('Laser-toggle');
		var val = $scope.turretLaser;
		var output = 0;
		if(val){
			output = 0;
		} else {
			output = 1;
		}
		$scope.turretLaser = output;
		Datos.update({id:'turretLaser',value:output});
	}
  }]);

