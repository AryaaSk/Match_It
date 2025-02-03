# Vanilla Template
### A basic template to build vanilla JS projects, comes with a project structure and a build process.

## To start development:
Go to project root and type in terminal:
```
live-server
```

Start typescript compilation:
**SHIFT + COMMAND + B - Select 'tsc: watch'**

*Make sure you have live-server and typescript installed globally from NPM.*

## To build
Go to project root and type in terminal:
```
python3 build.py
```

*Make sure you have python installed, as well as the dependencies that [Build.py](build.py) requires.*

## Notes
- You must give each Src file its own unique name if they are the same extension, for example you cannot have 2 index.html.
- This is because all the files get put into a single dist folder so if 2 files have the same name one will get overwritten.
- To use assets you can use their absolute path relative to the project's root, it will get updated when being build for dist. 
- Here is an example if there was an image in the assets folder and I wanted to access it from a Src file:
```html
<img src="/Assets/image.png">
```