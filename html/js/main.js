require([
	"tags",
	"xml2json",
	"fabric",
	"raphael",
	"jquery",
	"lodash"
], function(
	tags,
	xml2js,
	fabric,
	Raphael,
	$,
	_
) {
console.time("parse");
	var xmlText = $("#storyboard").text(),
		xmlDom = $.parseXML(xmlText),
		xml = $(xmlDom),
//		x2js = new xml2js({ arrayAccessForm: "property" }),
//		storyboardData = x2js.xml2json(xmlDom);
		storyboardData = xml2js(xmlDom).document;
console.timeEnd("parse");


console.log(storyboardData);

//	var scenes = xml.find("scene");

//	var display = Raphael("display", 10000, 10000);
	var canvas = new fabric.Canvas("canvas");

//	display.scaleAll(.25);

//	scenes.each(function(i, sceneObject) {
//		var scene = $(sceneObject),
//			origin = scene.find("point")[0],
//			originX = attr(origin, "x") + 2000,
//			originY = attr(origin, "y"),
//			rect = scene.find("rect")[0];
//
////		display.rect(
////			originX + attr(rect, "x"),
////			originY + attr(rect, "y"),
////			attr(rect, "width"),
////			attr(rect, "height")
////		)
////			.attr({fill: "orange"});
//
//		canvas.add(new fabric.Rect({
//			left: originX + attr(rect, "x"),
//			top: originY + attr(rect, "y"),
//			width: attr(rect, "width"),
//			height: attr(rect, "height"),
//			fill: "orange"
//		}));

//console.log($(sceneObject).find("point")[0].attributes.x);
//	});

	_.where(_.find(storyboardData._, { $: "scenes" })._, { $: "scene" }).forEach(function(scene) {
//	storyboardData.scenes.scene.forEach(function(scene) {
//console.log(scene);
		var sceneObject = new tags.scene(scene),
			element = sceneObject.render();
console.log(element);

		canvas.add(element);

//		var sceneObject = new tags.scene(scene);
//
//		canvas.add(sceneObject.render());
	});

	canvas.renderAll();


	function attr(
		object,
		name)
	{
		return parseFloat(object.attributes[name].value);
	}

});
