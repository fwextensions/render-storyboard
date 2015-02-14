define([
	"lodash"
], function(
	_
) {
	var Methods = {
			move: "M",
			line: "L",
			cubic: "C"
		},
		Arc = _.template("${command}${rx} ${ry} ${rotation} ${largeArc} ${sweep} ${x} ${y} ");


	function Path(
		point,
		relative)
	{
		this.svg = "";

		if (point) {
			this.move(point, relative);
		}
	}


	_.each(Methods, function(command, methodName) {
		Path.prototype[methodName] = function() {
			var args = _.compact(arguments);

			if (_.last(args) === true) {
				command = command.toLowerCase();
				args.pop();
			}

			this.svg += command + args.map(function(point) {
				return point.x + "," + point.y;
			}).join(" ") + " ";

			return this;
		};
	});


	_.assign(Path.prototype, {
		toString: function()
		{
			return this.svg;
		},


		arc: function(
			args)
		{
			if ("r" in args) {
				args.rx = args.ry = args.r;
			}

			if ("xy" in args) {
				args.x = args.xy.x;
				args.y = args.xy.y;
			}

			if (!("sweep" in args)) {
				args.sweep = 0;
			}

			if (!("largeArc" in args)) {
				args.largeArc = 0;
			}

			if (!("rotation" in args)) {
				args.rotation = 0;
			}

			args.command = args.relative ? "a" : "A";

			this.svg += Arc(args);

			return this;
		}
	});


	return Path;
});
