// ===========================================================================
define([
	"./base",
	"./consts",
//	"./state",
	"fabric",
	"Promise",
	"lodash"
], function(
	base,
	k,
	fabric,
	Promise,
//	state,
	_
) {
	var tag = base.tag,
		tags = base.tags,
		TagBase = base.TagBase,
		create = base.create;


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
			if (i == last) {
				return _.where(node._, { $: type });
			} else {
				return node[type] || _.find(node._, { $: type });
			}
		}, node);
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
		TitleBarHeight: 32,
		DefaultWidth: 320,


		init: function(
			inNode)
		{
			this._super(inNode);

			this.addAttributes(this.node.point, ["_x", "_y"]);
			this.addChildren(this.node.objects);
			this.name = "Scene";
			this.id = this.node._sceneID;

			if (this.children.length) {
				this.name = this.splitCamelCase(this.children[0].name) || "Scene";
			}
console.log("SCENE", this.name);
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
							stroke: k.BorderColor
						}),
						new fabric.Text(this.name, {
							originX: "center",
							left: labelWidth / 2,
							top: -this.TitleBarHeight + 7,
							width: labelWidth,
							height: this.TitleBarHeight,
							fontFamily: k.LabelFont,
							fontSize: 13,
							fontWeight: "bold",
							textAlign: "center",
							fill: k.LabelColor
						})
					);

					return this.createGroup(
						childElements,
						{
							left: this.x + k.XOffset,
							top: this.y + k.YOffset
						});
				});
		}
	});


	// =======================================================================
	tag("viewController", RectContainer, {
		RectPath: "view.rect",


		backgroundColor: "rgb(255, 255, 255)",


		init: function(
			inNode)
		{
			this._super(inNode);

			this.name = this.splitCamelCase(this.node._customClass);
			this.addChildren(findOne(this.node, "view.subviews"));

				// find the backgroundColor element
			var backgroundColor = _.find(findAll(this.node, "view.color"),
					{ _key: "backgroundColor" });

				// RGB colors won't have the white attribute at all
			if (backgroundColor && backgroundColor._white != "1") {
				if ("_white" in backgroundColor) {
						// use the white value in all channels
					this.backgroundColor = k.WhiteRGBTemplate(backgroundColor);
				} else {
					this.backgroundColor = k.RGBTemplate(backgroundColor);
				}
			}
		},


		render: function()
		{
			return Promise.all(_.invoke(this.children, "render"))
				.bind(this)
				.then(function(childElements) {
					childElements.unshift(this.createRect({ fill: this.backgroundColor }));

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

			this.addChildren(this.node.subviews);
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

			this.addAttributes(this.node.rect);
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

				// return a promise that gets resolved when the image loads
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
