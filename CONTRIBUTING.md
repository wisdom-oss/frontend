# Contributing to WISdoM Frontend

Thank you for contributing to the _WISdoM frontend project_!
This document outlines everything you need to know to get started and
contribute effectively.

## About the Project

This repository contains the entire **frontend source code** for the
[WISdoM project](https://github.com/wisdom-oss).
All previous `frontend-*` repositories have been archived in favor of a
monolithic structure, which Angular supports better than a multi repo.
We use [Angular](https://angular.dev) as it provides a robust and structured
approach to web development compared to libraries like React or Vue.
Though the learning curve may be steep, the final codebase remains clean and
maintainable.

We use [Bulma](https://bulma.io) as our CSS framework.
It's lightweight, JS-free, and easy to integrate.
Some additional behavior is built around Bulma; check:

- `src/variables.scss`: for custom variables.
- `src/common/directives/`: for Bulma-compatible Angular directives.

## Development Tools

### Node and NPM

- Use [Volta](https://volta.sh) to manage your [Node](https://nodejs.org)
  version.
  Do not install Node manually.
  Volta can also install a global Node version, so don't be scared.

- Install project dependencies via:
  ```sh
  npm install
  ```

### VSCode Setup

If you want to use [VSCode](https://code.visualstudio.com), make sure you check
out the `.vscode` directory for helpful preconfigured settings.

**Recommend Extensions:**

- **Angular Language Service**: Angular code assistance.
- **Todo Tree**: List all TODOs across the project.
- **Thunder Client**: API endpoint testing.
- **Pretty TypeScript Errors**: Readable TS error messages.
- **Scope to This**: Simplifies file navigation in large projects.

**VSCode Settings:**

- `cSpell.language`: Set to `en` and `de` for mixed English-German strings.
- `typescript.tsdk`: Uses workspace TypeScript for TOML support.

## NPM Scripts

Run scripts via `npm run`.
Key scripts include:

- `start`: Start local development server.
- `build`: Build the application for production.
- `lint`: Run the linter.
- `fmt`: Format the codebase.
- `doc`: Generate documentation.

Ensure you run `lint` and `fmt` before pushing.
The [CI](https://github.com/wisdom-oss/frontend/actions) enforces this.

## Git Pre-Commit Hooks

In order to automatically format and lint the codebase, you can use husky (https://typicode.github.io/husky/get-started.html)
install via
'''sh
npm install --save-dev husky
'''

and make sure npm still functions with repeating
'''sh
npm install
'''

Then, whenever you commit anything via git or GitHub Desktop, both scripts get executed
before the commit happens and you don't have to do so manually

## Code Organization

### File and Directories

Key directories:

- `public`: Static files copied directly into `dist` for hosting.
- `src`: Application code, split into:
  - `api`: Services for backend API interaction.
  - `common`: Shared components, utilities, and tools (highly documented).
  - `core`: Authentication, app frame, and core utilities.
  - `modules`: Individual feature modules (most work happens here).
  - `types`: Additional type definitions.
  - **Important Files**:
    - `config.ts`: App configuration.
    - `i18n.ts`: Configures translation files and namespaces for the application.
    - `routes.ts`: Application routes.
    - `proxy.conf.json`: Local API proxy for development.
    - `styles.scss`: Global styles.
    - `variables.scss`: Shared Bulma variables.

## Building a New Module

0. **Familiarize with Angular**:

   - Read some [Angular docs](https://angular.dev).
   - Consider completing the
     [Angular tutorial](https://angular.dev/tutorials/learn-angular).
   - Make sure you understand [Signals](https://angular.dev/guide/signals).

1. **Workspace Setup**:

   - Create a new directory in `src/modules` for your feature.
   - Avoid generating unnecessary files.

2. **API Integration**:

   - Add new services in `src/api`.
   - Use `src/common/http-contexts.ts` for
     [HTTP contexts](https://angular.dev/api/common/http/HttpContext).
   - Validate responses using [AJV](https://ajv.js.org) and
     `httpContexts.validateSchema`.

3. **Components**:

   - Build [standalone components](https://angular.dev/reference/migrations/standalone) (Angular standard).
   - Use [Bulma classes](https://bulma.io/documentation/) and directives from
     `src/common/directives`.

4. **Translations**:

   - Add an `i18n.toml` file in your module directory.
   - Include it in `src/i18n.ts` and choose a clear namespace.
   - Use translations via [`TranslatePipe` or `TranslateDirective`](https://ngx-translate.org/getting-started/translating-your-components/).

5. **Custom Signals**:

   - Check `src/common/signals.ts` for existing signals before creating new ones.

6. **Styling**:

   - Use Bulma for consistency.
   - Import `variables.scss` if you need
     [Bulma variables](https://bulma.io/documentation/customize/list-of-sass-variables/)
     or shared styles.

7. **Exports**:

   - Each file should export a single symbol for better namespace management.
   - Use the [`namespace`](https://www.typescriptlang.org/docs/handbook/namespaces.html)
     keyword to group multiple symbols under one export.

8. **Routing**:

- Add routes to `src/routes.ts`, usually as a child for the `""` route.
- Make the route accessible by adding a `routerLink` to
  `src/core/sidebar/sidebar.component.html`.

## License

The project is licensed under the [**EUPL-1.2**](./LICENSE).
Ensure any dependencies are compatible.
Most **MIT** and **Apache**-licensed packages are fine.

## Final Notes

Before submitting a PR:

- Run `npm run lint` and `npm run fmt` to pass CI checks. (see ## Git Pre-Commit Hooks above)
- Ensure your module aligns with the project's structure and standards.
- Familiarize yourself with `src/common` — it might already contain what you need.

Happy coding! 🚀
