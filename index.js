/* eslint-env node */
'use strict';

const env = require('jsdoc/env');
const logger = require('jsdoc/util/logger');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const logPrefix = 'jsdoc-plantuml:';

// lazy init if needed
let plantuml;

// store all PUML tags found with a name here, using object to detect duplicates with same name
// and not overwrite existing without warning
// it is not possible to attach the tags found to the doclet as some doclets not associated to code
// will not be available after full processing all files. To work around this and cat all @startuml
// block we store them here inside our plugin
let plantumlTags = {};


// default configuration
let myConfig = {
    createPuml: true,
    createImages: true,
    replaceWithImage: false,
    pathPuml: './jsDoc/puml',
    pathImages: './jsDoc/images',
    imageFormat: 'png'
};
_checkConfiguration();

// ===
// check configuration options
//
// logger.warn('jsdoc env: ' + JSON.stringify(env));
// logger.warn('jsdoc config: ' + JSON.stringify(env.conf));

/** function to check for config params set via jsdoc to adapt our own default config
 *
 *  @private
 */
function _checkConfiguration() {
    const config = env.conf.plantuml || {};
    if (config.puml) {
        if (typeof config.puml.create === 'boolean') myConfig.createPuml = config.puml.create;
        if (config.puml.destination) {
            myConfig.pathPuml = config.puml.destination;
            logger.debug(`${logPrefix} got destination path from config: ${myConfig.pathPuml}`);
        }
    }
    logger.info(`${logPrefix} using destination path for puml files: ${myConfig.pathPuml}`);

    if (config.images) {
        if (typeof config.images.create === 'boolean') myConfig.createImages = config.images.create;
        if (typeof config.images.replaceWithImage === 'boolean') myConfig.replaceWithImage = config.images.replaceWithImage;
        if (config.images.destination) {
            myConfig.pathImages = config.images.destination;
            logger.debug(`${logPrefix} got destination path from config: ${myConfig.pathImages}`);
        }
        if (config.images.defaultFormat) {
            myConfig.imageFormat = config.images.defaultFormat;
        }
    }
    logger.info(`${logPrefix} using destination path for image files: ${myConfig.pathImages}`);
}
// end configuration
// ====


/** helper function to write puml data into file name given
 *
 * @param {string} pumlFile file name and path where to write file
 * @param {string} pumlData content of the file with all plant-uml data
 * @private
 */
function _writePumlFile(pumlFile, pumlData) {
    logger.info(`${logPrefix} writing puml file ${pumlFile}`);
    fse.ensureDir(path.dirname(pumlFile), function(err) {
        if (err && !err.EEXIST) {
            logger.error(`${logPrefix} Cannot create directory to write puml files: ${err.toString()}`);
            return;
        }
        fse.outputFile(pumlFile, pumlData, function(err) {
            if (err) logger.error(`${logPrefix} Could not write PUML file at ${pumlFile}: ` + JSON.stringify(err));
        });
    });
}

/** helper function to write puml data into an image file (e.g. PNG) with name given
 *
 * @param {string} imageFile file name and path where to write file
 * @param {string} imageFormat image file format like "png", "svg" or similar supported by plant-uml
 * @param {string} pumlData content of the file with all plant-uml code to write
 * @private
 */
function _writeImageFile(imageFile, imageFormat, pumlData) {
    logger.info(`${logPrefix} writing ${imageFormat} image file ${imageFile}`);
    fse.ensureDir(path.dirname(imageFile), function(err) {
        if (err && !err.EEXIST) {
            logger.error(`${logPrefix} Cannot create directory to write image files: ${err.toString()}`);
            return;
        }
        let gen = plantuml.generate(pumlData, {format: imageFormat});
        gen.out.pipe(fs.createWriteStream(imageFile));
    });
}

/** converts a given path to an absolut one if it is relative, returning the new path
 *
 * @param {string} inPath path to check, either relative or absolute
 * @returns {string} absolute path to input path given
 * @private
 */
function _absolutePath(inPath) {
    if (!path.isAbsolute(inPath)) {
        const p = path.join(process.cwd(), inPath);
        logger.debug(`${logPrefix} new ${inPath} path not absolute - convert to ${p}`);
        return p
    }
    return inPath;
}


exports.handlers = {
    /** function to check at beginning if needed peer dependency is installed if image files shall be created
     *
     * @param {object} e - jsdoc handler event (http://usejsdoc.org/about-plugins.html)
     */
    parseBegin: function(e) {
        if (myConfig.createImages) {
            try {
                plantuml = require('node-plantuml-latest');
            }
            catch (ex) {
                logger.error(`${logPrefix} "createImages" is set to TRUE but package "node-plantuml" not installed`);
            }
        }
    },
    /** check all doclets created and extract list of uml descriptions found to either write PUML files with
     *  their source or create image from them. Writing files is deferred until all code is parsed to
     *  have the possibility to detect duplicate definitions.
     *
     *  @param {object} e - jsdoc handler event (http://usejsdoc.org/about-plugins.html)
     */
    processingComplete: function(e) {
        logger.debug(`${logPrefix} processingComplete: uml tags length=${Object.keys(plantumlTags).length}, ` + JSON.stringify(plantumlTags));
        Object.keys(plantumlTags).forEach(function(key) {
           if (plantumlTags.hasOwnProperty(key)) {
               const umlTag = plantumlTags[key];
               if (myConfig.createPuml && umlTag.outFilePuml) {
                   _writePumlFile(umlTag.outFilePuml, umlTag.value.description)
               }
               if (myConfig.createImages && umlTag.outFileImage) {
                   _writeImageFile(umlTag.outFileImage, umlTag.imageFormat, umlTag.value.description);
               }
           }
        });
    }
};


exports.defineTags = function(dictionary) {
    // define tags here
    dictionary.defineTag('startuml', {
        canHaveName: true,
        mustHaveValue: true,
        /** define doclet for startuml to catch all plant uml related definitions
         *
         *  @param {object} doclet latest doclet
         *  @param {object} tag new tag created
         */
        onTagged: function(doclet, tag) {
            logger.debug(`${logPrefix} startuml / onTagged: tag=${JSON.stringify(tag)}`);
            tag.srcFile = path.join(doclet.meta.path, doclet.meta.filename);
            tag.value.description = '@startuml\n' + tag.value.description + '\n@enduml';

            // most @startuml definitions are tagged two times, first time for doclet found (/** ... */)
            // and second time when they are attached to some line of code (function, class, ...)
            // here we ignore the second call
            if (Object.keys(doclet.meta.code).length !== 0) return;
            // only process tags with a name (=filename)
            if (!tag.value.name) {
                logger.warn(`${logPrefix} IGNORED: image name missing for @startuml tag at doclet starting line ${doclet.meta.lineno}, ` +
                  `file ${tag.srcFile}`);
                return;
            }

            // look for plantuml known file extensions, ignore all other as name is set from plantUml content instead
            let extension = path.extname(tag.value.name);
            logger.debug(`${logPrefix} found uml tag with file name extension ${extension} at line ${doclet.meta.lineno}`);
            switch (extension.toLowerCase()) {
                case '.png':
                case '.svg':
                case '.eps':
                    tag.outFilePuml = path.join(myConfig.pathPuml, tag.value.name.replace(new RegExp(extension + '$'), '.puml'));
                    tag.outFilePuml = _absolutePath(tag.outFilePuml);
                    if (myConfig.pathImages) {
                        tag.imageFormat = extension.substr(1);
                        tag.outFileImage = _absolutePath(path.join(myConfig.pathImages, tag.value.name));
                    }

                    if (plantumlTags[tag.outFilePuml]) {
                        logger.warn(`Filename ${tag.outFilePuml} already defined in another jsdoc tag. Duplicate found in file ${tag.srcFile}`);
                    }
                    else {
                        plantumlTags[tag.outFilePuml] = tag;
                    }
                    break;

                case '.puml':
                    tag.imageFormat = myConfig.imageFormat;
                    if (myConfig.pathPuml) {
                        tag.outFilePuml = _absolutePath(path.join(myConfig.pathPuml, tag.value.name));
                    }
                    // create image file name with default format
                    if (myConfig.pathImages) {
                        tag.outFileImage = path.join(myConfig.pathImages,
                            tag.value.name.replace(new RegExp(extension + '$'), '.' + myConfig.imageFormat));
                        tag.outFileImage = _absolutePath(tag.outFileImage);
                    }

                    if (plantumlTags[tag.outFilePuml]) {
                        logger.warn(`Filename ${tag.outFilePuml} already defined in another jsdoc tag. Duplicate found in file ${tag.srcFile}`);
                    }
                    else {
                        plantumlTags[tag.outFilePuml] = tag;
                    }
                    break;

                default:
                    logger.warn(`${logPrefix} IGNORED: unknown image format "${extension}" or image name missing for @startuml tag ` +
                      `at doclet starting line ${doclet.meta.lineno}, file ${tag.srcFile}`);
            }
        }
    });

    dictionary.defineTag('enduml', {
        canHaveName: false,
        mustHaveValue: false,
        /** define doclet for enduml to get all text between startuml and enduml for writing files
         *
         *  @param {object} doclet latest doclet
         *  @param {object} tag new tag created
         */
        onTagged: function(doclet, tag) {
            logger.debug(`${logPrefix} enduml / onTagged: tag=${JSON.stringify(tag)}`);
        }
    });
};
