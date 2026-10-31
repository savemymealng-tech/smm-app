const { withAppBuildGradle } = require('expo/config-plugins');

function optimizeReleaseDefaults(contents) {
  // SDK 54's generated template otherwise imports -dontoptimize from this file.
  const optimized = contents.replace(
    /getDefaultProguardFile\((['"])proguard-android\.txt\1\)/g,
    'getDefaultProguardFile("proguard-android-optimize.txt")',
  );
  if (!/getDefaultProguardFile\((['"])proguard-android-optimize\.txt\1\)/.test(optimized)) {
    throw new Error('Android optimisation: expected the release ProGuard defaults in app/build.gradle. Review the generated template before building.');
  }
  return optimized;
}
module.exports = function withAndroidReleaseOptimization(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('Android optimisation plugin expects the Expo SDK 54 Groovy template.');
    }
    mod.modResults.contents = optimizeReleaseDefaults(mod.modResults.contents);
    return mod;
  });
};
module.exports.optimizeReleaseDefaults = optimizeReleaseDefaults;
