import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/trust-widget.min.js',
      format: 'iife',
      name: 'TrustWidget',
      sourcemap: true,
    },
    plugins: [typescript(), terser()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/trust-widget.js',
      format: 'iife',
      name: 'TrustWidget',
      sourcemap: true,
    },
    plugins: [typescript()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/trust-widget.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [typescript()],
  },
];
