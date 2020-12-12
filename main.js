function generateTransform(index, length, canvas_radius, node_radius){
	let degree = index/length * 360;
	return `translate(${canvas_radius}, ${node_radius}) rotate(${degree}, ${0}, ${canvas_radius-2*node_radius})`;
};
function reverseRotation(index, length){
	let degree = index/length * 360;
	return `rotate(${-degree})`;
};

let getXY=(svg_obj, svg)=>{
	let p = svg.node().createSVGPoint();
	let ctm = svg_obj.node().getCTM();
	p = p.matrixTransform(ctm);
	return [p.x, p.y];
}

class CharacterLinker{
	chars = [];
	node1 = -1;
	node2 = -1;
	constructor(svg_el, add_link_div, selected_display, color_input, addLink_btn, removeLink_btn){
		// save HTML element
		this.svg_el = svg_el;
		this.add_link_div = add_link_div;
		this.selected_display = selected_display;
		this.color_input = color_input;

		// this.addLink_btn = addLink_btn;
		addLink_btn.onclick = this.addLink.bind(this);
		// this.removeLink_btn = removeLink_btn;
		removeLink_btn.onclick = this.removeLink.bind(this);

		this.svg = d3.select(svg_el);
		add_link_div.style.display = 'none';
		this.links_list = new relationLinkList(this.svg, svg_el);
		this.chars_layer = this.svg.append('g');
	}
	load(data_json){
		// 0. load data
		d3.json(data_json).then((data)=>{
			this.chars = data['characters'];
			for (let idx in this.chars){
				this.chars[idx].idx = idx;
			}
			this.plot_characters();
		});
	}
	getRadius(){
		return 40;
	};
	getOverallRadius(){
		return this.svg_el.clientWidth/2;
	}
	plot_characters(){
		// 1: plot all character in circle after data is loaded
		let chars = this.chars;
		this.nodes = this.chars_layer.selectAll(".nodes").data(chars).enter()
			.append('g')
			.attr('class', 'node')
			.attr("transform", d => generateTransform(d.idx, chars.length, this.getOverallRadius(), this.getRadius()));

		let nodeRadius = this.getRadius();
		this.cir = this.nodes.append('circle')
			.attr('r', d => nodeRadius)
			.attr('stroke', '#333')
			.attr('stroke-width', 2);

		this.images = this.nodes.append('image')
			.attr('xlink:href', d => d.img)
			.attr('clip-path', d => `circle(50%)`)
			.attr('transform', d => reverseRotation(d.idx, chars.length))
			.attr('width', d => nodeRadius * 2)
			.attr('height', d => nodeRadius * 2)
			.attr('x', d => nodeRadius * -1)
			.attr('y', d => nodeRadius * -1);

		const unselectNode = (idx) =>{
			if (idx<0)
				return;
			this.cir
				.filter((_,i)=>i==idx)
				.attr('stroke', '#333')
				.attr('stroke-width', 2);
		};

		const selectNode = (evt, d) =>{
			unselectNode(this.node1);
			this.node1 = this.node2;
			this.node2 = d.idx;
			if (this.node1 >= 0){
				this.selected_display.innerHTML = `${chars[this.node1].name}, ${chars[this.node2].name}`;
				this.add_link_div.style.display = 'block';
			}
			this.cir
				.filter((_,i)=>i==d.idx)
				.attr('stroke', '#F00')
				.attr('stroke-opacity', 0.5)
				.attr('stroke-width', 10);
		}
		this.nodes.on('click', selectNode);
	}
	addLink(){
		let color = this.color_input.value;
		console.log(`add link between ${this.node1}, ${this.node2}, color: ${color}`);
		this.links_list.add(this.node1, this.node2, color, this.nodes);
	}
	removeLink(){
		let color = this.color_input.value;
		console.log(`add link between ${this.node1}, ${this.node2}, color: ${color}`);
		this.links_list.remove(this.node1, this.node2, color, this.nodes);
	}
}

class relationLinkList{
	constructor(svg, svg_el){
		this.svg_el = svg_el;
		this.svg = svg;
		this.curve_layer = svg.append('g');
		this.data = [];
	}
	add(idx1, idx2, color, nodes){
		if (idx1>idx2){
			[idx1, idx2] = [idx2, idx1];
		}
		this.remove(idx1, idx2);
		let node1 = nodes.filter((_,i)=>i==idx1);
		let node2 = nodes.filter((_,i)=>i==idx2);
		this.data.push({source: node1, target: node2, color, idx1, idx2});
		this.drawCurve();
	}
	remove(idx1, idx2){
		this.data = this.data.filter(d=>d.idx1!==idx1 ||d.idx2!==idx2);
		this.drawCurve();
	}
	drawCurve(){
		const transformFunc = d => {
			let [x1, y1] = getXY(d.source, this.svg);
			let [x2, y2] = getXY(d.target, this.svg);
			return `M ${x1} ${y1} T ${x2} ${y2}`;
		}
		this.curve_layer.selectAll('path')
			.data(this.data)
			.join('path')
			.attr('d', transformFunc.bind(this))
			.attr('stroke', d=>d.color);
	}
}

const svg_el = document.getElementById('svg');
const svg = d3.select(svg_el);
const add_link_div = document.getElementById('add_link_div');
let linker = new CharacterLinker(svg_el, add_link_div, document.getElementById('selected_chars'), document.getElementById('color_input'), document.getElementById('addLink_btn'), document.getElementById('removeLink_btn'));
linker.load('characters.json');