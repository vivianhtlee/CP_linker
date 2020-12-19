// TODO: allow remove character
// TODO: show name around character, rotate
// TODO: select 2 character by mousedown -> drag -> mouseup

function generateTransform(index, length, canvas_radius, node_radius, svg_el) {
	let degree = index / length * 360;

	let svg_transform = svg_el.createSVGTransform();
	svg_transform.setTranslate(canvas_radius, node_radius);
	let M_translate = svg_transform.matrix;

	let svg_transform2 = svg_el.createSVGTransform();
	svg_transform2.setRotate(degree, 0, canvas_radius - 2 * node_radius);
	let M_rotate = svg_transform2.matrix;

	let p = svg_el.createSVGPoint();
	p = p.matrixTransform(M_translate.multiply(M_rotate));
	return `translate(${p.x}, ${p.y})`;
}

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

function searchIndex(data, idx) {
	return data.filter(d => d.idx == idx)[0];
}

export class CharacterLinker {
	chars = [];
	node1 = -1;
	node2 = -1;
	nodes = null;
	constructor(svg_el, selectNode_cb) {
		this.svg_el = svg_el;
		this.selectNode_cb = selectNode_cb;

		// set svg size
		let size = Math.min(window.innerWidth, window.innerHeight * 0.75);
		svg_el.style.width = `${size}px`;
		svg_el.style.height = `${size}px`;

		this.svg = d3.select(svg_el);
		this.links_list = new relationLinkList(this.svg, this.getNodeNum.bind(this), this.getRadius.bind(this));
		this.chars_layer = this.svg.append('g');
	}
	load(data_json) {
		d3.json(data_json).then((data) => {
			this.chars = data['characters'];
			for (let idx in this.chars) {
				try{
					this.chars[idx].idx = parseInt(idx);
				}catch(err) {
					this.chars[idx].idx = idx;
				}
			}
			this.plot_characters();
		});
	}
	getNodeNum() {
		return this.chars.length;
	}
	getRadius() {
		let svg_radius = this.getOverallRadius();
		if (this.chars.length > 0) {
			// circumference / number of chars / 2, left 2/5 space for link
			return Math.min(svg_radius * Math.PI / this.chars.length * 3 / 5, svg_radius * 0.1);
		}else{
			return svg_radius * 0.1;
		}
	}
	getOverallRadius() {
		return this.svg_el.clientWidth / 2;
	}
	plot_characters() {
		// plot all character in circle after data is loaded
		let chars = this.chars;
		let nodeRadius = this.getRadius();

		let new_nodes = this.chars_layer.selectAll('.node').data(chars).enter()
			.append('g')
			.attr('class', 'node')
			.attr('name', d => d.name); // it only return new nodes

		new_nodes.append('circle')
			.attr('r', nodeRadius)
			.attr('class', 'node_cir')
			.attr('stroke', '#000000')
			.attr('stroke-width', Math.max(2, nodeRadius / 10));

		new_nodes.append('image')
			.attr('class', 'node_img')
			.attr('xlink:href', d => d.img)
			.attr('clip-path', 'circle(50%)')
			.attr('width', nodeRadius * 2)
			.attr('height', nodeRadius * 2)
			.attr('x', nodeRadius * -1)
			.attr('y', nodeRadius * -1);

		this.nodes = this.chars_layer.selectAll('.node'); // all nodes
		this.nodes
			.attr('transform', (d, index) => generateTransform(index, chars.length, this.getOverallRadius(), this.getRadius(), this.svg_el)); // update all node

		const unselectNode = (id) => {
			if (id < 0)
				return;
			this.nodes
				.filter(cur_d => cur_d.idx == id)
				.selectAll('.node_cir')
				.attr('stroke', '#000000')
				.attr('stroke-width', Math.max(2, nodeRadius / 10));
		};

		const selectNode = (evt, d) => {
			unselectNode(this.node1);
			this.node1 = this.node2;
			this.node2 = d.idx;
			if (this.node1 == this.node2 || this.node1 < 0) {
				this.selectNode_cb(null, searchIndex(chars, this.node2));
			} else {
				this.selectNode_cb(searchIndex(chars, this.node1), searchIndex(chars, this.node2));
			}
			this.nodes
				.filter(cur_d => cur_d.idx == d.idx)
				.selectAll('.node_cir')
				.attr('stroke', '#F00')
				.attr('stroke-opacity', 0.5)
				.attr('stroke-width', Math.max(4, nodeRadius / 3));
		};
		this.nodes.on('click', selectNode);

		this.links_list.drawCurve();
		// TODO: on mousedown -> mouseup
	}
	addNode(new_name, new_img) {
		let new_idx = this.chars[this.chars.length - 1].idx + 1;
		this.chars.push({
			'name': new_name,
			'img': new_img,
			'idx': new_idx
		});
		this.plot_characters();
		this.links_list.addNode(new_idx); // update linker data
	}
	removeNode() {
		if(this.node1 != -1 && this.node1 != this.node2)
			return;
		let target_idx = this.node2;
		this.chars = this.chars.filter(c => c.idx != target_idx);
		this.nodes.filter(d => d.idx == target_idx).remove(); // exit() only take last data :(
		this.plot_characters();
		this.links_list.removeNode(target_idx); // update linker data
		this.node1 = this.node2 = -1;
		this.selectNode_cb(null, null);
	}
	addLink(color) {
		this.links_list.add(this.node1, this.node2, color, this.nodes);
	}
	removeLink(color) {
		this.links_list.remove(this.node1, this.node2, color, this.nodes);
	}
	sortLink(colors_order) {
		this.links_list.sort(colors_order);
	}
	__test(test_src, color) {
		this.node1 = test_src;
		for (let i = 0; i < this.chars.length; i++) {
			this.node2 = i;
			this.addLink(color);
		}
	}
}

class relationLinkList {
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
		this.data = this.data.filter(link => (link.idx1 != idx && link.idx2 != idx));
		this.nodesIndex = this.nodesIndex.filter(cur_id => cur_id != idx);
		this.drawCurve();
	}
}