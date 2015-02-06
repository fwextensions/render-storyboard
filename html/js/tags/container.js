// ===========================================================================
define([
	"./base",
//	"./state",
	"fabric",
	"lodash"
], function(
	base,
	fabric,
//	state,
	_
) {
	var XOffset = 2000,
		YOffset = 0;

	var tag = base.tag,
		tags = base.tags,
		TagBase = base.TagBase,
		create = base.create;


	// =======================================================================
	function findOne(
		node,
		type)
	{
		if (node[type]) {
			return node[type];
		} else {
			var path = type.split(".");

			return _.reduce(path, function(node, type) {
				return node[type] || _.find(node._, {$: type});
			}, node);
		}
	}


	// =======================================================================
	function findAll(
		node,
		type)
	{
		return _.where(node._, { $: type });
	}


	// =======================================================================
	var Container = tag(TagBase, {
		children: null,


		init: function(
			inNode)
		{
			this._super(inNode);
			this.children = [];
		},


		addChildren: function(
			inChildContainer)
		{
			_.each(inChildContainer._, function(node) {
				var child = create(node.$, node);

				if (child) {
					this.addChild(child);
				}
			}, this);
		},


		addChild: function(
			inChild)
		{
			this.children.push(inChild);
		}
	});


	// =======================================================================
	tag("scene", Container, {
		init: function(
			inNode)
		{
			this._super(inNode);

//			var point = findOne(this.node, "point");

			this.addAttributes(findOne(this.node, "point"), ["_x", "_y"]);
//			this.x = parseFloat(point._x);
//			this.y = parseFloat(point._y);
//			this.x = parseFloat(this.node.point["@x"]);
//			this.y = parseFloat(this.node.point["@y"]);

			this.addChildren(findOne(this.node, "objects"));
		},


		render: function() {
			var childElements = _.invoke(this.children, "render");

			return new fabric.Group(
				childElements,
				{
					left: this.x + XOffset,
					top: this.y + YOffset
				});
		}
	});


	// =======================================================================
	tag("viewController", Container, {
		init: function(
			inNode)
		{
			this._super(inNode);

			var view = findOne(this.node, "view"),
				rect = findOne(view, "rect");
//			var rect = findOne(this.node, "view.rect");

			this.addAttributes(rect);

			this.addChildren(findOne(view, "subviews"));
		},


		render: function() {
			var childElements = _.invoke(this.children, "render");

			childElements.unshift(new fabric.Rect({
				left: this.x,
				top: this.y,
				width: this.width,
				height: this.height,
				fill: null,
				stroke: "black"
			}));

			return new fabric.Group(
				childElements,
				{
					left: this.x,
					top: this.y
				});
		}
	});


	// =======================================================================
	tag("imageView", {
		init: function(
			inNode)
		{
			this._super(inNode);

			this.addAttributes(findOne(this.node, "rect"));
		},


		render: function() {
			return new fabric.Rect({
					left: this.x,
					top: this.y,
					width: this.width,
					height: this.height,
					fill: null,
					stroke: "black"
				});
		}
	});


	return Container;
});
