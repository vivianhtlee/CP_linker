# User Manual
## Add link
2 ways to add link
### Method 1
1. click first charater
1. click second character
1. choose color (via color picker or color shortcut)
1. click [+]

### Method 2
1. choose color (via color picker or color shortcut)
1. drag from first character to second character

## Remove link
1. click first charater
1. click second character
1. click [-]

## Add Character
1. input name
1. image url or choose image file
1. click [+]

## Remove Character
1. select character
1. click [-]

## Sort
sort links by color

## Unselect
1. click [unselect]

# Get Start
```
let linker = new CharacterLinker(svg_el, selectChar_callback, color_getter);
linker.load('data/characters.json');
```
## Use different characters data via URL query
`?char=<json file url>`
e.g. `index.html?char=data/shorter_characters.json`

# TODO
load asset (chacacter json) on url