// ===========================================================================
define([
	"lodash"
], function(
	_
) {
	// =======================================================================
	function defineClass(
		inConstructor,
		inPrototype,
		inSuper)
	{
		inPrototype = inPrototype || {};

		if (inSuper) {
			var superProto = inSuper.prototype,
				superMethodRE = /\b_super\b/,
				protoValue,
				protoValueIsFn,
				className = inConstructor.NAME ? inConstructor.NAME + "." : "";

				// inherit from inSuper
			inPrototype.__proto__ = superProto;

			for (var name in inPrototype) {
				protoValue = inPrototype[name];
				protoValueIsFn = typeof protoValue == "function";

				if (inPrototype.hasOwnProperty(name) &&
						protoValueIsFn &&
						typeof superProto[name] == "function" &&
						superMethodRE.test(protoValue)) {
					inPrototype[name] = (function(name, fn) {
						return function() {
							var temp = this._super;

								// Add a new ._super() method that is the same method
								// but on the super-class
							this._super = superProto[name];

								// The method only need to be bound temporarily, so we
								// remove it when we're done executing
							var result = fn.apply(this, arguments);
							this._super = temp;

							return result;
						};
					})(name, protoValue);
				}

				if (protoValueIsFn) {
					inPrototype[name].NAME = protoValue.name || className + name;
				}
			}
		}

		inPrototype.constructor = inConstructor;
		inConstructor.prototype = inPrototype;

		return inConstructor;
	}


	// =======================================================================
	function findOne(
		node,
		type)
	{
		var path = type.split(".");

			// loop through each element in the path, looking for a child
			// in the current node
		return _.reduce(path, function(node, type) {
			return node[type] || _.find(node._, { $: type });
		}, node);
	}


	// =======================================================================
	function findAll(
		node,
		type)
	{
		var path = type.split("."),
			last = path.length - 1;

			// loop through each element in the path, looking for a child
			// in the current node
		return _.reduce(path, function(node, type, i) {
			if (!node) {
				return [];
			} else if (i == last) {
				return _.where(node._, { $: type });
			} else {
				return node[type] || _.find(node._, { $: type });
			}
		}, node);
	}


	// =======================================================================
	function hexToRGBA(
		inHex,
		inAlpha)
	{
		var r = parseInt(inHex.slice(1, 3), 16),
			g = parseInt(inHex.slice(3, 5), 16),
			b = parseInt(inHex.slice(5, 7), 16),
			a = parseInt(inHex.slice(7), 16);

		if (!isNaN(inAlpha)) {
			a = inAlpha / 100;
		} else if (!isNaN(a)) {
			a /= 255;
		} else {
			a = 1;
		}

		return [r, g, b, a];
	}


	// =======================================================================
	function hexToRGBAString(
		inHex,
		inAlpha)
	{
		var components = hexToRGBA(inHex, inAlpha),
			a = "a";

		if (components[3] == 1) {
				// no alpha value was passed in or it's 100%, so output an
				// rgb() color
			components = components.slice(0, 3);
			a = "";
		}

		for (var i = 0, len = components.length; i < len; i++) {
			components[i] = reducePrecision(value);
		}

		return "rgb" + a + "(" + components.join(",") + ")";
	}


	// =======================================================================
	function supplant(
		inString,
		inObject)
	{
		var tokenPattern = /\{\{([^{}]*)\}\}/g;

		if (typeof inString !== "string") {
			return "";
		} else if (arguments.length == 2) {
				// short-circuit the common case to avoid the loop
			inObject = inObject || {};
			return inString.replace(
				tokenPattern,
				function (inToken, inName)
				{
					var value = inObject[inName],
						valueType = typeof value;

					if (valueType == "function") {
						return value.call(inObject, inName);
					} else if (valueType != "undefined") {
						return value;
					} else {
						return inToken;
					}
				}
			);
		} else {
			var objects = Array.prototype.slice.call(arguments, 1);
			var len = objects.length;

			return inString.replace(
				tokenPattern,
				function (inToken, inName)
				{
					var value, valueType;

					for (var i = 0; i < len; i++) {
						var currentObject = objects[i] || {};
						value = currentObject[inName];
						valueType = typeof value;

						if (valueType == "function") {
							return value.call(currentObject, inName, i, objects);
						} else if (valueType != "undefined") {
							return value;
						}
					}

					return inToken;
				}
			);
		}
	}


	return {
		defineClass: defineClass,
		findOne: findOne,
		findAll: findAll,
		hexToRGBA: hexToRGBA,
		hexToRGBAString: hexToRGBAString,
		supplant: supplant
	};
});
