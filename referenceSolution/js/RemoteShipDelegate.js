function RemoteShipDelegate(name) {
	this.name = name;
	this.position = new THREE.Vector3(0,0,0);
	this.rotation = 0;

	this.update = function(deltaTime) {
		// nothing to simulate locally
	};

	this.handleRemoteUpdate = function(dataObj) {
		this.position = dataObj.pos;
		this.rotation = dataObj.rot;
	};

	this.getPosition = function() {
		return new THREE.Vector2(this.position.x, this.position.y);
	};

	// access the current rotation
	this.getRotation = function() {
		return this.rotation;
	};

	// never fire the weapon, projectiles for this ship will be added separately
	this.shouldFireWeapon = function() {
		return {fire: false, vel: null, pos: null};		
	};

	this.reset = function() {
		// no-op
	};
}