require([
	"tags",
	"storyboard",
	"Promise",
	"xml2json",
	"fabric",
	"jquery",
	"lodash"
], function(
	tags,
	Storyboard,
	Promise,
	xml2js,
	fabric,
	$,
	_
) {
console.time("parse");
	var xmlText = $("#storyboard").text(),
		xmlDom = $.parseXML(xmlText);
console.timeEnd("parse");

console.time("generate scenes");
	var storyboard = new Storyboard(xmlDom);
console.timeEnd("generate scenes");

console.time("render");
	storyboard.render("canvas");
console.timeEnd("render");

//	fabric.ClippedGroup = fabric.util.createClass(fabric.Group, {
//		type: "clipped_group",
//
//			// default clip options
//		clipTop: 0,
//		clipLeft: 0,
//		clipWidth: 0,
//		clipHeight: 0,
//
//		render: function(ctx)
//		{
//			ctx.save();
//			ctx.beginPath();
//			ctx.rect(
//				this.get("clipTop"), this.get("clipLeft"), this.get("clipWidth"),
//				this.get("clipHeight"));
//			ctx.stroke(); // debugging
//			ctx.closePath();
//			ctx.clip();
//console.log("clip", this.get("clipTop"), this.get("clipLeft"), this.get("clipWidth"),
//				this.get("clipHeight"));
//
//			this.callSuper("render", ctx);
//
//			ctx.restore();
//		},
//
//		containsPoint: function(point)
//		{
//			return (point.x >= this.get("clipLeft") &&
//			point.x <= this.get("clipLeft") + this.get("clipWidth") &&
//			point.y >= this.get("clipTop") &&
//			point.y <= this.get("clipTop") + this.get("clipHeight") &&
//			this.callSuper("containsPoint", point));
//		}
//	});
});
