function ChaseCam(maxDistance) {
	this.target = null;
	this.camera = new THREE.OrthographicCamera(GLOBALS.screenDimensions.x / -2, GLOBALS.screenDimensions.x / 2, GLOBALS.screenDimensions.y / 2, GLOBALS.screenDimensions.y / -2, 1, 100);
	this.camera.position.z = 1;
	this.maxDistance = maxDistance;
}

ChaseCam.prototype.setTarget = function(targetObj) {
	this.target = targetObj;
}

ChaseCam.prototype.update = function(deltaTime) {
	if ( (this.target === null) || ("getPosition" in this.target === false)) {
		return;
	}

	var camPos = new THREE.Vector2(this.camera.position.x, this.camera.position.y);
	var tPos = new THREE.Vector2(this.target.getPosition().x, this.target.getPosition().y);
	
	var distance = camPos.distanceTo(tPos);

	if (distance >= this.maxDistance) {
		var tVec = new THREE.Vector2(0,0);
		tVec.subVectors(tPos, camPos);
		tVec.multiplyScalar(deltaTime);
		this.camera.position.x += tVec.x;
		this.camera.position.y += tVec.y;
	}

	this.camera.updateProjectionMatrix();
}