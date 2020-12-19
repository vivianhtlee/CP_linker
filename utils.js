export let getXY = (svg_obj, svg) => {
	let p = svg.node().createSVGPoint();
	let ctm = svg_obj.node().getCTM();
	p = p.matrixTransform(ctm);
	return [p.x, p.y];
};