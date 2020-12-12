import {CharacterLinker} from './CharacterLinker.js';

const svg_el = document.getElementById('svg');
const svg = d3.select(svg_el);
const add_link_div = document.getElementById('add_link_div');
let linker = new CharacterLinker(svg_el, add_link_div, document.getElementById('selected_chars'), document.getElementById('color_input'), document.getElementById('addLink_btn'), document.getElementById('removeLink_btn'));
linker.load('characters.json');