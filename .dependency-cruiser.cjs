module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    { name: "core-remains-platform-independent", severity: "error",
      from: { path: "^src/game" }, to: { path: "^src/(ui|render|persistence)" } },
  ],
  options: { doNotFollow: { path: "node_modules" }, tsConfig: { fileName: "tsconfig.json" } },
};
