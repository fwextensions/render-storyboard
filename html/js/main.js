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
console.timeEnd("render");
});
