import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

const config: Config = {
  title: "faka-Shop",
  description: "",

  passToClient: ["user", "site", "footerPages", "rootInitialized", "registrationEnabled"],
  extends: [vikeVue],
};

export default config;
