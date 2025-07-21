module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }]
    ],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
      'react-native-reanimated/plugin',
    ],
  };
};