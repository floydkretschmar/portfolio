## Modules
| Module | Summary |
|--------|---------|
| `src/main.js`, `src/App.vue`, `src/plugins/` | Vue app bootstrap, router/plugin registration, and Vuetify theme/component setup. |
| `src/router/` | Vue Router configuration for the default layout, Home route, and About route. |
| `src/layouts/default/` | Shared application shell with the top navigation header and nested route content host. |
| `src/views/` | Page-level views: the Flickr-backed gallery home page and static About page. |
| `src/components/home/` | Home gallery components for infinite scrolling, masonry layout, loading state, image cards, and modal image preview. |
| `src/services/ApiService.ts` and `config.js` | Remote Flickr-service client configuration, pagination settings, cache duration, and photoset selection. |
| `.github/workflows/` | GitHub Pages build and deployment workflow for the static Vite output. |


## Architectural conventions
- This app is static-client only; photo data comes from `https://flickr-service.fly.dev/photos/{photoset}` and there is no local backend.
- Routes are wrapped by the default layout, with page content rendered through the layout's nested `<router-view>`.
- Home page data is paginated with `page`/`limit` query params and cached in `sessionStorage` under `home-data` for one hour.
- UI uses Vuetify 3, Vue Router 4, Vue Masonry, SCSS, Poppins/Roboto fonts, and MDI icons.
- Deployment builds with Vite, then copies `dist/index.html` to `dist/404.html` for static-host SPA fallback behavior.
