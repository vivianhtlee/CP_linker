import {CharacterLinker} from './CharacterLinker.js';

const svg_el = document.getElementById('svg');
const add_link_div = document.getElementById('add_link_div');
const color_input = document.getElementById('color_input');
const addLink_btn = document.getElementById('addLink_btn');
const removeLink_btn = document.getElementById('removeLink_btn');

/* color shortcut: change value of color input via buttons*/
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

const selected_chars = document.getElementById('selected_chars');
const selected_1_char = document.getElementById('cur_node_name');
const addNode_btn = document.getElementById('addNode_btn');
const removeNode_btn = document.getElementById('removeNode_btn');

let selectChar_callback = (char1, char2) => {
	if(char2 == null) {
		selected_1_char.innerHTML = 'Select character';
		removeNode_btn.style.display = 'none';
	}else if (char1 != null) {
		selected_1_char.innerHTML = 'Click same character twice';
		removeNode_btn.style.display = 'none';
	}else{
		selected_1_char.innerHTML = char2.name;
		removeNode_btn.style.display = 'inline';
	}

	if (char1 != null && char2 != null) {
		selected_chars.innerHTML = `${char1.name}, ${char2.name}`;
		add_link_div.style.display = 'inline';
	}else{
		selected_chars.innerHTML = 'Select two characters or drag between characters';
		add_link_div.style.display = 'none';
	}
};
selectChar_callback(null, null);

const color_getter = () => {
	return color_input.value;
};

let linker = new CharacterLinker(svg_el, selectChar_callback, color_getter);
linker.load('characters.json');
// setTimeout(() => {
// 	linker.__test(25, color_input.value);
// }, 500);

addLink_btn.onclick = () => {
	let color = color_input.value;
	linker.addLink.call(linker, color);
};
removeLink_btn.onclick = () => {
	let color = color_input.value;
	linker.removeLink.call(linker, color);
};

addNode_btn.onclick = () => {
	let new_name = document.getElementById('new_node_name').value;
	let new_img = document.getElementById('new_node_img').value;
	linker.addNode.call(linker, new_name, new_img);
};
removeNode_btn.onclick = linker.removeNode.bind(linker);

document.getElementById('load_img').addEventListener('change', function() {
	if (this.files && this.files[0]) {
		let img = this.files[0];
		document.getElementById('new_node_img').value = URL.createObjectURL(img);
	}
});

let colors_order = ['#ff0000', '#9933ff', '#ffff00', '#33cc33', '#000000'];
document.getElementById('sort_btn').onclick = linker.sortLink.bind(linker, colors_order);

document.getElementById('unselect_btn').onclick = linker.unselectAllNodes.bind(linker);
