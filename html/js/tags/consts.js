define([
	"lodash"
], function(
	_
) {
	return {
		XOffset: 2000,
		YOffset: 100,
		DefaultWidth: 320,
		DefaultHeight: 568,
		LabelFont: "Helvetica",
		LabelColor: "#5f5f5f",
		BorderColor: "#b5b5b5",
		ViewBackgroundColor: "#f0f0f0",
		ViewBackgroundLabelColor: "#cbcbcf",
		ArrowColor: "#b0b0b0",
		RGBTemplate: _.template("rgb(<%= _red * 255 %>, <%= _green * 255 %>, <%= _blue * 255 %>)"),
		WhiteRGBTemplate: _.template("rgba(<%= _white * 255 %>, <%= _white * 255 %>, <%= _white * 255 %>, ${_alpha})")
	};
});
