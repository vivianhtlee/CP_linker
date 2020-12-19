import {CharacterLinker} from './CharacterLinker.js';

const color_input = document.getElementById('color_input');

/* color shortcut: change value of color input via buttons*/
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}
function rgbToHex(rgb) {
	// ref: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
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
for (let color_btn of document.getElementById('color_shortcuts').children) {
	color_btn.onclick = bind_color;
}

const selected_chars = document.getElementById('selected_chars');
const selected_1_char = document.getElementById('cur_node_name');
const add_link_div = document.getElementById('add_link_div');
const removeNode_btn = document.getElementById('removeNode_btn');

let selectChar_callback = (char1, char2) => {
	if(char2 == null) {
		// selected_1_char.innerHTML = 'Select character';
		selected_1_char.innerHTML = '選擇1個角色';
		removeNode_btn.style.display = 'none';
	}else if (char1 != null) {
		// selected_1_char.innerHTML = 'Click same character twice';
		selected_1_char.innerHTML = '點選同一角色兩次';
		removeNode_btn.style.display = 'none';
	}else{
		selected_1_char.innerHTML = char2.name;
		removeNode_btn.style.display = 'inline';
	}

	if (char1 != null && char2 != null) {
		selected_chars.innerHTML = `${char1.name}, ${char2.name}`;
		add_link_div.style.display = 'inline';
	}else{
		// selected_chars.innerHTML = 'Select or connect two characters';
		selected_chars.innerHTML = '選擇或連接2個角色';
		add_link_div.style.display = 'none';
	}
};
selectChar_callback(null, null);

const color_getter = () => {
	return color_input.value;
};

let linker = new CharacterLinker(document.getElementById('svg'), selectChar_callback, color_getter);
// load data
const urlParams = new URLSearchParams(window.location.search);
let characters_json_file = urlParams.get('char'); // xxxx.html?char=<url>;
if (!characters_json_file) // use default
	characters_json_file = 'data/characters.json';
linker.load(characters_json_file);
// setTimeout(() => {
// 	linker.__test(25, color_input.value);
// }, 500);

document.getElementById('addLink_btn').onclick = () => {
	let color = color_input.value;
	linker.addLink.call(linker, color);
};
document.getElementById('removeLink_btn').onclick = () => {
	let color = color_input.value;
	linker.removeLink.call(linker, color);
};

document.getElementById('addNode_btn').onclick = () => {
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
