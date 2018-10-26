import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import multiEntry from 'rollup-plugin-multi-entry';

import babel from 'rollup-plugin-babel';

import pkg from './package.json';

if (!pkg.browser_min) {
  let p = path.parse(pkg.browser);
  // Need to have an empty .root and .base, otherwise path.format() will ignore .ext
  p.root = p.base = '';
  p.ext = '.min' + p.ext;
  pkg.browser_min = path.format(p);
}

const isTest = process.env.BUILD === 'test';

const externalModules = [
  'ms',
  'os',
  'fs',
  'util',
  'events',
  'stream',
  'chai',
  'bunyan'
];

export default isTest ? [
  // Testable version (for mocha)
  {
    input: 'src/**/*.test.js',
    external: externalModules,
    output: {
      file: 'dist/stuff-logger.test.js',
      format: 'cjs'
    },
    plugins: [
      multiEntry(),
      babel({
        exclude: ['node_modules/**'],
      })
    ]
  },
  {
    input: 'src/**/*.integration-test.js',
    external: externalModules,
    output: {
      file: 'dist/stuff-logger.integration-test.js',
      format: 'cjs'
    },
    plugins: [
      multiEntry(),
      babel({
        exclude: ['node_modules/**'],
      })
    ]
  }
] : [
  // browser-friendly CJS build
  {
    input: 'src/stuff-logger.js',
    output: {
      name: 'Logger',
      format: 'cjs',
      file: pkg.browser,
      sourcemap: true
    },
    plugins: [
      replace({
        'support-packages': 'browser-packages'
      }),
      resolve({  // so Rollup can find `ms`
        browser: true,
        preferBuiltins: true
      }),
      commonjs(), // so Rollup can convert `ms` to an ES module
      nodeBuiltins(),
      babel({
        exclude: ['node_modules/**']
      }),
    ]
  },
  {
    input: 'src/stuff-logger.js',
    output: {
      name: 'Logger',
      format: 'cjs',
      file: pkg.browser_min,
      sourcemap: true
    },
    plugins: [
      replace({
        'support-packages': 'browser-packages'
      }),
      resolve({  // so Rollup can find `ms`
        browser: true,
        preferBuiltins: true
      }),
      commonjs(), // so Rollup can convert `ms` to an ES module
      nodeBuiltins(),
      babel({
        exclude: ['node_modules/**']
      }),
      uglify()
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // the `targets` option which can specify `dest` and `format`)
  {
    input: 'src/stuff-logger.js',
    external: externalModules,
    output: [
      {
        file: pkg.main,
        format: 'cjs'
      },
      {
        file: pkg.module,
        format: 'es'
      }
    ],
    plugins: [
      babel({
        exclude: ['node_modules/**']
      })
    ]
  }
];
