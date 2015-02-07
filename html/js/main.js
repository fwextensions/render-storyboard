require([
	"tags",
	"Promise",
	"xml2json",
	"fabric",
	"jquery",
	"lodash"
], function(
	tags,
	Promise,
	xml2js,
	fabric,
	$,
	_
) {
console.time("parse");
	var xmlText = $("#storyboard").text(),
		xmlDom = $.parseXML(xmlText),
		storyboardData = xml2js(xmlDom).document;
console.timeEnd("parse");


console.log(storyboardData);

	var canvas = new fabric.Canvas("canvas");

	fabric.ClippedGroup = fabric.util.createClass(fabric.Group, {
		type: "clipped_group",

			// default clip options
		clipTop: 0,
		clipLeft: 0,
		clipWidth: 0,
		clipHeight: 0,

		render: function(ctx)
		{
			ctx.save();
			ctx.beginPath();
			ctx.rect(
				this.get("clipTop"), this.get("clipLeft"), this.get("clipWidth"),
				this.get("clipHeight"));
			ctx.stroke(); // debugging
			ctx.closePath();
			ctx.clip();
console.log("clip", this.get("clipTop"), this.get("clipLeft"), this.get("clipWidth"),
				this.get("clipHeight"));

			this.callSuper("render", ctx);

			ctx.restore();
		},

		containsPoint: function(point)
		{
			return (point.x >= this.get("clipLeft") &&
			point.x <= this.get("clipLeft") + this.get("clipWidth") &&
			point.y >= this.get("clipTop") &&
			point.y <= this.get("clipTop") + this.get("clipHeight") &&
			this.callSuper("containsPoint", point));
		}
	});

console.time("generate scenes");
		// turn the <scene> elements into JS objects
	var scenes = _.where(_.find(storyboardData._, { $: "scenes" })._, { $: "scene" }).map(function(scene) {
			return new tags.scene(scene);
		});
console.timeEnd("generate scenes");

console.time("render");
	Promise.all(_.invoke(scenes, "render")).then(function(fabricScenes) {
			// wait for all the scenes to be rendered, then add them all in one
			// go, without rendering on each add, which should be faster.  then
			// render the whole canvas.
		canvas.renderOnAddRemove = false;
		canvas.add.apply(canvas, fabricScenes);
		canvas.renderAll(true);
console.timeEnd("render");
	});


	function attr(
		object,
		name)
	{
		return parseFloat(object.attributes[name].value);
	}

});
