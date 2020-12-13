import {CharacterLinker} from './CharacterLinker.js';

const svg_el = document.getElementById('svg');
const add_link_div = document.getElementById('add_link_div');
const color_input = document.getElementById('color_input');
const addLink_btn = document.getElementById('addLink_btn');
const removeLink_btn = document.getElementById('removeLink_btn');


const color_shortcuts = document.getElementById('color_shortcuts');
// ref: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}
function rgbToHex(rgb) {
	let regex = /\w*\((\d+),\s*(\d+),\s*(\d+)\)/g;
	let match = regex.exec(rgb);
	let r = parseInt(match[1]);
	let g = parseInt(match[2]);
	let b = parseInt(match[3]);
	return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function bind_color() {
	let color = this.style['background-color'];
	try{
		color_input.value = rgbToHex(color);
	}catch(err) {
		color_input.value = color;
	}
}
for (let color_btn of color_shortcuts.children) {
	color_btn.onclick = bind_color;
}


let linker = new CharacterLinker(svg_el, add_link_div, document.getElementById('selected_chars'), color_input);


addLink_btn.onclick = () => {
	let color = color_input.value;
	linker.addLink.call(linker, color);
};
removeLink_btn.onclick = () => {
	let color = color_input.value;
	linker.removeLink.call(linker, color);
};

linker.load('characters.json');

let colors_order = ['#ff0000', '#9933ff', '#ffff00', '#33cc33', '#000000'];
document.getElementById('sort_btn').onclick = linker.sortLink.bind(linker, colors_order);

document.getElementById('addNode_btn').onclick = () => {
	let new_name = document.getElementById('new_node_name').value;
	let new_img = document.getElementById('new_node_img').value;
	linker.addNode.call(linker, new_name, new_img);
};
document.getElementById('removeNode_btn').onclick = linker.removeNode.bind(linker);

// setTimeout(() => {
// 	linker.__test(0, color_input.value);
// }, 500);
