# About

Containing examples of using x-visual.

This is a package without source dependency on x-visual. Examples are compiled
with webpack after install x-visual via npm.

# Quick Start

Copy all files in examples folder (may be a new git repo in the future).

```
    npm i
    webpack
```

Open index.html.

Use this line to open it from file system:

```
    google-chrome --allow-file-access-from-files --allow-file-access --allow-cross-origin-auth-prompt
```

# The Sample Applications

Sample Applications based on x-visual must keeping [ECS](https://en.wikipedia.org/wiki/Entity_component_system)
pattern in mind - essentially x-visual is inspired by this ideal.

## Hello XWorld

The hello xworld application has the following structure:

- App (app.js), the application main entry;
- Business logics (hellocube.js), which has some data (a cube) to be shown;

There is [an updating introduction for developers](https://odys-z.github.io/x-visual/guide/index.html).
