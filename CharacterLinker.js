function generateTransform(index, length, canvas_radius, node_radius) {
	let degree = index / length * 360;
	return `translate(${canvas_radius}, ${node_radius}) rotate(${degree}, ${0}, ${canvas_radius - 2 * node_radius})`;
}

function reverseRotation(index, length) {
	let degree = index / length * 360;
	return `rotate(${-degree})`;
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

export class CharacterLinker {
	chars = [];
	node1 = -1;
	node2 = -1;
	nodes = null;
	constructor(svg_el, add_link_div, selected_display) {
		this.svg_el = svg_el;
		this.add_link_div = add_link_div;
		this.selected_display = selected_display;

		// set svg size
		let size = Math.min(window.innerWidth, window.innerHeight * 0.75);
		svg_el.style.width = `${size}px`;
		svg_el.style.height = `${size}px`;

		this.svg = d3.select(svg_el);
		add_link_div.style.display = 'none';
		this.links_list = new relationLinkList(this.svg, this.getNodeNum.bind(this), this.getRadius.bind(this));
		this.chars_layer = this.svg.append('g');
	}
	load(data_json) {
		d3.json(data_json).then((data) => {
			this.chars = data['characters'];
			for (let idx in this.chars) {
				this.chars[idx].idx = idx;
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
		this.nodes = this.chars_layer.selectAll('.node').data(chars).enter()
			.append('g')
			.attr('class', 'node')
			.attr('name', d => d.name);
		this.chars_layer.selectAll('.node')
			.attr('transform', d => generateTransform(d.idx, chars.length, this.getOverallRadius(), this.getRadius()));

		let nodeRadius = this.getRadius();
		this.cir = this.nodes.append('circle')
			.attr('r', nodeRadius)
			.attr('stroke', '#000000')
			.attr('stroke-width', Math.max(2, nodeRadius / 10));

		this.images = this.nodes.append('image')
			.attr('xlink:href', d => d.img)
			.attr('clip-path', 'circle(50%)')
			.attr('transform', d => reverseRotation(d.idx, chars.length))
			.attr('width', nodeRadius * 2)
			.attr('height', nodeRadius * 2)
			.attr('x', nodeRadius * -1)
			.attr('y', nodeRadius * -1);

		const unselectNode = (idx) => {
			if (idx < 0)
				return;
			this.cir
				.filter((_, i) => i == idx)
				.attr('stroke', '#000000')
				.attr('stroke-width', Math.max(2, nodeRadius / 10));
		};

		const selectNode = (evt, d) => {
			unselectNode(this.node1);
			this.node1 = this.node2;
			this.node2 = d.idx;
			if (this.node1 == this.node2 || this.node1 < 0) {
				this.selected_display.innerHTML = 'Select two characters';
				this.add_link_div.style.display = 'none';
			} else {
				this.selected_display.innerHTML = `${chars[this.node1].name}, ${chars[this.node2].name}`;
				this.add_link_div.style.display = 'inline';
			}
			this.cir
				.filter((_, i) => i == d.idx)
				.attr('stroke', '#F00')
				.attr('stroke-opacity', 0.5)
				.attr('stroke-width', Math.max(4, nodeRadius / 3));
		};
		this.nodes.on('click', selectNode);

		this.links_list.drawCurve();
		// TODO: on mousedown -> mouseup
	}
	addNode(new_name, new_img) {
		this.chars.push({
			'name': new_name,
			'img': new_img,
			'idx': this.chars.length
		});
		this.plot_characters();
	}
	removeNode() {

		this.nodes.exit().remove();
		// TODO: update idx
		// TODO: update linker data
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
	constructor(svg, node_len_getter, node_radius_getter) {
		this.svg = svg;
		this.node_len_getter = node_len_getter;
		this.node_radius_getter = node_radius_getter;

		this.svg_radius = this.svg.node().clientWidth / 2;
		this.curve_layer = svg.append('g');
		this.data = [];
	}
	add(idx1, idx2, color, nodes) {
		if (idx1 > idx2) {
			[idx1, idx2] = [idx2, idx1];
		}
		this.remove(idx1, idx2);
		let node1 = nodes.filter((_, i) => i == idx1);
		let node2 = nodes.filter((_, i) => i == idx2);
		this.data.push({source: node1, target: node2, color, idx1, idx2});
		this.drawCurve();
	}
	remove(idx1, idx2) {
		if (idx1 > idx2) {
			[idx1, idx2] = [idx2, idx1];
		}
		this.data = this.data.filter(d => d.idx1 !== idx1 || d.idx2 !== idx2);
		this.drawCurve();
	}
	drawCurve() {
		let node_len = this.node_len_getter();
		let nodeRadius = this.node_radius_getter();
		const transformFunc = d => {
			let [x1, y1] = getXY(d.source, this.svg);
			let [x2, y2] = getXY(d.target, this.svg);
			if (is_neighbor(d.idx1, d.idx2, node_len)) {
				// straight line
				return `M ${x1} ${y1} T ${x2} ${y2}`;
			}else{
				// curve
				let [x_mid, y_mid] = [this.svg_radius, this.svg_radius];
				// smoothen to avoid overlap
				let idx_ratio = Math.abs(d.idx2 - d.idx1) / node_len;
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
}