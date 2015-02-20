define([
	"./path",
	"./tags",
	"./tags/utils",
	"Promise",
	"fabric",
	"xml2json",
	"lodash"
], function(
	Path,
	tags,
	utils,
	Promise,
	fabric,
	xml2js,
	_
) {
	var ArrowCurveRadius = 12,
		ArrowCurveCPDistance = ArrowCurveRadius / 2,
		ArrowLineLength = 40,
		ArrowColor = "#b0b0b0",
		ArrowWidth = 3,
		ArrowHeadOffset = 16,
		StoryboardPadding = 10;


	function Storyboard(
		xmlDOM)
	{
		this.storyboard = xml2js(xmlDOM).document;

			// turn the <scene> elements into JS objects
		this.scenes = this.storyboard.scenes.scene.map(function(sceneData) {
			var scene = new tags.scene(sceneData, this);

				// update the min storyboard origin based on this scene's location
			this.updateOrigin(scene);

			return scene;
		}.bind(this));

			// loop through each scene in the XML DOM
		var sceneNodes = document.evaluate("//scene", xmlDOM.documentElement),
			sceneNode,
			segueNodes,
			segueNode,
			i = 0;

		while (sceneNode = sceneNodes.iterateNext()) {
				// look for all the segues at any level within this scene
			segueNodes = document.evaluate(".//segue", sceneNode);

				// convert each XML segue into a JS object and store it on its scene
			while (segueNode = segueNodes.iterateNext()) {
				this.scenes[i].segues.push(xml2js(segueNode).segue);
			}

			i++;
		}
	}


	_.assign(Storyboard.prototype, {
		minX: Infinity,
		minY: Infinity,


		updateOrigin: function(
			scene)
		{
			this.minX = Math.min(this.minX, scene.x);
			this.minY = Math.min(this.minY, scene.y);
		},


		getOriginOffset: function()
		{
			return {
				x: -this.minX + StoryboardPadding,
				y: -this.minY + StoryboardPadding
			};
		},


		render: function(
			canvasID)
		{
			this.canvas = new fabric.Canvas(canvasID);

			Promise.all(_.invoke(this.scenes, "render"))
				.bind(this)
				.then(function(fabricScenes) {
						// wait for all the scenes to be rendered, then add them all in one
						// go, without rendering on each add, which should be faster.  then
						// render the whole canvas.
					this.canvas.renderOnAddRemove = false;
					this.renderSegues(fabricScenes);
					this.canvas.add.apply(this.canvas, fabricScenes);
					this.canvas.renderAll(true);
				});
		},


		renderSegues: function(
			fabricScenes)
		{
				// create an index of the Fabric elements by the ID of the scene's
				// root view, which is what the segues refer to
			var scenesByRootViewID = _.zipObject(this.scenes.map(function(scene, i) {
					return [scene.children[0].id, fabricScenes[i]];
				}));

console.time("render segues");
			this.scenes.forEach(function(scene, i) {
				var segues = scene.segues || [],
					element = fabricScenes[i];

					// calculate a path for each segue and add it to the canvas
				segues.forEach(function(segue) {
					var destination = scenesByRootViewID[segue._destination],
						path = this.calcSeguePath(element, destination);

					this.canvas.add(new fabric.Path(path, {
						stroke: ArrowColor,
						strokeWidth: ArrowWidth,
						fill: null
					}));
				}.bind(this));
			}.bind(this));
console.timeEnd("render segues");
		},


		calcSeguePath: function(
			element1,
			element2)
		{
			var Horizontal = { x: 1, y: 0 },
				Vertical = { x: 0, y: 1 },
				SideIncrements = {
					left: Horizontal,
					top: Vertical,
					right: Horizontal,
					bottom: Vertical
				};


			function line(
				start,
				direction)
			{
					// we want to extend the line horizontally for points that
					// are on the left/right sides, and vertically for those
					// on the top/bottom sides
				var length = ArrowLineLength * direction,
					increment = SideIncrements[start.side];

				return {
					x: start.x + length * increment.x,
					y: start.y + length * increment.y
				};
			}


			function circleCenter(
				start,
				side,
				direction)
			{
				var length = ArrowCurveRadius * direction,
					increment = SideIncrements[side];

					// we need to reverse the 1 and 0 values from SideIncrements
					// when placing the circle
				return {
					x: start.x + length * Math.abs(increment.x - 1),
					y: start.y + length * Math.abs(increment.y - 1)
				};
			}


			function middleSegment(
				point,
				nx,
				ny,
				direction)
			{
				return {
					x: point.x + ArrowCurveRadius * nx * direction,
					y: point.y + ArrowCurveRadius * ny * direction
				};
			}


			function distance(
				a,
				b)
			{
				return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
			}


			function unitVector(
				from,
				to)
			{
				var magnitude = distance(from, to),
					x = (to.x - from.x) / magnitude,
					y = (to.y - from.y) / magnitude;

				x = !_.isFinite(x) ? 0 : x;
				y = !_.isFinite(y) ? 0 : y;

				return {
					x: x,
					y: y
				};
			}


			function extendLine(
				from,
				to,
				distance,
				maxLength)
			{
				var vector = unitVector(from, to);

				distance = Math.min(distance, maxLength);

				return {
					x: to.x + vector.x * distance,
					y: to.y + vector.y * distance
				};
			}


			var points = this.getConnectingPoints(element1, element2),
				from = points.from,
				to = points.to,
					// calculate a short line perpendicular to the from and to points
				fromLineEnd = line(from, 1),
				toLineEnd = line(to, -1),
					// we'll need to move in opposite directions when going from
					// left to right vs. right to left, or bottom to top
				sign = from.x > to.x || from.y > to.y ? -1 : 1,
				fromCircleCenter = circleCenter(fromLineEnd, from.side, sign),
				toCircleCenter = circleCenter(toLineEnd, to.side, -sign),
				d = distance(fromCircleCenter, toCircleCenter),
				vx = (toCircleCenter.x - fromCircleCenter.x) / d,
				vy = (toCircleCenter.y - fromCircleCenter.y) / d,
				c = (2 * ArrowCurveRadius) / d,
				h = Math.sqrt(Math.max(0, 1 - c * c)),
				circleSign = (from.x > to.x ? -1 : 1) * (from.side == "bottom" || from.y > to.y ? 1 : -1),
				nx = vx * c - circleSign * h * vy,
				ny = vy * c + circleSign * h * vx,
				middleFrom = middleSegment(fromCircleCenter, nx, ny, 1),
				middleTo = middleSegment(toCircleCenter, nx, ny, -1),
// TODO: need to make sure the cps don't extend past the toLineEnd point, which causes the curve to bulge
// seems to actually be caused by the middle segment being longer than the distance between the from/to lines
				maxHandleLength = distance(fromLineEnd, middleFrom) / 2,
				curve1CP1 = extendLine(from, fromLineEnd, ArrowCurveCPDistance, maxHandleLength),
				curve1CP2 = extendLine(middleTo, middleFrom, ArrowCurveCPDistance, maxHandleLength),
				curve2CP1 = extendLine(middleFrom, middleTo, ArrowCurveCPDistance, maxHandleLength),
				curve2CP2 = extendLine(to, toLineEnd, ArrowCurveCPDistance, maxHandleLength),
				path;

			path = new Path(from)
				.line(fromLineEnd)
				.cubic(curve1CP1, curve1CP2, middleFrom)
				.line(middleTo)
				.cubic(curve2CP1, curve2CP2, toLineEnd)
				.line(to)
					// draw the arrow head by moving to one end of it so that it's
					// a two-segment line separate from the rest of the line,
					// which gives it a sharp corner.  moving back in both X and Y
					// will be either the top point of the arrow or the left point.
				.move({
					x: to.x - ArrowHeadOffset,
					y: to.y - ArrowHeadOffset
				})
				.line(to)
					// reverse the direction when drawing a side arrow vs. top
				.line({
					x: to.x + ArrowHeadOffset * (to.side == "top" ? 1 : -1),
					y: to.y - ArrowHeadOffset * (to.side == "top" ? 1 : -1)
				});

			return path.svg;
		},


		getConnectingPoints: function(
			element1,
			element2)
		{
			function generatePoints(
				element,
				range)
			{
				range = range || [0, 4];

				var x = element.left,
					y = element.top,
					geometry = {
						width: element.width,
						height: element.height,
						halfWidth: element.width / 2,
						halfHeight: element.height / 2,
						zero: 0
					},
					sides = [
						["zero", "halfHeight", "left"],
						["halfWidth", "zero", "top"],
						["width", "halfHeight", "right"],
						["halfWidth", "height", "bottom"]
					];

					// return a range of points from the middles of the sides of
					// the element
				return sides.slice(range[0], range[1]).map(function(side) {
					return {
						x: x + geometry[side[0]],
						y: y + geometry[side[1]],
						side: side[2]
					};
				});
			}

			var fromPoints = generatePoints(element1, [2, 4]),
				toPoints = generatePoints(element2, [0, 2]),
				distances,
				shortestPath;

				// each point in fromPoints will return an array of two distance
				// objects, so flatten the array of arrays
			distances = _.flatten(fromPoints.map(function(from) {
				return toPoints.map(function(to) {
					var dx = Math.abs(from.x - to.x),
						dy = Math.abs(from.y - to.y);

					return {
						distance: dx + dy,
						from: from,
						to: to
					};
				});
			}));
			shortestPath = _.sortBy(distances, "distance")[0];

				// shift the from point up so it starts under the scene and shift
				// the to point up so there's a gap between the arrow and the
				// destination scene.  do it on the X-axis for horizontal arrows.
			shortestPath.from[shortestPath.from.side == "bottom" ? "y" : "x"] -= 2;
			shortestPath.to[shortestPath.to.side == "top" ? "y" : "x"] -= 6;

				// return the points that are the shortest distance apart
			return shortestPath;
		}
	});


	return Storyboard;
});
