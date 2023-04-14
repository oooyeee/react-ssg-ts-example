# How to run this project:

## Scripts
1) `npm run watch1`
> This will build json and sass, in order to have same names of css classes in css and js and watch for changes
2) `npm run watch2`
> This will compile server-side ts/x templates and watch for changes
3) `npm run watch3`
> This will compile client-side ts/x and watch for changes
4) `npm run dev`
> This runs vite in compiled _wwwroot_ folder, enabling hot reloading for development
5) `npm run build` - build script, result in ___wwwroot___ folder
> This just builds everything once
6) `npm run start`
> This starts static webserver in _wwwroot_ folder
7) `npm run prod`
> This script cleans, build for production and opens static express server in wwwroot folder

## Sript files
* `scripts/build_ssg.mjs` - has js entries that compile to html
> Entries must be imported manually

## File names convention
* javascript client (for browser) entry files should be named *.client.ts
* sass entry files should be named *.bundle.sass
> For development, js files that control css hot reload must include those sass files
> and be named *.bundle.js

## Folder structure
* `src/components` - .tsx React components
* `src/pages` - dev root, *.tsx compile to html, import entries to `scripts/build_ssg.mjs` file
* `src/public` - static content that is compied to wwwroot
