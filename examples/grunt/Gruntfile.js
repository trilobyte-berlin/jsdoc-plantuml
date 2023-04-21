// minimal Gruntfile to run a jsdoc test with this plugin against a set of javascript files
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('../package.json'),
    jsdoc: {
        dist: {
            options: {
                configure: './jsdocConfig.json'
            }
        }
    }
  });

  // Default task(s).
  // runt.loadNpmTasks('grunt-jsdoc');  // this file not in base dir, cannot used here
  grunt.loadTasks('../node_modules/grunt-jsdoc/tasks');
  grunt.registerTask('default', ['jsdoc']);
};
