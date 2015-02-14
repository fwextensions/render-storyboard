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
	var ArrowCurveRadius = 8,
		ArrowCurveOffset = Math.sqrt(Math.pow(ArrowCurveRadius, 2) / 2),
		ArrowCurveCPDistance = ArrowCurveOffset,
		ArrowLineLength = 45,
		ArrowColor = "#b0b0b0",
		ArrowWidth = 3;


	function Storyboard(
		xmlDOM)
	{
		this.storyboard = xml2js(xmlDOM).document;

			// turn the <scene> elements into JS objects
		this.scenes = this.storyboard.scenes.scene.map(function(sceneData) {
			return new tags.scene(sceneData);
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

			while (segueNode = segueNodes.iterateNext()) {
				this.scenes[i].segues.push(xml2js(segueNode).segue);
			}

			i++;
		}
	}


	_.assign(Storyboard.prototype, {
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

			this.scenes.forEach(function(scene, i) {
				var segues = scene.segues || [],
					element = fabricScenes[i];

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
		},


		calcSeguePath: function(
			element1,
			element2)
		{
			function line(
				start,
				direction)
			{
				return {
					x: start.x,
					y: start.y + ArrowLineLength * direction
				};
			}


			function circleCenter(
				start,
				direction)
			{
				return {
					x: start.x + ArrowCurveOffset * direction,
					y: start.y
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


			function hypotenuse(
				a,
				b)
			{
				return Math.sqrt(
					Math.pow(a.x - b.x, 2),
					Math.pow(b.y - b.y, 2)
				);
			}


			function unitVector(
				from,
				to)
			{
				var magnitude = hypotenuse(from, to),
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
				distance)
			{
				var vector = unitVector(from, to);

				return {
					x: to.x + vector.x * distance,
					y: to.y + vector.y * distance
				};
			}


			var points = this.getConnectingPoints(element1, element2),
				from = points.from,
				to = points.to,
				fromLineEnd = line(from, 1),
				toLineEnd = line(to, -1),
				fromCircleCenter = circleCenter(fromLineEnd, 1),
				toCircleCenter = circleCenter(toLineEnd, -1),
				distance = hypotenuse(fromCircleCenter, toCircleCenter),
				vx = (toCircleCenter.x - fromCircleCenter.x) / distance,
				vy = (toCircleCenter.y - fromCircleCenter.y) / distance,
				c = (2 * ArrowCurveRadius) / distance,
				h = Math.sqrt(Math.max(0, 1 - c * c)),
				nx = vx * c - h * vy,
				ny = vy * c + h * vx,
				middleFrom = middleSegment(fromCircleCenter, nx, ny, 1),
				middleTo = middleSegment(toCircleCenter, nx, ny, -1),
				curve1CP1 = extendLine(from, fromLineEnd, ArrowCurveCPDistance),
				curve1CP2 = extendLine(middleTo, middleFrom, ArrowCurveCPDistance),
				curve2CP1 = extendLine(middleFrom, middleTo, ArrowCurveCPDistance),
				curve2CP2 = extendLine(to, toLineEnd, ArrowCurveCPDistance),
				path;

			path = new Path(from)
				.line(fromLineEnd)
				.cubic(curve1CP1, curve1CP2, middleFrom)
				.line(middleTo)
				.cubic(curve2CP1, curve2CP2, toLineEnd)
				.line(to);

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
						["zero", "halfHeight"],
						["halfWidth", "zero"],
						["width", "halfHeight"],
						["halfWidth", "height"]
					];

					// return a range of points from the middles of the sides of
					// the element
				return sides.slice(range[0], range[1]).map(function(side) {
					return {
						x: x + geometry[side[0]],
						y: y + geometry[side[1]]
					};
				});
			}

			var fromPoints = generatePoints(element1, [2, 4]),
				toPoints = generatePoints(element2, [0, 2]),
				distances;

			distances = _.map(_.zip(fromPoints, toPoints), function(points) {
				var from = points[0],
					to = points[1],
					dx = Math.abs(from.x - to.x),
					dy = Math.abs(from.y - to.y);

				return {
					distance: dx + dy,
					from: from,
					to: to
				};
			});
			distances = _.sortBy(distances, "distance");

				// return the points that are the shortest distance apart
			return distances[0];
		}
	});


	return Storyboard;
});
