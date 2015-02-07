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
		YOffset = 0,
		LabelFont = "Helvetica",
		LabelColor = "#5f5f5f",
		BorderColor = "#b5b5b5",
		ViewBackgroundColor = "#f0f0f0",
		ViewBackgroundLabelColor = "#cbcbcf",
		ArrowColor = "#b0b0b0";

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
		},


		splitCamelCase: function(
			string)
		{
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
					stroke: BorderColor
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
		TitleBarHeight: 32,
		DefaultWidth: 320,


		init: function(
			inNode)
		{
			this._super(inNode);

			this.addAttributes(findOne(this.node, "point"), ["_x", "_y"]);
			this.addChildren(findOne(this.node, "objects"));
			this.name = "Scene";

			if (this.children.length) {
				this.name = this.splitCamelCase(this.children[0].name) || "Scene";
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
							stroke: BorderColor
						}),
						new fabric.Text(this.name, {
							originX: "center",
							left: labelWidth / 2,
							top: -this.TitleBarHeight + 7,
							width: labelWidth,
							height: this.TitleBarHeight,
							fontFamily: LabelFont,
							fontSize: 13,
							fontWeight: "bold",
							textAlign: "center",
							fill: LabelColor
						})
					);

					return this.createGroup(
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

			this.name = this.splitCamelCase(this.node._customClass);
			this.addChildren(findOne(this.node, "view.subviews"));
		},


		render: function()
		{
			return Promise.all(_.invoke(this.children, "render"))
				.bind(this)
				.then(function(childElements) {
					childElements.unshift(this.createRect());

					return this.createGroup(childElements);
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

			this.name = this.splitCamelCase(this.node._title) || "Navigation Controller";
		},


		render: function()
		{
			return this.createRect();
		}
	});


	// =======================================================================
	tag("scrollView", RectContainer, {
		init: function(
			inNode)
		{
			this._super(inNode);

			this.addChildren(findOne(this.node, "subviews"));
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
					childElements.unshift(this.createRect());

					return this.createGroup(childElements);
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
