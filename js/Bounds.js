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
	});//new THREE.MeshBasicMaterial( {color: 0x00ff00} );
	this.cube = new THREE.Mesh( geometry, material );
	this.cube.position.z = -20;
	this.cube.matrixAutoUpdate = true;
	this.edges = new THREE.EdgesHelper( this.cube, 0x00ff00 );
	//scene.add( this.cube );
	GLOBALS.scene.add( this.edges );

	this.update = function(shipsToBound) {		

		for (var i=0; i<shipsToBound.length; i++) {
			var curPos = shipsToBound[i].getPosition();		
			var newPos = new THREE.Vector2();
			this.bounds.clampPoint(curPos, newPos);
			shipsToBound[i].setPosition(newPos);
		}		
	}
}