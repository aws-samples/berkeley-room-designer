// This file is responsible for defining additional frontend dependencies. See: https://github.com/tsapporg/ts-npm/tree/aws-sample
const npmPackage: any = {
  dependencies: {
    // Web components:
    '@webcomponents/webcomponentsjs': '2.8.0', // Used to ensure web component support.
    'lit': '3.0.0-pre.0', // Used as simple base class for building object-oriented web components.
    '@lit-labs/task': '2.0.0', // Used for managing UI state during async work (i.e. fetching data). See: https://github.com/lit/lit-element/issues/108
    '@lit-labs/router': '0.1.3', // Used in SPA routing.
    'urlpattern-polyfill': '9.0.0', // Used to ensure url pattern support.

    // Listing data:
    // See makefile and <berkeley-room-designer-root>/src/frontend/index.html for how these are currently included.
    //'sqlite-wasm-http': '1.1.1', // Used for sqlite interaction in frontend.

    // Import, export, and storage:
    'file-system-access': '1.0.4', // Used to ensure filesystem support. See: https://developer.mozilla.org/en-US/docs/Web/API/FileSystem 
    '@types/wicg-file-system-access': '2020.9.6',
    'localstorage-slim': '2.5.0', // Used to store application state.
    'dexie': '3.2.4', // Used to store generated room configurations.

    // UI:
    'bootstrap': '5.3.0', // CSS/JS styling framework.
    '@types/bootstrap': '5.2.6', // ^
    'bootstrap-icons': '1.10.5', // ^
    '@popperjs/core': '2.11.8', // Required by Bootstrap for drop-downs.
    'rxjs': '7.8.1', // Used for handling input changes.
    'ts-bus': '2.3.1', // Used for component->component communication.

    // Rendering:
    // Used to provide a standard interface for WebGL rendering of room configurations in 3D.
    // Also used for visualizing furniture placement algorithms in 3D.
    'ts-app-renderer': 'github:tsapporg/ts-app-renderer#c2bf84a4fede7f0deeb5150ea903806530a098de'
  },
  devDependencies: {
    // Develop:
    'nodemon': '3.0.2', // Used to watch for source changes.
    'onchange': '7.1.0', // Used to watch for source changes.

    'dotenv-to-json': '0.1.0', // Used to convert our ./config/.env file to JSON for injection in website HTML template.
    
    // I could not get a simple dev HTTP server with range request support to work the same as the webpack example in the sqlite-wasm-http package,
    //  so the webpack dev server is only used because HTTP range requests work.
    'webpack-cli': '5.1.4',
    'webpack-dev-server': '4.15.1',

    'clean-css-cli': '5.6.1', // Used to bundle styles not defined in web components.
    'esbuild': '0.19.2', // Used to bundle scripts and their dependencies.
    'ejs-cli': 'mainframenzo/forkof.ejs-cli#3b85d2b2db04a6dca6533b33e59dfa360a63efbb', // Used to add build logic to HTML to handle variable imports of scripts/styles/etc. See ./src/index.html .

    'openapi-typescript': '6.7.0', // Used to generate types for API client from OpenAPI def.
    'openapi-fetch': '0.7.10' // Used to to make HTTP requests to backend using generated types from OpenAPI def.
  }
}

export default { npmPackage }