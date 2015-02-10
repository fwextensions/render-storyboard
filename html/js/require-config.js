var require = {
// TODO: remove cache bust param
//	urlArgs: "bust=" +  (new Date()).getTime(),
	paths: {
		jquery: "lib/jquery-2.1.1",
		lodash: "lib/lodash",
		raphael: "lib/scale.raphael",
		fabric: "lib/fabric",
		Promise: "lib/bluebird",
//		raphael: "lib/raphael",
		"socket.io": "lib/socket.io",
		xml2json: "lib/xml2json",
		moment: "lib/moment",
		react: "lib/react-with-addons",
		jsx: "lib/jsx",
		text: "lib/text",
		JSXTransformer: "lib/JSXTransformer"
	},
	shim: {
		fabric: {
			exports: "fabric"
		}
	}
};
