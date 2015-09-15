function LocalShipDelegate() {
	// constant force that can be applied
	this.UPFORCE = new THREE.Vector2(0,1000);
	// track position/rotation
	this.position = new THREE.Vector3(0,0,0);
	this.rotation = 0;

	// used for simple physics based position updates
	this.velocity = new THREE.Vector3(0,0,0);
	this.mass = 100;

	// flag to track if the space bar is pressed
	this.spacePressed = false;
	// track the last time we fired a projectile
	this.lastFired = 10;
	// flag to set when we should fire the weapon
	this.shouldFire = false;

	// function to update the position/rotation based on user input and current velocity
	this.update = function(deltaTime) {
		// update rotation
		if (GLOBALS.keyboard.pressed("left")) {
			this.rotation += (90*deltaTime);
			// ensure rotation is between 0-360
			if (this.rotation > 360) {
				this.rotation -= 360;
			}
		}

		if (GLOBALS.keyboard.pressed("right")) {
			this.rotation -= (90*deltaTime);
			// ensure rotation is between 0-360
			if (this.rotation < 0) {
				this.rotation += 360;
			}
		}

		// calculate current force to apply this update
		var thisForce = new THREE.Vector2(0,0);

		// are we applying thrust?
		if (GLOBALS.keyboard.pressed("up")) {
			thisForce.add(this.UPFORCE);
		}

		// rotate the force to align with our current heading
		var forwardForce = new THREE.Vector3(thisForce.x,thisForce.y,0);
		var quat = new THREE.Quaternion();
		quat.setFromEuler(new THREE.Euler(0,0,THREE.Math.degToRad(this.rotation), "XYZ"));
		forwardForce.applyQuaternion(quat); 

		// update the velocity with the calculated force
		var acceleration = forwardForce.divideScalar(this.mass);
		// calc new velocity
		this.velocity.add( (acceleration.multiplyScalar(deltaTime)) );
		// clamp velocity
		this.velocity.clamp(new THREE.Vector3(-4,-4,-4), new THREE.Vector3(4,4,4));

		// update position from velocity
		this.position.add(this.velocity);

		this.lastFired += deltaTime;
		// can we fire a projectile?
		if (GLOBALS.keyboard.pressed("space")) {
			this.spacePressed = true;
		} else if (this.spacePressed === true) {
			this.spacePressed = false;

			if (this.lastFired >= 0.25) { // no more that 4 shots/sec
				this.shouldFire = true;				
			}
		}

		// send updates to the network
		var dataObj = {
			name : GLOBALS.playerName,
			pos : this.position,
			rot : this.rotation
		};

		Networking.SendPlayerUpdate(dataObj);
	};

	// access the current position
	this.getPosition = function() {
		return new THREE.Vector2(this.position.x, this.position.y);
	};

	// override the current position
	this.setPosition = function(newPos) {
		this.position.set(newPos.x, newPos.y);
	}

	// access the current rotation
	this.getRotation = function() {
		return this.rotation;
	};

	this.shouldFireWeapon = function() {
		var ret = {fire: this.shouldFire, vel: null, pos: this.position};
		this.shouldFire = false;

		if (ret.fire) {
			// calculate a velocity for the projectile in the current heading
			var projVel = new THREE.Vector3(0,600,0);		
			var quat = new THREE.Quaternion();
			quat.setFromEuler(new THREE.Euler(0,0,THREE.Math.degToRad(this.rotation), "XYZ"));
			projVel.applyQuaternion(quat);
			// reset timer
			this.lastFired = 0;
			ret.vel = projVel;		
		}

		return ret;
	};

	this.reset = function() {
		this.position = new THREE.Vector3(0,0,0);
		this.rotation = 0;
		this.velocity = new THREE.Vector3(0,0,0);
		this.lastFired = 10;
		this.shouldFire = false;
	};
}