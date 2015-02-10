define([
	"./tags",
	"./tags/utils",
	"./tags/consts",
	"Promise",
	"fabric",
	"xml2json",
	"lodash"
], function(
	tags,
	utils,
	k,
	Promise,
	fabric,
	xml2js,
	_
) {
	function Storyboard(
		xmlDOM)
	{
		this.storyboard = xml2js(xmlDOM).document;

			// turn the <scene> elements into JS objects
		this.scenes = this.storyboard.scenes.scene.map(function(sceneData) {
			return new tags.scene(sceneData);
		}.bind(this));
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
				var segues = scene.children[0].segues || [],
					element = fabricScenes[i];

				segues.forEach(function(segue) {
					var destination = scenesByRootViewID[segue._destination],
						points = this.getConnectingPoints(element, destination);

					this.canvas.add(new fabric.Line(
						[points.from.x, points.from.y, points.to.x, points.to.y],
						{
							stroke: k.ArrowColor,
							strokeWidth: k.ArrowWidth
						}
					));
				}.bind(this));
			}.bind(this));
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
