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
		},


		getGroupAttributes: function()
		{
			return {
				visible: this.node._hidden !== "YES"
			};
		},


		renderFrame: function(
			childElements)
		{
			return this.createRect();
		},


		render: function()
		{
			return Promise.all(_.invoke(this.children, "render"))
				.bind(this)
				.then(function(childElements) {
						// renderFrame() may return an array of elements, so
						// flatten that with childElements on the end, so they're
						// above the frame.  pass childElements into renderFrame()
						// so that it can be based on the sizes of the children.
					childElements = _.flatten([this.renderFrame(childElements), childElements]);

						// give subclasses a chance to change the attributes
					return this.createGroup(childElements, this.getGroupAttributes());
				});
		}
	});


	// =======================================================================
	var ParentContainer = tag(Container, {
		x: 0,
		y: 0,
		width: k.DefaultWidth,
		height: k.DefaultHeight,


		init: function(
			inNode)
		{
			this._super(inNode);

				// show the pretty-printed version of the element's type in the
				// central part of the view.  the scene header will show the
				// element's title, if any.
			this.typeLabel = this.splitCamelCase(_.capitalize(this.type)) || "Unknown Controller";
		},


		renderFrame: function(
			childElements)
		{
			return [
				this.createRect({
					fill: k.ViewBackgroundColor
				}),
				new fabric.Text(this.typeLabel, {
					originX: "center",
					originY: "center",
					left: this.width / 2,
					top: this.height / 2,
					width: this.Width,
					fontFamily: k.LabelFont,
					fontSize: 24,
					fontWeight: "bold",
					textAlign: "center",
					fill: k.ViewBackgroundLabelColor
				})
			];

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
		},


		renderFrame: function(
			childElements)
		{
			return this.createRect();
		}
	});


	// =======================================================================
	tag("scene", Container, {
		TitleBarHeight: 32,


		init: function(
			inNode)
		{
			this._super(inNode);

			this.addAttributes(this.node.point, ["_x", "_y"]);
			this.addChildren(this.node.objects);
			this.name = "Scene";
			this.id = this.node._sceneID;

				// TODO: handle offscreen scenes better
			this.x += k.XOffset;
			this.y += k.YOffset;

			if (this.children.length) {
				this.name = this.splitCamelCase(this.children[0].name) || "Scene";
			}
console.log("SCENE", this.name);
		},


		renderFrame: function(
			childElements)
		{
			var firstChild = this.children[0],
				labelWidth = firstChild && firstChild.width || k.DefaultWidth,
				sceneHeight = firstChild && firstChild.height || k.DefaultHeight;

				// draw a border around the scene contents
			childElements.push(this.createRect({
				left: 0,
				top: 0,
				width: labelWidth,
				height: sceneHeight
			}));

			return [
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
					originY: "center",
					left: labelWidth / 2,
					top: -this.TitleBarHeight / 2,
					width: labelWidth,
					height: this.TitleBarHeight,
					fontFamily: k.LabelFont,
					fontSize: 13,
					fontWeight: "bold",
					textAlign: "center",
					fill: k.LabelColor
				})
			];
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


		renderFrame: function()
		{
			return this.createRect({
				fill: this.backgroundColor,
				stroke: null
			});
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


		getGroupAttributes: function()
		{
			var attributes = this._super();

			attributes.left = this.x;
			attributes.top = this.y;

			return attributes;
		},


		render: function()
		{
				// we have to override render() so that we can flatten the images
				// into an image that's clipped to the size of the scrollView
			return Promise.all(_.invoke(this.children, "render"))
				.bind(this)
				.then(function(childElements) {
					var group = this.createGroup(childElements),
						attributes = this.getGroupAttributes(),
						self = this;

					return new Promise(function(resolve, reject) {
						group.cloneAsImage(function(image) {
							attributes.clipTo = function(context) {
// TODO: this won't work if the child views aren't right at the top of the scrollView

									// the context is centered on the image, so
									// we want to position the clipping rect at
									// the top left of the image, and make it the
									// same size as the scrollView
								context.rect(
									-self.width / 2,
									-image.height / 2,
									self.width,
									self.height
								);
							};

								// position the image where the scrollView is and
								// return it as the element that renders the group
							image.set(attributes);
							resolve(image);
						});
					});
				});
		}
	});


	// =======================================================================
	tag("navigationController", ParentContainer);


	// =======================================================================
	tag("tabBarController", ParentContainer);


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
			var attributes = {
					left: this.x,
					top: this.y,
					width: this.width,
					height: this.height,
					visible: this.node._hidden !== "YES"
				},
				url = this.URLTemplate(this);

				// return a promise that gets resolved when the image loads
			return new Promise(function(resolve, reject) {
				fabric.Image.fromURL(url, function(image) {
					image.set(attributes);
					resolve(image);
				});
			});
		}
	});


	return Container;
});
