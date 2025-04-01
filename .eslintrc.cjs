module.exports = {
    env: {
        es6: true,
    },
    extends: [
        "eslint:recommended",
        "airbnb-base",
        "plugin:sonarjs/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["sonarjs", "@typescript-eslint", "prettier"],
    ignorePatterns: ["node_modules/", "dist/"],
    settings: {
        "import/resolver": {
            typescript: { project: ["tsconfig.json"] },
        },
    },
    rules: {
        // отключенные правила
        "consistent-return": 0,
        "no-undef": 0,
        "no-underscore-dangle": 0,
        "no-return-await": 0,
        "sonarjs/no-duplicate-string": 0,
        "no-plusplus": 0,
        "no-irregular-whitespace": 0,
        "import/extensions": 0,
        "import/prefer-default-export": 0,
        "class-methods-use-this": 0,
        indent: 0, // отступы ставит prettier
        "prettier/prettier": 2,
        // обшие
        quotes: ["error", "double", { avoidEscape: true }],
        "max-len": [
            "error",
            {
                code: 110,
                ignoreUrls: true,
                ignoreStrings: true,
            },
        ],
        "prefer-destructuring": [
            "error",
            {
                object: true,
                array: false,
            },
        ],
        "no-param-reassign": ["error", { props: false }],
        "func-names": ["error", "as-needed"],
        "no-use-before-define": ["error", { functions: false }],
        "one-var": [
            "error",
            {
                initialized: "never",
                uninitialized: "consecutive",
            },
        ],
        "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
        // правила по переносам строк
        "operator-linebreak": [
            "error",
            "after",
            {
                overrides: {
                    "?": "before",
                    ":": "before",
                },
            },
        ],
        "newline-per-chained-call": 0,
        "array-element-newline": ["error", "consistent"],
        "array-bracket-newline": ["error", "consistent"],
        "object-property-newline": ["error", { allowAllPropertiesOnSameLine: false }],
        "object-curly-newline": [
            "error",
            {
                ImportDeclaration: { consistent: true },
                ObjectExpression: {
                    consistent: true,
                    minProperties: 2,
                },
                ObjectPattern: { consistent: true },
            },
        ],
        "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                args: "all",
                argsIgnorePattern: "^_",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_",
                destructuredArrayIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                ignoreRestSiblings: true,
            },
        ],
    },
    overrides: [
        {
            files: ["./examples/**/*.js"],
            rules: {
                "object-property-newline": 0,
                "object-curly-newline": 0,
            },
        },
    ],
};
