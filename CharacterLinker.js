import {relationLinkList} from './RelationLinkList.js';
import {getXY, toDataURL} from './utils.js';

function generateTransform(index, length, canvas_radius, node_radius, svg_el) {
	let degree = index / length * 360;

	let svg_transform = svg_el.createSVGTransform();
	svg_transform.setTranslate(canvas_radius, node_radius * 2);
	let M_translate = svg_transform.matrix;

	let svg_transform2 = svg_el.createSVGTransform();
	svg_transform2.setRotate(degree, 0, canvas_radius - 2 * node_radius);
	let M_rotate = svg_transform2.matrix;

	let p = svg_el.createSVGPoint();
	p = p.matrixTransform(M_translate.multiply(M_rotate));
	return `translate(${p.x}, ${p.y})`;
}

function searchIndex(data, idx) {
	return data.filter(d => d.idx == idx)[0];
}

export class CharacterLinker {
	chars = [];
	node1 = -1;
	node2 = -1;
	nodes = null;
	constructor(svg_el, selectNode_cb, color_getter = null) {
		this.svg_el = svg_el;
		this.selectNode_cb = selectNode_cb;
		this.color_getter = color_getter;

		// set svg size
		let size = Math.min(window.innerWidth, window.innerHeight * 0.75);
		svg_el.style.width = `${size}px`;
		svg_el.style.height = `${size}px`;

		this.svg = d3.select(svg_el);
		this.links_list = new relationLinkList(this.svg, this.getNodes.bind(this), this.getRadius.bind(this));
		this.dash_link_layer = this.svg.append('g').attr('name', 'temp_link');
		this.chars_layer = this.svg.append('g').attr('name', 'char_nodes');
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

			// image url -> fetched data url
			Promise.all(this.chars.map(char=>{
				return toDataURL(char.img)
				.then(dataUrl => {
					char.imgUrl = dataUrl;
				})
			})).then(()=>{
				this.plot_characters();
			});
		});
	}
	getNodes() {
		return this.nodes;
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

	unselectNode(id) {
		if (id < 0)
			return;
		this.nodes
			.filter(cur_d => cur_d.idx == id)
			.selectAll('.node_cir')
			.attr('stroke', '#000000')
			.attr('stroke-opacity', 1)
			.attr('stroke-width', Math.max(2, this.getRadius() / 10));
	}

	plot_characters() {
		// plot all character in circle after data is loaded
		let chars = this.chars;
		let nodeRadius = this.getRadius();
		let overallRadius = this.getOverallRadius();

		let new_nodes = this.chars_layer.selectAll('.node').data(chars).enter()
			.append('g')
			.attr('class', 'node')
			.attr('name', d => d.name); // it only return new nodes, assign fixed attributes
		this.nodes = this.chars_layer.selectAll('.node'); // all nodes, update attributes
		this.nodes
			.attr('transform', (d, index) => generateTransform(index, chars.length, overallRadius, nodeRadius, this.svg_el)); // update all node

		new_nodes.append('circle')
			.attr('class', 'node_cir')
			.attr('stroke', '#000000')
			.attr('stroke-opacity', 1);
		this.nodes.selectAll('.node_cir')
			.attr('r', nodeRadius)
			.attr('stroke-width', Math.max(2, nodeRadius / 10));

		new_nodes.append('image')
			.attr('class', 'node_img')
			.attr('xlink:href', d => d.imgUrl || d.img);
		this.nodes.selectAll('.node_img')
			.attr('width', nodeRadius * 2)
			.attr('height', nodeRadius * 2)
			.attr('x', nodeRadius * -1)
			.attr('y', nodeRadius * -1)
			.attr('clip-path', `circle(${nodeRadius})`); // patch: browser cannot update circle(50%) after resize
		this.nodes.selectAll('.node_img')
			.attr('clip-path', `circle(50%)`); // patch: some mobile browser cannot use circle(px)

		// add name label among curved path
		new_nodes
			// .append('def') // def path canot be transformed?
			.append('path')
			.attr('class', 'label_path')
			.attr('fill', 'none')
			.attr('id', d => `textpath_${d.idx}`);
		new_nodes.append('text')
			.attr('text-anchor', 'middle')
			.style('user-select', 'none')
			.append('textPath')
			.attr('href', (d) => `#textpath_${d.idx}`)
			.attr('startOffset', '50%')
			.text(d => d.name);

		this.nodes.each(function(d, index) { // to access index from nodes
			d3.select(this).selectAll('.label_path')
				.attr('d', () => {
					// A - arcs: x-radius y-radius x-axis-rotation large-arc-flag sweep-flag(clockwise) x y
					// draw 2 half circle->full circle
					let degree = index / chars.length;
					let sweepFlag = (degree > 0.25 && degree < 0.75) ? 0 : 1;
					return `M 0 ${nodeRadius} A ${nodeRadius} ${nodeRadius} 0 0 ${sweepFlag} 0 ${-nodeRadius}`
					+ ` A ${nodeRadius} ${nodeRadius} 0 0 ${sweepFlag} 0 ${nodeRadius}`;
				})
				.attr('transform', `rotate(${index / chars.length * 360})`);
			d3.select(this).selectAll('textPath')
				.attr('dominant-baseline', () => {
					let degree = index / chars.length;
					if(degree > 0.25 && degree < 0.75) {
						return 'hanging';
					}else{
						return 'text-top';
					}
				});
		});

		// Bind functions
		const selectNode = (evt, d) => {
			this.unselectNode(this.node1);
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
				.attr('stroke', '#ff0000')
				.attr('stroke-opacity', 0.5)
				.attr('stroke-width', Math.max(4, nodeRadius / 3));
		};
		this.nodes.on('click', selectNode);

		const mousedownFunc = (evt, d) => {
			if (this.node_mousedown >= 0 )
				this.unselectNode(this.node_mousedown);
			this.node_mousedown = d.idx;
			this.nodes
				.filter(cur_d => cur_d.idx == d.idx)
				.selectAll('.node_cir')
				.attr('stroke', '#0000ff')
				.attr('stroke-opacity', 0.5)
				.attr('stroke-width', Math.max(4, nodeRadius / 3));
		};
		const dragTo = (evt, toIdx) => {
			this.node_mouseup = toIdx;
			if (this.node_mousedown >= 0 ) {
				if(this.node_mousedown != toIdx) {
					let color = this.color_getter();
					this.links_list.add(this.node_mousedown, toIdx, color, this.nodes);
					this.unselectNode(this.node_mousedown);
					this.unselectClickedNodes();
				}
				// let node click handle it
			}
			this.node_mousedown = -1;
			evt.stopPropagation(); // do not trigger svg mouseup
			this.cleanDashLink();
		};
		const mouseupFunc = (evt, d) => {
			dragTo(evt, d.idx);
		};
		const touchendFunc = (evt) => {
			let changedTouch = evt.changedTouches[0];
			let touchendElement = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
			let touchendD3Data = d3.select(touchendElement).data()[0];
			if (touchendD3Data && 'idx' in touchendD3Data)
				dragTo(evt, touchendD3Data.idx);
			// otherwise, it is not node, ignore
		};
		const releaseOnBgFunc = () => {
			// unselect mousedown
			this.unselectNode(this.node_mousedown);
			this.node_mousedown = -1;
			this.cleanDashLink();
		};
		this.nodes.on('mousedown', mousedownFunc);
		this.nodes.on('mouseup', mouseupFunc);
		this.svg.on('mouseup', releaseOnBgFunc, {'capture': false}); // bubble, after nodes mouse up
		this.nodes.on('touchstart', mousedownFunc, {'passive': true});
		this.nodes.on('touchend', touchendFunc);
		this.svg.on('touchend', releaseOnBgFunc, {'capture': false});

		// draw dash line
		const movingTo = (evt, x2, y2) => {
			if (this.node_mousedown >= 0) {
				let mousedownNode = this.nodes.filter(d => d.idx == this.node_mousedown);
				let [x1, y1] = getXY(mousedownNode, this.svg);
				this.cleanDashLink();
				this.dash_link_layer.append('line')
					.attr('stroke-dasharray', '5 5')
					.attr('stroke', this.color_getter())
					.attr('x1', x1)
					.attr('y1', y1)
					.attr('x2', x2)
					.attr('y2', y2);
			}
		};
		const touchmoveFunc = (evt) => {
			let changedTouch = evt.changedTouches[0];
			let [x2, y2] = [changedTouch.pageX, changedTouch.pageY];
			movingTo(evt, x2, y2);
		};
		const mousemoveFunc = (evt) => {
			let [x2, y2] = [evt.offsetX, evt.offsetY];
			movingTo(evt, x2, y2);
		};
		this.svg.on('mousemove', mousemoveFunc);
		this.svg.on('touchmove', touchmoveFunc);
	}
	cleanDashLink() {
		this.dash_link_layer.selectAll('line').remove();
	}
	addNode(new_name, new_img) {
		let new_idx = (this.chars.length>0) ? this.chars[this.chars.length - 1].idx + 1: 1;
		toDataURL(new_img).then(imgUrl=>{
			this.chars.push({
				'name': new_name,
				'img': new_img,
				'idx': new_idx,
				'imgUrl': imgUrl,
			});
			this.plot_characters();
			this.links_list.addNode(new_idx); // update linker data
		});
	}
	removeNode() {
		if(this.node1 >= 0 && this.node1 != this.node2)
			return;
		let target_idx = this.node2;
		this.chars = this.chars.filter(c => c.idx != target_idx);
		this.nodes.filter(d => d.idx == target_idx).remove();
		this.plot_characters();
		this.links_list.removeNode(target_idx); // update linker data
		this.unselectClickedNodes();
	}
	addLink(color = null) {
		if (!color) color = this.color_getter();
		this.links_list.add(this.node1, this.node2, color, this.nodes);
	}
	removeLink(color = null) {
		if (!color) color = this.color_getter();
		this.links_list.remove(this.node1, this.node2, color, this.nodes);
	}
	sortLink(colors_order) {
		this.links_list.sort(colors_order);
	}
	unselectAllNodes() {
		this.unselectNode(this.node_mousedown);
		this.node_mousedown = -1;
		this.unselectClickedNodes();
		for (let c in this.chars) {
			this.unselectNode(c.idx);
		}
		this.cleanDashLink();
	}
	unselectClickedNodes() {
		this.unselectNode(this.node1);
		this.unselectNode(this.node2);
		this.node1 = this.node2 = -1;
		this.selectNode_cb(null, null);
	}
	__test(test_src, color) {
		this.node1 = test_src;
		for (let i = 0; i < this.chars.length; i++) {
			this.node2 = i;
			this.addLink(color);
		}
	}
}