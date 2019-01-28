# jsdoc-plantuml
This package contains a jsdoc3 plugin to use plantuml inside javascript documentation.

* JSDoc: http://usejsdoc.org (Node-Package: https://www.npmjs.com/package/jsdoc) 
* PlantUML: http://plantuml.com/

This plugin allows using the plantuml syntax with "@startuml ... @enduml" to use inside
your normal JSDoc source code comments. This plugins parses them and either writes it 
into seperate failes for external processing/displaying in ticket systems/... or 
generates image files to include in your generated documentation.

Extracting the plantuml source into extra files works without extra dependnecies,
Creating image files need a installation of the "node-plantuml" package as well as the
"graphviz" tool to actually generate some of the image formats. For further documentation check
https://www.npmjs.com/package/node-plantuml.

## Usage

install jsdoc and this plugin

Now write some uml diagrams inside your regular jsdocs. 

Attention - The `@startuml` tag must have one parameter - the filename to safe this uml diagram at.
```js
/**
 *  my normal jsdoc comments...
 *  and here i reference my image generated with <img src=filename.png">
 *  inside generate html docs
 *
 * @startuml filename.png
 *  Alice --> Bob
 * @enduml
 *
 * some more comments as you like...
 */
```

The filename given after `@startuml` can either be a relative filename with or without paths or
an absolute filename. @startuml tags without filename are ignored by this plugin.

The filename should either end with the graphic format needed (png, svg, eps) or with "puml"
as format for the plant uml source code files. If puml is used the defaultFormat from the
configuration is used to determined the image file format created.

* `@startuml <filename>` can contain paths, allowed file formats are "png, svg, eps, puml" 
  examples "@startuml file.png" or "@startuml my/path/file.puml" etc.pp.

Inside the jsdoc configuration this plugin must be registered as `plugins` and can be optionally
configured with a `plantuml` object. The following configuration gives the default config used
if no plantuml object is added to your jsdoc-config.

```json
{
  ...
  "plugins": [ "jsdoc-plantuml"],
  "plantuml": {
    "puml": {
      "create": true,
      "destination": "jsDoc/puml"
    },
    "images": {
      "create": true,
      "destination": "jsDoc/images",
      "defaultFormat": "png"
    }
  }
}
```
## Configuration parameters

`puml: {}` Object containing all parameters related to the creation of the puml files from jsdoc
comments.
* `puml.create` Boolean flag to indicate if puml files shall be created or not
* `puml.destination` Path (absolute or relative to working dir) where the  puml files will
be stored. If the filename at the `@startuml` tag contains some paths too these to will
be concatened. All files will be created with the '.puml' extension.

`images: {}` Object containing all parameters related to the creation of the image files from 
jsdoc comments.
* `images.create` Boolean flag to indicate if image files shall be created or not
* `images.destination` Path (absolute or relative to working dir) where the image files will
be stored. If the filename at the `@startuml` tag contains some paths too these to will
be concatened.
* `images.defaultFormat` If the filename given at the `@startuml` tag ends with the '.puml'
 file suffix this format will be used to create images. If the filename already contains a file format
 this one is ignore.
 
## Examples

#### JSDoc comment with one uml diagram, only puml code file should be saved, no image

jsdoc-config.json
```json
{
  ...
  "plugins": [ "jsdoc-plantuml"],
  "plantuml": {
    "puml": {
      "create": true,
      "destination": "jsdoc/puml"
    },
    "images": {
      "create": false
    }
  }
}
```   

Javascript source file. The filename and format is taken from the image file name
at the `@startuml` tag. For the puml file the filename replaces the graphics suffix ("png") by "puml"

```js
/** This file does some magic yada-blah
  @requires 'module:yada'
  
  @startuml images/yadablah.png
    Alice --> Bob
  @enduml
 */
function yadablah() {
    ...
}
```
The File safed is "jsdoc/puml/images/yadablah.svg" inside current working directory.


#### JSDoc comment with one uml diagram, only image file should be saved, not the puml file

jsdoc-config.json
```json
{
  ...
  "plugins": [ "jsdoc-plantuml"],
  "plantuml": {
    "puml": {
      "create": false
    },
    "images": {
      "create": true
    }
  }
}
```   

Javascript source file. The filename and format is taken from the image file name
at the `@startuml` tag.

```js
/** This file does some magic yada-blah
  @requires 'module:yada'
  
  @startuml images/yadablah.png
    Alice --> Bob
  @enduml
 */
function yadablah() {
    ...
}
```
The File safed is "images/yadablah.svg" inside current working directory.

#### JSDoc comment with one uml diagram, create image and puml file

jsdoc-config.json, set default format for images to "svg" instead of "png"
```json
{
  ...
  "plugins": [ "jsdoc-plantuml"],
  "plantuml": {
    "puml": {
      "create": false
    },
    "images": {
      "create": true,
      "defaultFormat": "svg"
    }
  }
}
```   

Javascript source file. The filename is taken from the image file name at the `@startuml` tag,
but format/extension replaced by config param "defaultFormat" as "puml" is no image format

```js
/** This file does some magic yada-blah
  @requires 'module:yada'
  
  @startuml images/yadablah.puml
    Alice --> Bob
  @enduml
 */
function yadablah() {
    ...
}
```

Files safed are "images/yadablah.puml" and "images/yadablah.svg" inside current working directory.


# Copyright
Trilobyte GmbH / Stefan Seide, 2019
