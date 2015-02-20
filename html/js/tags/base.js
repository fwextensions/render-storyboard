// ===========================================================================
define([
//	"./state",
	"./consts",
	"./utils",
	"fabric",
	"lodash"
], function(
//	state,
	k,
	utils,
	fabric,
	_
) {
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
			this.name = inNode._title || "";
		},


		render: function()
		{
			throw new Error("Unimplmented render function called in " + this.type);
		},


		addAttributes: function(
			node,
			keys,
			destination)
		{
			keys = _.filter(keys || _.keys(node), function(key) {
					return key.indexOf("_") == 0;
				});
			destination = destination || this;

			_.each(keys, function(key) {
				var value = node[key];

				if (!isNaN(value)) {
					value = parseFloat(value);
				}

				destination[key.slice(1)] = value;
			}, this);

			return destination;
		},


		splitCamelCase: function(
			string)
		{
			string = string || "";

			return _.invoke(string.split(/(?=[A-Z])/), "trim").join(" ");
		},


		createRect: function(
			overrides)
		{
			var rect = {
					left: this.x,
					top: this.y,
					width: this.width,
					height: this.height,
					fill: null,
					stroke: k.BorderColor
				};

			return new fabric.Rect(_.assign(rect, overrides));
		},


		createGroup: function(
			childElements,
			overrides)
		{
			var group = {
					left: this.x,
					top: this.y
				};

			return new fabric.Group(childElements, _.assign(group, overrides));
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
