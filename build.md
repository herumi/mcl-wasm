# Development

## Build mcl_c.js
Install the following tools:
- clang-18, wasm-ld-18: `sudo apt install clang-18 lld-18`
- wasm-opt (binaryen): `sudo apt install binaryen`

```
make
```
or via pnpm:
```
pnpm run build:mcl_c.js
```

## Build for browser

How to build `browser/mcl.js`.
```
pnpm install
pnpm run build:browser
```

