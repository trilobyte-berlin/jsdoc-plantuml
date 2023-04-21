# Using PlantUML plugin with Grunt Taskrunner

Grunt (https://gruntjs.com/) and its jsdoc Plugin "grunt-jsdoc" (https://www.npmjs.com/package/grunt-jsdoc)
uses JSDoc v3 only at the moment. As JSDoc Version 3 has some known preblems and is not updated anymore it 
is recommended to not use Grunt task runner to generate Javascript Documentation but use JSDoc directly instead.

The not maintained dependency "taffydb" from jsdoc@3 has unresolved 
security vulnerabilities (https://security.snyk.io/vuln/SNYK-JS-TAFFYDB-2992450)

## Required dependencies in package.json file
```json
{
  "scripts": {
    "jsdoc": "grunt --gruntfile Gruntfile.js"
  },
  "devDependencies": {
    "grunt": "^1.6.1",
    "grunt-jsdoc": "^2.4.1",
    "jsdoc": "^3.6.10"
  }        
}
```

## Usage
An example gruntfile is part of this folder, it registers just one task - jsdoc and nothing else.

```shell
npm run jsdoc
```
