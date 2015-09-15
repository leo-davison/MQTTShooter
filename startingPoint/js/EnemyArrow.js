var EnemyArrows = EnemyArrows || {};

EnemyArrows.ArrowManager = {
	arrows : [],

	Update : function(delta) {
		for(var i=0; i<this.arrows.length; i++) {
			this.arrows[i].update(delta);
		}
	},

	AddArrow: function(arrow) {
		this.arrows.push(arrow);
	},

	RemoveArrow: function(name) {
		var index = -1;
		for (var i=0; i<this.arrows.length; i++) {
			if (this.arrows[i].other.name === name) {
				index = i;
				break;
			}
		}

		if (index !== -1) {
			GLOBALS.scene.remove(this.arrows[index].arrow);
			this.arrows.splice(index,1);
		}
	}
};

EnemyArrows.EnemyArrow = function(remoteTri) {
	this.other = remoteTri;
	this.local = GAMESCENE.localPlayer;

	var otherPos = this.other.transformDelegate.getPosition();
	var localPos = this.local.transformDelegate.getPosition();

	var direction = new THREE.Vector3(
		otherPos.x - localPos.x,
		otherPos.y - localPos.y,
		0);

	var origin = new THREE.Vector3(
		0,
		0,
		-10);

	var length = 100;
	var color = 0xa00000;

	this.arrow = new THREE.ArrowHelper(direction, origin, length, color, 20, 20);
	this.arrow.matrixAutoUpdate = true;
	GLOBALS.scene.add(this.arrow);

	EnemyArrows.ArrowManager.AddArrow(this);

	this.update = function(delta) {

		if (!this.local.active || !this.other.active) {
			this.arrow.visible = false;
			return;
		} else {
			if (!this.arrow.visible) {
				this.arrow.visible = true;
			}
		}

		var otherPos = this.other.transformDelegate.getPosition();
		var localPos = this.local.transformDelegate.getPosition();

		var direction = new THREE.Vector3(
			otherPos.x - localPos.x,
			otherPos.y - localPos.y,
			0);

		direction.normalize();
		this.arrow.setDirection(direction);
		this.arrow.position.x = localPos.x;
		this.arrow.position.y = localPos.y;
	}
};