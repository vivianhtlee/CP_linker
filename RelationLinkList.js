let getXY = (svg_obj, svg) => {
	let p = svg.node().createSVGPoint();
	let ctm = svg_obj.node().getCTM();
	p = p.matrixTransform(ctm);
	return [p.x, p.y];
};

function is_neighbor(n1, n2, length) {
	let diff = Math.abs(n2 - n1);
	return diff == 1 || diff == (length - 1);
}

export class relationLinkList {
	data = [];
	nodesIndex = [];
	constructor(svg, node_len_getter, node_radius_getter) {
		this.svg = svg;
		this.node_len_getter = node_len_getter;
		this.node_radius_getter = node_radius_getter;

		this.svg_radius = this.svg.node().clientWidth / 2;
		this.curve_layer = svg.append('g');
	}
	add(idx1, idx2, color, nodes) {
		this.nodesIndex = nodes.data().map(d => d.idx);
		if (idx1 > idx2)
			[idx1, idx2] = [idx2, idx1];
		this.remove(idx1, idx2);
		let node1 = nodes.filter(d => d.idx == idx1);
		let node2 = nodes.filter(d => d.idx == idx2);
		this.data.push({source: node1, target: node2, color});
		this.drawCurve();
	}
	remove(idx1, idx2) {
		if (idx1 > idx2) {
			[idx1, idx2] = [idx2, idx1];
		}
		this.data = this.data.filter(d => d.source.idx !== idx1 || d.target.idx2 !== idx2);
		this.drawCurve();
	}
	drawCurve() {
		let node_len = this.node_len_getter();
		let nodeRadius = this.node_radius_getter();
		const transformFunc = d => {
			// with remove node feature implemented, idx do not represent the real index anymore
			let idx1 = this.nodesIndex.indexOf(d.source.data()[0].idx);
			let idx2 = this.nodesIndex.indexOf(d.target.data()[0].idx);
			let [x1, y1] = getXY(d.source, this.svg);
			let [x2, y2] = getXY(d.target, this.svg);
			if (is_neighbor(idx1, idx2, node_len)) {
				// straight line
				return `M ${x1} ${y1} T ${x2} ${y2}`;
			}else{
				// curve
				let [x_mid, y_mid] = [this.svg_radius, this.svg_radius];
				// smoothen to avoid overlap
				let idx_ratio = Math.abs(idx2 - idx1) / node_len;
				if (idx_ratio > 0.5) idx_ratio = 1 - idx_ratio;
				if (idx_ratio < 1 / 4) {
					let [x_straight_mid, y_straight_mid] = [(x1 + x2) / 2, (y1 + y2) / 2];
					let center_weigth = idx_ratio * 4;
					x_mid = x_mid * center_weigth + x_straight_mid * (1 - center_weigth);
					y_mid = y_mid * center_weigth + y_straight_mid * (1 - center_weigth);
				}
				return `M ${x1} ${y1} S ${x_mid} ${y_mid} ${x2} ${y2}`;
			}
		};
		this.curve_layer.selectAll('path')
			.data(this.data)
			.join('path')
			.attr('d', transformFunc.bind(this))
			.attr('fill', 'none')
			.attr('stroke', d => d.color)
			.attr('stroke-width', Math.max(2, nodeRadius / 10));
	}
	sort(colors_order) {
		// sort data in reverse order of data (because the later node will draw on top)
		this.data.sort((d1, d2) => {
			// compare function
			let idx1 = colors_order.indexOf(d1.color);
			let idx2 = colors_order.indexOf(d2.color);
			if (idx1 < idx2) {
				return 1;
			}else if(idx1 == idx2) {
				return 0;
			}else{
				return -1;
			}
		});
		this.drawCurve();
	}
	addNode(idx) {
		this.nodesIndex.push(idx);
		this.drawCurve();
	}
	removeNode(idx) {
		this.data = this.data.filter(link => (link.source.data()[0].idx != idx && link.target.data()[0].idx != idx));
		this.nodesIndex = this.nodesIndex.filter(cur_id => cur_id != idx);
		this.drawCurve();
	}
}