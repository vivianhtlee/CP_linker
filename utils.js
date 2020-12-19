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