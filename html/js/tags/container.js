// ===========================================================================
define([
	"./base",
//	"./state",
	"fabric",
	"Promise",
	"lodash"
], function(
	base,
	fabric,
	Promise,
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
	var RectContainer = tag(Container, {
		RectPath: "rect",


		init: function(
			inNode)
		{
			this._super(inNode);

			this.addAttributes(findOne(this.node, this.RectPath));
		}
	});


	// =======================================================================
	tag("scene", Container, {
		TitleBarHeight: 25,
		DefaultWidth: 320,


		init: function(
			inNode)
		{
			this._super(inNode);

			this.addAttributes(findOne(this.node, "point"), ["_x", "_y"]);
			this.addChildren(findOne(this.node, "objects"));

			if (this.children.length) {
				this.name = this.children[0].name || "Scene";
			}
console.log(this.name);

		},


		render: function()
		{
			return Promise.all(_.invoke(this.children, "render"))
				.bind(this)
				.then(function(childElements) {
					var firstChild = this.children[0],
						labelWidth = firstChild && firstChild.width || this.DefaultWidth;

					childElements.unshift(
						new fabric.Rect({
							left: 0,
							top: -this.TitleBarHeight,
							width: labelWidth,
							height: this.TitleBarHeight,
							fill: "white",
							stroke: "black"
						}),
						new fabric.Text(this.name, {
							originX: "center",
							left: labelWidth / 2,
							top: -this.TitleBarHeight + 2,
							width: labelWidth,
							height: this.TitleBarHeight,
							fontFamily: "Helvetica",
							fontSize: 14,
							fontWeight: "bold",
							textAlign: "center",
							fill: "#666"
						})
					);

console.log("scene title", this.TitleBarHeight, labelWidth);
					return new fabric.Group(
						childElements,
						{
							left: this.x + XOffset,
							top: this.y + YOffset
						});
				});
		}
	});


	// =======================================================================
	tag("viewController", RectContainer, {
		RectPath: "view.rect",


		init: function(
			inNode)
		{
			this._super(inNode);

			this.name = this.node._customClass;
			this.addChildren(findOne(this.node, "view.subviews"));
		},


		render: function()
		{
			return Promise.all(_.invoke(this.children, "render"))
				.bind(this)
				.then(function(childElements) {
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
				});
		}
	});


	// =======================================================================
	tag("navigationController", RectContainer, {
		RectPath: "navigationBar.rect",


		init: function(
			inNode)
		{
			this._super(inNode);

			this.name = this.node._title || "NavigationController";
		},


		render: function()
		{
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


	// =======================================================================
	tag("scrollView", RectContainer, {
		init: function(
			inNode)
		{
			this._super(inNode);

			this.addChildren(findOne(this.node, "subviews"));
console.log("scrollView children", this.id, this.children.length);
		},


		clipTo: function(
			context)
		{
//			context.rect()
		},


		render: function()
		{
			return Promise.all(_.invoke(this.children, "render"))
				.bind(this)
				.then(function(childElements) {
					childElements.unshift(new fabric.Rect({
						left: this.x,
						top: this.y,
						width: this.width,
						height: this.height,
						fill: null,
//						fill: null,
						stroke: "black"
					}));
console.log("scrollView", childElements.length);

					return new fabric.Group(
//					return new fabric.ClippedGroup(
						childElements,
						{
							left: this.x,
							top: this.y
//							top: this.y,
//							clipTo: function(context) {
//								context.rect(
//									this.top,
//									this.left,
//									this.width,
//									this.height
//								);
//							}.bind(this)
//							clipTo: this.clipTo
//							clipLeft: this.x,
//							clipTop: this.y,
//							clipWidth: this.width,
//							clipHeight: this.height
//							left: this.x + XOffset,
//							top: this.y + YOffset
						});
				});
		}
	});


	// =======================================================================
	tag("imageView", {
		URLTemplate: _.template("Images.xcassets/${imageName}.imageset/${imageName}@2x.png"),
//		URLTemplate: _.template("Images.xcassets/${imageName}.imageset/${imageName}.png"),


		init: function(
			inNode)
		{
			this._super(inNode);

			this.addAttributes(findOne(this.node, "rect"));
			this.imageName = this.node._image;
		},


		render: function()
		{
			var frame = {
					left: this.x,
					top: this.y,
					width: this.width,
					height: this.height
				},
				url = this.URLTemplate(this);
console.log(url);

			return new Promise(function(resolve, reject) {
				fabric.Image.fromURL(url, function(image) {
					image.set(frame);
					resolve(image);
				});
			});
		}
	});


	return Container;
});
