declare module '@/static/*' {
  const src: string;
  export default src;
}

declare module '*.wasm' {
  const src: string;
  export default src;
}
