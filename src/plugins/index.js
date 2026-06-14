import router from "../router/index.js";
import vuetify from "./vuetify.js";

export function registerPlugins(app) {
  app.use(vuetify).use(router);
}
