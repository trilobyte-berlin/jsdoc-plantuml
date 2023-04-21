# Using PlantUML plugin with JSDoc directly

This plugin is tested with JSDoc v3 and v4.
The usage of v4 is recommended as Version 3 uses the not maintained dependency "taffydb" having unresolved 
security vulnerabilities (https://security.snyk.io/vuln/SNYK-JS-TAFFYDB-2992450)

## Required dependencies in package.json file
```json
{
  "scripts": {
    "jsdoc": "jsdoc --configure <path-to-jsdocConfig.json>"
  },
  "devDependencies": {
    "jsdoc": "^4.0.2"
  }        
}
```

## Usage

```shell
npm run jsdoc
```
