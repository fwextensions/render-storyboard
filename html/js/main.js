require([
	"storyboard",
	"jquery"
], function(
	Storyboard,
	$
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
//	storyboard.render("canvas").then(function(svg) {
//console.log(svg.slice(0, 155));
//		$("body").append(svg.slice(154));
//	});
console.timeEnd("render");
});
