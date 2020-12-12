// global variables
let chars;
let node1 =-1;
let node2 = -1;

const svg_el = document.getElementById('svg');
const svg = d3.select(svg_el);
const add_links_div = document.getElementById('addLinks');

let getRadius = () =>{
	return 40;
};
let getOverallRadius = () => {
	return svg_el.clientWidth/2;
}
let generateTransform = (index, length, canvas_radius, node_radius) =>{
	let degree = index/length * 360;
	return `translate(${canvas_radius}, ${node_radius}) rotate(${degree}, ${0}, ${canvas_radius-2*node_radius})`;
};
let reverseRotation = (index, length) =>{
	let degree = index/length * 360;
	return `rotate(${-degree})`;
};


// 0. load data
d3.json('characters.json').then((data)=>{
	chars = data['characters'];
	for (let idx in chars){
		chars[idx].idx = idx;
	}
	plot_characters();
});
function plot_characters(){

	// 1: plot all character in circle after data is loaded
	const nodes = svg.selectAll(".nodes").data(chars).enter()
		.append('g')
		.attr('class', 'node')
		.attr("transform", d => generateTransform(d.idx, chars.length, getOverallRadius(), getRadius()));

	const cir = nodes
		.append('circle')
		.attr('r', d => getRadius(d.group))
		.attr('stroke', '#333')
		.attr('stroke-width', 2);

	const images = nodes
		.append('image')
		.attr('xlink:href', d => d.img)
		.attr('clip-path', d => `circle(50%)`)
		.attr('transform', d => reverseRotation(d.idx, chars.length))
		.attr('width', d => getRadius(d.group) * 2)
		.attr('height', d => getRadius(d.group) * 2)
		.attr('x', d => getRadius(d.group) * -1)
		.attr('y', d => getRadius(d.group) * -1);

	// 2: allow select character in canvas


	const unselectNode = (idx) =>{
		if (idx<0)
			return;
		cir[idx]
			.attr('stroke', '#333')
			.attr('stroke-width', 2);
	};

	const selectNode = (evt, d) =>{
		if (node2>=0){
			node1 = node2;
		}
		node2=d.idx;
		if (node1>=0){
			document.getElementById('selected_chars').innerHTML = `${chars[node1].name}, ${chars[node2].name}`;
			add_links_div.style.display = 'block';
		}
		cir[d.idx]
			.attr('stroke', '#900')
			.attr('stroke-width', 5);
	}
	nodes.on('click', selectNode);

}
// 3: select 2 characters -> add link (love/like/dislike)
const addLink = () => {
	console.log(`add link between ${node1}, ${node2}`);
};
document.getElementById('addLink_btn').onclick = addLink;
// 4: add curve in canvas

// 5: allow 