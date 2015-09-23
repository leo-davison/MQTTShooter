function Bounds(width, height) {
	var hW = width * 0.5;
	var hH = height * 0.5;

	var min = new THREE.Vector2(-hW,-hH);
	var max = new THREE.Vector2(hW, hH);

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
		
		for (var i=0; i<shipsToBound.length; i++) {
			var curPos = shipsToBound[i].triangle.getPosition();		

			if(this.bounds.containsPoint(curPos) === false) { 
				var newPos = new THREE.Vector2();
				this.bounds.clampPoint(curPos, newPos);
				shipsToBound[i].triangle.setPosition(newPos);

				// which edge have we gone through?
				var edge = 0;

				if (curPos.x <= this.bounds.min.x) {
					edge = 1;
				} else if (curPos.x >= this.bounds.max.x) {
					edge = 2;
				}

				if (curPos.y <= this.bounds.min.y) {
					edge = 4;
				} else if (curPos.y >= this.bounds.max.y) {
					edge = 8;
				}

				var normal = new THREE.Vector3();

				switch(edge) {
					case 1:
					normal.set(1,0,0);
					break;

					case 2:
					normal.set(-1,0,0);
					break;

					case 4:
					normal.set(0,1,0);
					break;

					case 8:
					normal.set(0,-1,0);
					break;
				}

				var curV = shipsToBound[i].velocity;
				var newV = new THREE.Vector3(curV.x,curV.y,curV.z);
				newV.reflect(normal);
				newV.multiplyScalar(0.6);
				shipsToBound[i].velocity.set(newV.x,newV.y,newV.z);
			}			
		}
	}
}