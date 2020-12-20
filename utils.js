export let getXY = (svg_obj, svg) => {
	let p = svg.node().createSVGPoint();
	let ctm = svg_obj.node().getCTM();
	p = p.matrixTransform(ctm);
	return [p.x, p.y];
};


function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}
export function rgbToHex(rgb) {
	// ref: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
	let regex = /\w*\((\d+),\s*(\d+),\s*(\d+)\)/g;
	let match = regex.exec(rgb);
	let r = parseInt(match[1]);
	let g = parseInt(match[2]);
	let b = parseInt(match[3]);
	return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export const toDataURL = url => fetch(url)
.then(response => response.blob())
.then(blob => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onloadend = () => resolve(reader.result);
	reader.onerror = reject;
	reader.readAsDataURL(blob);
}));

export function svg_to_png(svg_el, cb){
	let can = document.createElement('canvas');
	let ctx = can.getContext('2d');
	let loader = new Image;

	loader.width  = can.width  = svg_el.width.baseVal.value;
	loader.height = can.height = svg_el.height.baseVal.value;
	// white background color
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, can.width, can.height);
	// load image to canvas context
	loader.onload = function(){
		ctx.drawImage( loader, 0, 0, loader.width, loader.height );
		cb(can.toDataURL());
	};
	let svgAsXML = (new XMLSerializer).serializeToString(svg_el);
	loader.src = 'data:image/svg+xml,' + encodeURIComponent(svgAsXML);
}