
var five = require("johnny-five");

var PORT = "COM11";


 var board = new five.Board({ port:PORT });
const feathers = require('feathers/client');
const socketio = require('feathers-socketio/client');
const io = require('socket.io-client');




board.on("ready", function() {


	var servos = [
		new five.Servo(6),
		new five.Servo(5)
	];
	var laser = new five.Led(7);
	
	
	//socket and feathers initialization
	const socket = io('http://entzun.jazar.org:3030');
	const app = feathers().configure(socketio(socket));
	//bind for connect: just for debug.
	socket.on('connect',function(){
		console.log('connected');
	});

	//Connect to the feathers serrvice
	const arduinosService = app.service('arduinos');
	//Get initial data.

	var arduinoData = arduinosService.find(function(){
		//console.log(arduinoData);
		console.log('find-end');
		arduinoData.then(function(succed){
			//console.log(succed);
		succed.forEach(function(el){
			//console.log(el);
			if(el.id === 'turretLaser'){
				console.log('laser',el.value);
				if(el.value){
					laser.on();
				} else {
					laser.off();
				}
			} else if(el.id.startsWith('turret')){

				var coord = el.id.replace('turret','');
				var index = 0;
				var value = 0;
				if(coord === 'X'){
					console.log('turretX',el.value);
					index = 0;
					value = 255 - el.value
				} else {
					index = 1;
					value = 255 - el.value;
				}

				servos[index].to(value);
			}
			
		

		});
	});
	

	});
	
	
	arduinosService.on('updated',function(data){
		//console.log('updated-data',data);
		if(data.id === 'turretLaser'){
			if(data.value){
				laser.on();
			} else {
				laser.off();
			}

		} else if(data.id.startsWith('turret')){
			var coord = data.id.replace('turret','');
				var index = 0;
				if(coord === 'X'){
					index = 0;
				} else {
					index = 1;
				}
				console.log(data.value);
				servos[index].to(data.value);

		}
		
	


	});
});	