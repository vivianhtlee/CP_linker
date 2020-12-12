module.exports = {
    "env": {
        "browser": true, 
        "es6":true
    },
    "globals": {
        "d3": "readonly",
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 3
    },
    "parser": "babel-eslint",
    'parserOptions': {
       'sourceType': 'module'
    },
    "rules": {
        "indent": [
            "error",
            "tab"
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ], 
        "no-console":"warn",
        "no-multi-spaces":"warn",
        "array-bracket-spacing":"warn",
        "comma-spacing":["warn", { "before": false, "after": true }],
        "no-trailing-spaces":"warn",
        "arrow-spacing":"warn",
        "space-infix-ops": "warn",
        "spaced-comment": ["warn","always"],
        "switch-colon-spacing": ["error", {"after": true, "before": false}],
        "semi-spacing": ["warn", {"before": false, "after": true}],
        "key-spacing":"warn",
        "block-spacing": "warn",
        "space-before-blocks": "warn",
    },
};
