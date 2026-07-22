const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * op-sqlite's SQLCipher build links OpenSSL through a prefab-only AAR
 * (io.github.ronickg:openssl), so `libcrypto.so` / `libssl.so` are used at link
 * time but never packaged into the APK — the app then crashes at launch with
 * `UnsatisfiedLinkError: libcrypto.so not found`.
 *
 * This plugin copies committed copies of those libraries (see native-libs/openssl/
 * <abi>/) into the generated android jniLibs during prebuild, so they get bundled.
 * Add ABIs there as needed (x86_64 for the emulator; arm64-v8a for real devices).
 */
module.exports = function withOpensslJniLibs(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'native-libs', 'openssl');
      const destBase = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'jniLibs');
      if (fs.existsSync(src)) {
        for (const abi of fs.readdirSync(src)) {
          const abiSrc = path.join(src, abi);
          if (!fs.statSync(abiSrc).isDirectory()) continue;
          const abiDest = path.join(destBase, abi);
          fs.mkdirSync(abiDest, { recursive: true });
          for (const file of fs.readdirSync(abiSrc)) {
            fs.copyFileSync(path.join(abiSrc, file), path.join(abiDest, file));
          }
        }
      }
      return cfg;
    },
  ]);
};
