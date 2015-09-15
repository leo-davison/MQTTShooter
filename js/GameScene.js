var GAMESCENE = {
	// list of all the ships in the scene
	triShips : [],

	// reference to the local player ship
	localPlayer : null,

	// Bounding area for the game
	bounds : null,

	// setup the scene
	Setup : function() {
		// setup a background
		var size = window.innerWidth * 8;
		var step = 80;
		var gridHelper = new THREE.GridHelper( size, step );
		gridHelper.position.z -= 10;
		gridHelper.rotation.x = (THREE.Math.degToRad(-90));
		gridHelper.material.transparent = true;
		gridHelper.material.opacity = 0.2;				
		GLOBALS.scene.add( gridHelper );

		// setup a local player
		this.localPlayer = GAMESCENE.AddTriangleShip(0x1fb4da, new LocalShipDelegate());

		// setup the camera
		GLOBALS.camera = new ChaseCam(30);
		GLOBALS.camera.setTarget(this.localPlayer.transformDelegate);

		// setup the game bounds object
		this.bounds = new Bounds(5000, 5000);
	},

	// update the scene
	Update : function(deltaTime) {
		var shipArray = [this.localPlayer.transformDelegate];
		// update the bounding area
		this.bounds.update(shipArray);
		// update all the ships
		for (var i=0; i<this.triShips.length; i++) {
			this.triShips[i].update(deltaTime);
		}

		// update the camera
		GLOBALS.camera.update(deltaTime);

		// update UI Arrows
		EnemyArrows.ArrowManager.Update(deltaTime);

		// update all the projectiles in the scene
		ProjectileManager.update(deltaTime);

		// perform collision detection
		Collision.CollisionManager.Update(deltaTime);

		// update particle effects
		Particles.ParticleManager.Update(deltaTime);
	},

	// create a new triship and add it to the scene
	AddTriangleShip : function(colour, positionDelegate) {
		var ship = new TriangleShip(colour, positionDelegate);
		this.triShips.push(ship);
		return ship;
	},

	RemoveTriangleShip : function(obj) {
		var index = -1;

		for (var i=0; i<this.triShips.length; i++) {
			if (this.triShips[i] === obj) {
				index = i;
				break;
			}
		}

		if (index !== -1) {
			this.triShips[i].permaDead = true;
			this.triShips[i].reset();
			this.triShips.splice(index,1);
			console.log("removes tri ship");
		}
	}
};