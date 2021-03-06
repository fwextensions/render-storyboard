// ===========================================================================
define([
	"./base",
	"./consts",
	"./utils",
	"../path",
//	"./state",
	"fabric",
	"Promise",
	"lodash"
], function(
	base,
	k,
	utils,
	Path,
	fabric,
	Promise,
//	state,
	_
) {
//	var URLTemplate = _.template("Images.xcassets/${imageName}.imageset/${imageName}.png");
	var URLTemplate = _.template("Images.xcassets/${imageName}.imageset/${imageName}@2x.png");


	var tag = base.tag,
		tags = base.tags,
		TagBase = base.TagBase,
		create = base.create,
		findOne = utils.findOne,
		findAll = utils.findAll;


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
						// filter the array in case a child or renderFrame()
						// returned null.
					childElements = _.filter(_.flatten([this.renderFrame(childElements), childElements]));

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
		TitleBarCurveRadius: 4,


		storyboard: null,
		segues: null,
		isInitialScene: false,


		init: function(
			inNode,
			inStoryboard)
		{
			this._super(inNode);

			this.storyboard = inStoryboard;
			this.addAttributes(this.node.point, ["_x", "_y"]);
			this.addChildren(this.node.objects);
			this.name = "Scene";
			this.id = this.node._sceneID;

				// the segues array will get filled in by the Storyboard
			this.segues = [];

			var firstChild = this.children[0];

			if (firstChild) {
				this.name = this.splitCamelCase(firstChild.name) || "Scene";
				this.isInitialScene = firstChild.id == this.storyboard.initialViewControllerID;
				this.width = Math.max(firstChild.width, k.DefaultWidth);
				this.height = Math.max(firstChild.height, k.DefaultHeight);
			}
console.log("SCENE", this.name, this.isInitialScene);
		},


		getGroupAttributes: function()
		{
			var attributes = this._super(),
				offset = this.storyboard.getOriginOffset();

				// adjust the scene position so it's visible on the canvas
			attributes.left = this.x + offset.x;
			attributes.top = this.y + offset.y;

			return attributes;
		},


		renderFrame: function(
			childElements)
		{
			var firstChild = this.children[0],
				sceneWidth = firstChild && firstChild.width || k.DefaultWidth,
				sceneHeight = firstChild && firstChild.height || k.DefaultHeight,
				path;

				// draw a border around the scene contents and put it after the
				// child elements, so it's on top of them
			childElements.push(this.createRect({
				left: 0,
				top: 0,
				width: sceneWidth,
				height: sceneHeight
			}));

				// draw the header as a three-sided path, with rounded top corners
			path = new Path({ x: sceneWidth, y: 0 })
				.line({ x: sceneWidth, y: -this.TitleBarHeight + this.TitleBarCurveRadius })
				.cubic(
					{ x: sceneWidth, y: -this.TitleBarHeight + this.TitleBarCurveRadius / 2 },
					{ x: sceneWidth - this.TitleBarCurveRadius / 2, y: -this.TitleBarHeight },
					{ x: sceneWidth - this.TitleBarCurveRadius, y: -this.TitleBarHeight }
				)
				.line({ x: this.TitleBarCurveRadius, y: -this.TitleBarHeight })
				.cubic(
					{ x: this.TitleBarCurveRadius / 2, y: -this.TitleBarHeight },
					{ x: 0, y: -this.TitleBarHeight + this.TitleBarCurveRadius / 2},
					{ x: 0, y: -this.TitleBarHeight + this.TitleBarCurveRadius }
				)
				.line({ x: 0, y: 0 });

			return [
				new fabric.Path(path.svg, {
					fill: "white",
					stroke: k.BorderColor
				}),
				new fabric.Text(this.name, {
					originX: "center",
					originY: "center",
					left: sceneWidth / 2,
					top: -this.TitleBarHeight / 2,
					width: sceneWidth,
					height: this.TitleBarHeight,
					fontFamily: k.LabelFont,
					fontSize: 13,
					fontWeight: "bold",
					textAlign: "center",
					fill: k.LabelColor
				})
			];
		},


// TODO: clip scene children some other way
		zrender: function()
		{
				// we have to override render() so that we can flatten the images
				// into an image that's clipped to the size of the scrollView
			return Promise.all(_.filter(_.invoke(this.children, "render")))
				.bind(this)
				.then(function(childElements) {
						// create the frame first, which has the side effect of
						// adding a border to the childElements array
					var frame = this.renderFrame(childElements),
						group = this.createGroup(childElements),
						dataURL = group.toDataURL({
							format: "png",
							left: 0,
							top: 0,
							width: this.width,
							height: this.height
						}),
						self = this;

					return new Promise(function(resolve, reject) {
						fabric.Image.fromURL(dataURL, function(image) {
							resolve(self.createGroup(frame.concat(image)));
						});
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
				// into an image that's clipped to the size of the scrollView.
				// call filter on the rendered child elements to clear out elements
				// that didn't render anything.
			return Promise.all(_.filter(_.invoke(this.children, "render")))
				.bind(this)
				.then(function(childElements) {
						// add an invisible rect the size of the scrollView behind
						// the child elements so that they maintain their relative
						// locations when they're flattened into an image
					childElements.unshift(this.createRect({
						stroke: null,
						fill: "white",
						opacity: 0
					}));

						// don't use this.createGroup() because we want the group
						// to be at the natural location of the child elements,
						// not the scrollView's location
					var group = new fabric.Group(childElements),
						attributes = this.getGroupAttributes(),
						self = this;

					return new Promise(function(resolve, reject) {
							// instead of cloning the group as an image and clipping
							// it, it's simpler to convert it to a cropped dataURL,
							// since the cloned image will retain the original
							// uncropped height, which throws off the scene height
						var dataURL = group.toDataURL({
								format: "png",
								left: attributes.left,
								top: attributes.top,
								width: self.width,
								height: self.height
							});

						fabric.Image.fromURL(dataURL, function(image) {
								// position the image where the scrollView is and
								// hide it if the scrollView is, then return it
								// as the element that renders the group
							image.set(attributes);
							resolve(image);
						});
					});
				});
		}
	});


	// =======================================================================
	tag("view", RectContainer, {
		init: function(
			inNode)
		{
			this._super(inNode);

			this.addChildren(this.node.subviews);
		},


		renderFrame: function()
		{
				// don't render a border around the view
			return null;
		}
	});


	// =======================================================================
	tag("button", RectContainer, {
		init: function(
			inNode)
		{
			this._super(inNode);

				// look for the normal key to find the state to render
			this.state = _.where(findAll(this.node, "state"), { _key: "normal" })[0];
			this.addAttributes(this.node);
		},


		fitToFrame: function(
			image)
		{
			var imageAspect = image.width / image.height,
				buttonAspect = this.width / this.height;

			if (buttonAspect < imageAspect) {
				image.scaleToWidth(this.width);
			} else {
				image.scaleToHeight(this.height);
			}
		},


		render: function()
		{
			var attributes = {
						// center the image or title inside the button shape
					left: this.x + this.width / 2,
					top: this.y + this.height / 2,
					originX: "center",
					originY: "center",
					visible: this.node._hidden !== "YES"
				},
				imageName = this.state._image || this.state._backgroundImage,
				title = this.state._title,
				self = this,
				url;

			if (imageName) {
				url = URLTemplate({ imageName: imageName });

					// return a promise that gets resolved when the image loads
				return new Promise(function(resolve, reject) {
					fabric.Image.fromURL(url, function(image) {
						self.fitToFrame(image);
						image.set(attributes);
						resolve(image);
					});
				});
			} else if (title) {
				_.assign(attributes, {
					fontFamily: k.ButtonFont,
					fontSize: 15,
					textAlign: "center",
					fill: k.ButtonColor
				});

				return new fabric.Text(title, attributes);
			}
		}
	});


	// =======================================================================
	tag("textField", RectContainer, {
		render: function()
		{
				// a borderless field won't have a borderStyle attribute
			if (this.node._borderStyle) {
				return this.createRect({
					rx: k.TextFieldCornerRadius,
					ry: k.TextFieldCornerRadius
				});
			}
		}
	});


	// =======================================================================
	tag("navigationController", ParentContainer, {
		init: function(
			inNode)
		{
			this._super(inNode);

			var rect = findOne(this.node, "navigationBar.rect");

			this.navigationBar = {};
			this.addAttributes(rect, null, this.navigationBar);
		},


		render: function()
		{
			var childElements = this.renderFrame().concat(
					this.createRect({
						left: 0,
						top: 0,
						width: this.navigationBar.width,
						height: this.navigationBar.height,
						fill: k.NavigationBarColor
					})
				);

			return this.createGroup(childElements, this.getGroupAttributes());
		}
	});


	// =======================================================================
	tag("tabBarController", ParentContainer, {
		init: function(
			inNode)
		{
			this._super(inNode);

			var rect = findOne(this.node, "tabBar.rect");

			this.tabBar = {};
			this.addAttributes(rect, null, this.tabBar);
		},


		render: function()
		{
			var childElements = this.renderFrame().concat(
					this.createRect({
						left: 0,
						top: this.height - this.tabBar.height,
						width: this.tabBar.width,
						height: this.tabBar.height,
						fill: k.NavigationBarColor
					})
				);

			return this.createGroup(childElements, this.getGroupAttributes());
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
