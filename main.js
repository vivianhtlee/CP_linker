import {CharacterLinker} from './CharacterLinker.js';
import {rgbToHex, svg_to_png} from './utils.js';

// parse url query
const urlParams = new URLSearchParams(window.location.search);
let characters_json_file = urlParams.get('char'); // xxxx.html?char=<url>;
if (!characters_json_file) characters_json_file = 'data/characters.json';
let lang = urlParams.get('lang'); // xxxx.html?char=<url>;
if (!lang) lang = 'en'; // or zh

// Translate
{
	document.title = (lang != 'zh') ? 'CP diagram' : 'CP連線圖';

	const color_shortcuts_buttons = document.getElementById('color_shortcuts').children;
	let color_shortcuts_desc;
	if (lang == 'zh') {
		color_shortcuts_desc = ['主推, 好嗑', '不錯, 好吃', '無感/能接受', '更喜歡CP以外的關係(親情/友情)', '反感/雷點'];
	}else{ // if(lang == 'en')
		color_shortcuts_desc = ['Love it very much', 'Like it', 'acceptable', 'prefer non-romantic relationship', 'No, thank you'];
	}
	for (let i = 0; i < color_shortcuts_buttons.length; i++) {
		let color_btn = color_shortcuts_buttons[i];
		color_btn.value = color_shortcuts_desc[i];
	}

	document.getElementById('sort_btn').value = (lang != 'zh') ? 'Sort' : '排序';
	document.getElementById('unselect_btn').value = (lang != 'zh') ? 'Unselect' : '取消選取';

	document.getElementById('add_node_div').getElementsByTagName('span')[0].innerHTML = (lang != 'zh') ? 'Add Character' : '新增角色';
	document.getElementById('remove_node_div').getElementsByTagName('span')[0].innerHTML = (lang != 'zh') ? 'Remove Character' : '移除角色';
}

const color_input = document.getElementById('color_input');

/* color shortcut: change value of color input via buttons */
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
		selected_1_char.innerHTML = (lang != 'zh') ? 'Select character' : '選擇1個角色';
		removeNode_btn.style.display = 'none';
	}else if (char1 != null) {
		selected_1_char.innerHTML = (lang != 'zh') ? 'Click same character twice' : '點選同一角色兩次';
		removeNode_btn.style.display = 'none';
	}else{
		selected_1_char.innerHTML = char2.name;
		removeNode_btn.style.display = 'inline';
	}

	if (char1 != null && char2 != null) {
		selected_chars.innerHTML = `${char1.name}, ${char2.name}`;
		add_link_div.style.display = 'inline';
	}else{
		selected_chars.innerHTML = (lang != 'zh') ? 'Select or connect two characters' : '選擇或連接2個角色';
		add_link_div.style.display = 'none';
	}
};
selectChar_callback(null, null);

const color_getter = () => {
	return color_input.value;
};

const svg_el = document.getElementById('svg');
let linker = new CharacterLinker(svg_el, selectChar_callback, color_getter);
linker.load(characters_json_file); // load data
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


/* Generate Image for download */
document.getElementById('generateImage_btn').onclick = ()=>{
	let dl_link = document.getElementById('download_generated_image');
	svg_to_png(svg_el, (imageURL)=>{
		dl_link.href = imageURL;
		dl_link.download = "CP_linker.jpg";
		dl_link.style.display = 'inline';
	});
}