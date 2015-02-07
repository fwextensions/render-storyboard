/*
	To do:

	Done:
*/


// ===========================================================================
define([
//	"../fw/defaults",
//	"./state",
//	"./color",
//	"./regex",
	"./utils",
	"lodash"
], function(
//	defaults,
//	state,
//	color,
//	re,
	utils,
	_
) {
//	const NumberUnitsRE = re.NumberUnits,
//		CommaRE = re.Comma,
//		WhitespaceCommaRE = re.WhitespaceComma,
//		SemiColonRE = re.SemiColon,
//		StyleAttributesRE = re.StyleAttributes,
//		MatrixTransformRE = re.MatrixTransform,
//		TranslateTransformRE = re.TranslateTransform;


	// =======================================================================
	function addAttribute(
		inDestination,
		inProperty,
		inAttr,
		inAttrProperty)
	{
		if (inAttrProperty in inAttr) {
			inDestination[inProperty] = inAttr[inAttrProperty];
		}
	}


	// =======================================================================
	function defaultAttributes(
		inConstructor,
		inDefaults)
	{
		return _.createObject(inConstructor.prototype.DefaultAttributes, inDefaults);
	}


	// =======================================================================
	function tag(
		inName,
		inSuper,
		inPrototype)
	{
		if (typeof inName != "string") {
			inPrototype = inSuper;
			inSuper = inName;
			inName = "";
		}

		if (typeof inSuper == "string") {
			inSuper = tags[inSuper];
		}

		if (typeof inSuper != "function") {
			inPrototype = inSuper;

				// this used to set inSuper directly to TagBase, which was a
				// local variable in the define() call.  that worked when all
				// of the tag() calls were in this define.  but when they were
				// broken out into different modules, calls to tag() that didn't
				// specify a super class failed, because the local TagBase var
				// was null, which was it's value when the tag() function was
				// created, even though it had been updated by the call below to
				// define the base class.  this same code worked in Chrome, but
				// failed in FW.  so instead, set TagBase as a property of the
				// api var below, and when we need it as a default super class,
				// we access through the api object, which works.
			inSuper = api.TagBase;
		}

		var constructor = function()
			{
				this.init.apply(this, arguments);
			};

		var newClass = utils.defineClass(
			constructor,
			inPrototype,
			inSuper);

		if (inName) {
			constructor.NAME = inName;
			tags[inName] = newClass;
		}

		return newClass;
	}


	var tags = {},
		api = {
			tags: tags,
			tag: tag,
			defaultAttributes: defaultAttributes
		};


	// =======================================================================
	api.TagBase = tag({
		node: null,
		type: "",
		id: "",
		name: "",


		init: function(
			inNode)
		{
			this.node = inNode;
			this.type = inNode.$;
			this.id = inNode._id;
		},


		render: function()
		{
		},


		addAttributes: function(
			node,
			keys)
		{
			keys = _.filter(keys || _.keys(node), function(key) {
					return key.indexOf("_") == 0;
				});

			_.each(keys, function(key) {
				var value = node[key];

				if (!isNaN(value)) {
					value = parseFloat(value);
				}

				this[key.slice(1)] = value;
			}, this);
		},


		bounds: function()
		{
			var x = this.attr.x || 0,
				y = this.attr.y || 0;

			return {
				left: x,
				top: y,
				right: x + this.attr.width,
				bottom: y + this.attr.height
			};
		},


		clip: function(
			inElement)
		{
			var clipPath = state.getDef(this.node.attributes["clip-path"]);

			if (clipPath && inElement) {
					// add ourselves to the clipping path
				clipPath.addClippedChild(inElement);

				return true;
			} else {
				return false;
			}
		}
	});


	// =======================================================================
	api.create = function(
		type,
		node)
	{
		var constructor = tags[type];

		if (constructor) {
			return new constructor(node);
		} else {
			return null;
		}
	};


	return api;
});
