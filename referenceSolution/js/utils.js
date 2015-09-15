/************************* Utility Functions *************************/
UTILS = {
	// ensures that update is called the appropriate number of
	// times to ensure a constant update dt.
	updateSimulation : (function(func) {
		var clock = new THREE.Clock(true);		
		var dt = 1/60;
		var accum = 0;
		var currentTime = clock.getElapsedTime();

		return function(func) {
			var newTime = clock.getElapsedTime();
			var frameTime = newTime - currentTime;
			currentTime = newTime;

			accum += frameTime;

			while (accum >= dt) {
				func(dt);
				accum -= dt;				
			}
		};
	})(),

	// functions used as part of collision detection
	side: function(p, q, a, b) {
		var z1 = (b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y);
	    var z2 = (b.x - a.x) * (q.y - a.y) - (q.x - a.x) * (b.y - a.y);
	    return z1 * z2;
	},

	intersecting: function(p0, p1, t0, t1, t2) {
		var f1 = this.side(p0, t2, t0, t1);
		var f2 = this.side(p1, t2, t0, t1);
    	var f3 = this.side(p0, t0, t1, t2);
    	var f4 = this.side(p1, t0, t1, t2);
    	var f5 = this.side(p0, t1, t2, t0);
    	var f6 = this.side(p1, t1, t2, t0);
    	var f7 = this.side(t0, t1, p0, p1);
    	var f8 = this.side(t1, t2, p0, p1);

    	if ((f1 < 0 && f2 < 0) || (f3 < 0 && f4 < 0) || (f5 < 0 && f6 < 0) || (f7 > 0 && f8 > 0)) {
        	return false;
        }

        return true;
	} 
};

/*********************************************************************/