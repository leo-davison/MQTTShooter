/************************* Global Vars *************************/
GLOBALS = {
	keyboard : new THREEx.KeyboardState(),
	renderer : new THREE.WebGLRenderer({
		antialias : true,
		alpha : true		
	}),
	scene : new THREE.Scene(),
	camera : null,
	playerName : "player_" + new Date().getTime(),
	screenDimensions : new THREE.Vector2(window.innerWidth,window.innerHeight)
};
/***************************************************************/

function setup() {
	GLOBALS.renderer.setSize( GLOBALS.screenDimensions.x, GLOBALS.screenDimensions.y); 
	GLOBALS.renderer.autoClear = true;
	GLOBALS.renderer.setClearColor(new THREE.Color(0,0,0), 1);
	document.body.appendChild( GLOBALS.renderer.domElement );	

	GAMESCENE.Setup();
	Networking.Initialise();
}

function update() {
	UTILS.updateSimulation(function(deltaTime) {
		// do update here
		GAMESCENE.Update(deltaTime);
		Networking.Update(deltaTime);	
	});
}

function mainLoop() {
	requestAnimationFrame( mainLoop );
	update();
	GLOBALS.renderer.render(GLOBALS.scene, GLOBALS.camera.camera);
}

// setup and start the game
function startGame() {
	setup();
	mainLoop();
}

