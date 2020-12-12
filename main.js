function generateTransform(index, length, canvas_radius, node_radius){
	let degree = index/length * 360;
	return `translate(${canvas_radius}, ${node_radius}) rotate(${degree}, ${0}, ${canvas_radius-2*node_radius})`;
};
function reverseRotation(index, length){
	let degree = index/length * 360;
	return `rotate(${-degree})`;
};

class CharacterLinker{
	chars = [];
	node1 = -1;
	node2 = -1;
	constructor(svg_el, add_link_div, addLink_btn, selected_display){
		// save HTML element
		this.svg_el = svg_el;
		this.add_link_div = add_link_div;
		this.addLink_btn = addLink_btn; 
		this.selected_display = selected_display;
		//
		this.svg = d3.select(svg_el);
		add_link_div.style.display = 'none';
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
		this.nodes = this.svg.selectAll(".nodes").data(chars).enter()
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
				.attr('stroke', '#900')
				.attr('stroke-width', 5);
		}
		this.nodes.on('click', selectNode);

		// 3: select 2 characters -> add link (love/like/dislike)
		this.addLink_btn.onclick = this.addLink;
	}
	addLink(){
		console.log(`add link between ${this.node1}, ${this.node2}`);
		// TODO
		// add links
		// 4: add curve in canvas

		// 5: allow remove links
	}
}

const svg_el = document.getElementById('svg');
const svg = d3.select(svg_el);
const add_link_div = document.getElementById('addLink');
let linker = new CharacterLinker(svg_el, add_link_div, document.getElementById('addLink_btn'), document.getElementById('selected_chars'));
linker.load('characters.json');