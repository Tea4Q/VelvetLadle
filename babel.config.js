module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/contexts': './contexts',
            '@/constants': './constants',
            '@/lib': './lib',
            '@/services': './services',
            '@/utils': './utils'
          },
        },
      ],
    ],
  };
};
