module.exports = function (api) {
  api.cache(true);
  if (process.env.NODE_ENV === 'test') {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
    };
  }
  return {
    presets: ['babel-preset-expo'],
  };
};
