function Bounds(width, height) {
	var hW = width * 0.5;
	var hH = height * 0.5;

	var min = new THREE.Vector2(-hW,-hH);
	var max = new THREE.Vector2(hW, hH);

	this.edgeRefs = [
		new THREE.Vector3(min.x, 0, 0), // left edge ref
		new THREE.Vector3(0, min.y, 0), // bottom edge ref
		new THREE.Vector3(max.x, 0, 0), // right edge ref
		new THREE.Vector3(0, max.y, 0)  // top edge ref
	];

	this.edgeNormals = [
		new THREE.Vector3(1,0,0), // left edge normal
		new THREE.Vector3(0,1,0), // bottom edge normal
		new THREE.Vector3(-1,0,0), // right edge normal
		new THREE.Vector3(0,-1,0)  // top edge normal
	];

	this.bounds = new THREE.Box2(min, max);

	var geometry = new THREE.BoxGeometry(width, height, 10);
	var material = new THREE.LineBasicMaterial({
		color : 0x00ff00,
		linewidth : 6
	});
	this.cube = new THREE.Mesh( geometry, material );
	this.cube.position.z = -20;
	this.cube.matrixAutoUpdate = true;
	this.edges = new THREE.EdgesHelper( this.cube, 0x00ff00 );	
	GLOBALS.scene.add( this.edges );

	this.update = function(shipsToBound) {

		for (var shipName in shipsToBound) {
			if (shipsToBound.hasOwnProperty(shipName) === false) {
				continue;
			}

			var nextShip = shipsToBound[shipName];

			var curPos = nextShip.triangle.getPosition();		

			if(this.bounds.containsPoint(curPos) === false) { 
				var newPos = new THREE.Vector2();
				this.bounds.clampPoint(curPos, newPos);
				nextShip.triangle.setPosition(newPos);

				// determine which edge we hit
				var edgeRanges = [
					curPos.distanceToSquared(this.edgeRefs[0]), // distance to left edge ref
					curPos.distanceToSquared(this.edgeRefs[1]), // distance to bottom edge ref
					curPos.distanceToSquared(this.edgeRefs[2]), // distance to right edge ref
					curPos.distanceToSquared(this.edgeRefs[3])  // distance to top edge ref
				];

				// which distance is shortest
				var shortestID = 0;

				for (var edgeID=1; edgeID<4; edgeID++) {
					// is the next range smaller than our current shortest.
					if (edgeRanges[edgeID] < edgeRanges[shortestID]) {
						shortestID = edgeID;
					}
				}

				// use the shortestID to index into the normals array
				var normal = this.edgeNormals[shortestID];

				var curV = nextShip.velocity;
				var newV = new THREE.Vector3(curV.x,curV.y,curV.z);
				// reflect the ships velocity about the edge normal, and then scale it down
				// so that the ship bounces off
				newV.reflect(normal);
				newV.multiplyScalar(0.4);
				nextShip.velocity.set(newV.x,newV.y,newV.z);
			}
		}
	}
}