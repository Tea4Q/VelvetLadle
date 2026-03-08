/**
 * Config plugin to restrict JitPack to only serve com.github.* packages.
 * This prevents Gradle from querying JitPack for Maven Central artifacts
 * (like org.bouncycastle) which causes timeouts.
 */
const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withJitpackFilter(config) {
  return withProjectBuildGradle(config, (mod) => {
    const contents = mod.modResults.contents;

    // Replace bare jitpack entry with a filtered one
    const bare = "maven { url 'https://www.jitpack.io' }";
    const filtered = `maven {
      url 'https://www.jitpack.io'
      content {
        includeGroupByRegex "com\\\\.github\\\\..*"
      }
    }`;

    if (contents.includes(bare)) {
      mod.modResults.contents = contents.replace(bare, filtered);
    }

    return mod;
  });
};
