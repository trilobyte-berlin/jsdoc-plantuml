'use strict';

// fix for NodeJS bug https://github.com/nodejs/node/issues/36173
// this script removes the shebang line from the node-plantuml index.js file

const fs = require('fs');
const path = require('path');

/** method to use "require()"s path resolution mechanism to find the correct location of the pacakge code
 *
 * @param {string} module name of module to get installation path for
 * @return {string} path to package directory
 */
const modulesPath = function(module) {
  return require.resolve(module).replace(/\\/g, '/').match(/.*\/node_modules\/[^/]+\//)[0];
};

/** method to delete the shebang line from the main index.js file for a given package/path.
 *
 * @param {string} packagePath directory of package where index.js is located
 */
const removeShebang = function(packagePath) {
  const nodePlantumlPath = path.join(packagePath, 'index.js');
  fs.readFile(nodePlantumlPath, function(err, data) { // read file to memory
    if (err) {
      console.log(err);
      return;
    }

    data = data.toString(); // stringify buffer
    if (!data.startsWith('#!')) {
      console.log(`shebang line already removed from ${packagePath} index.js file.`);
      return;
    }
    const position = data.toString().indexOf('\n'); // find position of new line element
    if (position !== -1) {
      data = data.substr(position + 1);

      fs.writeFile(nodePlantumlPath, data, function(err) { // write file
        if (err) {
          console.log(err);
        }
        else {
          console.log(`plant-uml package at ${packagePath} index.js fixed`);
        }
      });
    }
    else {
      console.log('no lines found in plant-uml index.js file?!?');
    }
  });
};


/** bad'n'dirty fix to work around a bug strating ith NodeJS 12.16 and 14.x.
 *  There the module loading code was changed and is not able to load any module starting with
 *  a shebang line. Therefore plant-uml module cannot be loaded anymore within jsdoc:
 *  https://github.com/nodejs/node/issues/36173
 *
 *  This script loads the index.js from the node-plantuml library and removes the shebang line before writing
 *  it back to disc. This is only needed once after installation....
 */
const checkPackages = ['node-plantuml-latest', 'node-plantuml'];
checkPackages.forEach((pkg) => {
  try {
    const nodePlantumlPath = modulesPath(pkg);
    if (nodePlantumlPath) {
      removeShebang(nodePlantumlPath);
    }
  }
  catch (e) {
    console.log(`package ${pkg} not found - ignored`);
  }
});
