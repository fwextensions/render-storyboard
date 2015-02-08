/*	This work is licensed under Creative Commons GNU LGPL License.

	License: http://creativecommons.org/licenses/LGPL/2.1/
   Version: 0.10
	Author:  Stefan Goessner/2006, Henrik Ingo/2013
	Web:     https://github.com/henrikingo/xml2json
*/
define(function() {
function xml2json_translator() {
   var X = {
      err: function(msg) {
         alert("Error: " + msg);
      },
      /**
       * Return a js object from given xml.
       * We represent element attributes as siblings, not children, of their
       * element, hence they need to be added to parent element.
       */
      toObj: function(xml, parent) {
         if (xml.nodeType==9) // document.node
            return X.toObj(xml.documentElement, parent);

         var o = {};

         if(   !parent                    // no parent = root element = first step in recursion
            || parent instanceof Array ){ // if parent is an Array, we cannot add attributes to it, so handle it with similar extra step as a root element
            if (xml.nodeType==1) { // element node
               o[xml.nodeName] = X.toObj(xml, o);
            }
            else
               X.err("unhandled node type: " + xml.nodeType);
            return o;
         }

         // second and following recursions
         if (xml.nodeType==1) {   // element node ..
			 o.$ = xml.nodeName;

            if (xml.attributes.length)   // element with attributes  ..
               for (var i=0; i<xml.attributes.length; i++)
				 o["_"+xml.attributes[i].nodeName] = (xml.attributes[i].value||"").toString();

            if (xml.firstChild) { // element has child nodes. Figure out some properties of it's structure, to guide us later.
               var textChild=0, cdataChild=0, hasElementChild=false;

               for (var n=xml.firstChild; n; n=n.nextSibling) {
                  if (n.nodeType==1) {
                     hasElementChild = true;
                  }
                  else if (n.nodeType==3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
                  else if (n.nodeType==4) cdataChild++; // cdata section node
               }

               if (hasElementChild) { // Neatly structured and unique child elements, no plain text/cdata in the mix
						// always store all the children in order in an array,
						// even if it's just one child
                     o._ = [];
                     X.removeWhite(xml);

                     for (var n=xml.firstChild; n; n=n.nextSibling) {
                        if (n.nodeType == 3)  // text node
                           o._[o._.length] = o["#text"] = X.escape(n.nodeValue);
                        else if (n.nodeType == 4)  // cdata node
                           o._[o._.length] = o["#cdata"] = X.escape(n.nodeValue);
                        else {
							var nodeObject = X.toObj(n, o);

							o._[o._.length] = nodeObject; //push

							if (o[n.nodeName]) {  // multiple occurence of element ..
								if (o[n.nodeName] instanceof Array)
									o[n.nodeName][o[n.nodeName].length] = nodeObject;
								else
									o[n.nodeName] = [o[n.nodeName], nodeObject];
							}
							else  // first occurence of element..
								o[n.nodeName] = nodeObject;
						}
                     }
               }
               else if (textChild) { // pure text
                  o = X.escape(X.innerXml(xml));
               }
               else if (cdataChild) { // single cdata
                  X.removeWhite(xml);
                  o["#cdata"] = X.escape(xml.firstChild.nodeValue);
               }
            }

            if (!xml.attributes.length && !xml.firstChild) {
				o = {};
				o[xml.nodeName] = true;
			}
         }
         else
            X.err("unhandled node type: " + xml.nodeType);

         return o;
      },
      toJson: function(o, ind) {
         var json = "";
         if (o instanceof Array) {
            for (var i=0,n=o.length; i<n; i++) {
               // strings usually follow the colon, but in arrays we must add the usual indent
               var extra_indent = "";
               if ( typeof(o[i]) == "string" )
                   extra_indent = ind+"\t";
               o[i] = extra_indent + X.toJson(o[i], ind+"\t");
            }
            json += "[" + (o.length > 1 ? ("\n"+o.join(",\n")+"\n"+ind) : o.join("")) + "]";
         }
         else if (o == null)
            json += "null";
         else if (typeof(o) == "string")
            json += "\"" + o.toString() + "\"";
         else if (typeof(o) == "object") {
            json += ind+"{";
            // Count the members in o
            var i = 0;
            for (var member in o)
                i++;
            // ...so that we know when we are at the last element when doing this
            for (var member in o) {
                json += "\n"+ ind + "\t\"" + member + "\":" + X.toJson(o[member], ind+"\t");
                json += (i > 1 ? "," : "\n"+ind );
                i--;
            }
            json += "}";
         }
         else
            json += o.toString();
         return json;
      },
      innerXml: function(node) {
         var s = ""
         if ("innerHTML" in node)
            s = node.innerHTML;
         else {
            var asXml = function(n) {
               var s = "";
               if (n.nodeType == 1) {
                  s += "<" + n.nodeName;
                  for (var i=0; i<n.attributes.length;i++)
                     s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue||"").toString() + "\"";
                  if (n.firstChild) {
                     s += ">";
                     for (var c=n.firstChild; c; c=c.nextSibling)
                        s += asXml(c);
                     s += "</"+n.nodeName+">";
                  }
                  else
                     s += "/>";
               }
               else if (n.nodeType == 3)
                  s += n.nodeValue;
               else if (n.nodeType == 4)
                  s += "<![CDATA[" + n.nodeValue + "]]>";
               return s;
            };
            for (var c=node.firstChild; c; c=c.nextSibling)
               s += asXml(c);
         }
         return s;
      },
      escape: function(txt) {
         return txt.replace(/[\\]/g, "\\\\")
                   .replace(/[\"]/g, '\\"')
                   .replace(/[\n]/g, '\\n')
                   .replace(/[\r]/g, '\\r');
      },
      removeWhite: function(e) {
         e.normalize();
         for (var n = e.firstChild; n; ) {
            if (n.nodeType == 3) {  // text node
               if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
                  var nxt = n.nextSibling;
                  e.removeChild(n);
                  n = nxt;
               }
               else
                  n = n.nextSibling;
            }
            else if (n.nodeType == 1) {  // element node
               X.removeWhite(n);
               n = n.nextSibling;
            }
            else                      // any other node
               n = n.nextSibling;
         }
         return e;
      },
      parseXml: function(xmlString) {
         var dom = null;
            var xml = require("libxml");
            dom = xml.parseFromString(xmlString);
         return dom;
      }
   };

   return X;
}

function xml2json(xml, tab) {
   var X = xml2json_translator();
   if (xml.nodeType == 9) // document node
      xml = xml.documentElement;
   var o = X.toObj(X.removeWhite(xml));

	return o;

   var json = X.toJson(o, "");
   // If tab given, do pretty print, otherwise remove white space
   return (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, ""));
}

// node.js
if ( typeof module != 'undefined' ) {
    module.exports = xml2json_translator();
}

return xml2json;
});
