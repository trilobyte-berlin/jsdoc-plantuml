const env = require('jsdoc/env');
const logger = require('jsdoc/util/logger');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const logPrefix = 'jsdoc-plantuml: ';

// lazy init if needed
let plantuml;


// default configuration
let myConfig = {
    createPuml: true,
    createImages: true,
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
            logger.debug(logPrefix + 'got destination path from config: ' + myConfig.pathPuml);
        }
    }
    logger.info(logPrefix + 'using destination path for puml files: ' + myConfig.pathPuml);

    if (config.images) {
        if (typeof config.images.create === 'boolean') myConfig.createImages = config.images.create;
        if (config.images.destination) {
            myConfig.pathImages = config.images.destination;
            logger.debug('got destination path from config: ' + myConfig.pathImages);
        }
        if (config.images.defaultFormat) {
            myConfig.imageFormat = config.images.defaultFormat;
        }
    }
    logger.info(logPrefix + 'using destination path for image files: ' + myConfig.pathImages);
}
// end configuration
// ====


exports.handlers = {
    /** function to check at beginning if needed peer dependency is installed if image files shall be created
     *
     * @param {object} e - jsdoc handler event (http://usejsdoc.org/about-plugins.html)
     */
    parseBegin: function(e) {
        if (myConfig.createImages) {
            try {
                plantuml = require('node-plantuml');
            }
            catch (ex) {
                logger.error(logPrefix + '"createImages" is set to TRUE but package "node-plantuml" not installed');
            }
        }
    },
    /** check all doclets creeated and extract list of uml descriptions found to either write PUML files with
     *  their source or create image from them
     *
     *  @param {object} e - jsdoc handler event (http://usejsdoc.org/about-plugins.html)
     */
    processingComplete: function(e) {
        logger.debug(logPrefix + 'processingComplete: doclet length=' + e.doclets.length);
        let umlTags = [];
        e.doclets.filter((d) => Array.isArray(d.plantUml))
    .forEach((doc) => doc.plantUml.forEach((tag) => umlTags.push(tag)));

        logger.debug(logPrefix + 'processingComplete: uml tags length=' + umlTags.length + ', ' + JSON.stringify(umlTags));
        umlTags.forEach(function(umlTag) {
            if (myConfig.createPuml && umlTag.outFilePuml) {
                logger.info('writing puml file ' + umlTag.outFilePuml);
                fse.ensureDir(path.dirname(umlTag.outFilePuml), function(err) {
                    if (err && !err.EEXIST) {
                        logger.error(logPrefix + 'Cannot create directory to write puml files: ' + err.toString());
                        return;
                    }
                    fse.outputFile(umlTag.outFilePuml, umlTag.value.description, function(err) {
                        if (err) logger.error(logPrefix + 'Could not write PUML file at ' + umlTag.outFilePuml + ': ' + JSON.stringify(err));
                    });
                });
            }
            if (myConfig.createImages && umlTag.outFileImage) {
                logger.info(logPrefix + 'writing ' + umlTag.imageFormat + ' image file ' + umlTag.outFileImage);
                fse.ensureDir(path.dirname(umlTag.outFileImage), function(err) {
                    if (err && !err.EEXIST) {
                        logger.error(logPrefix + 'Cannot create directory to write image files: ' + err.toString());
                        return;
                    }
                    // write imagefile
                    let gen = plantuml.generate(umlTag.value.description, {format: umlTag.imageFormat});
                    gen.out.pipe(fs.createWriteStream(umlTag.outFileImage));
                });
            }
        });
    }
};


exports.defineTags = function(dictionary) {
    // define tags here
    dictionary.defineTag('startuml', {
        canHaveName: true,
        mustHaveValue: true,
        /** define doclet for startuml to to catch all plat uml related definitions
         *
         *  @param {object} doclet latest doclet
         *  @param {object} tag new tag created
         */
        onTagged: function(doclet, tag) {
            if (!Array.isArray(doclet.plantUml)) doclet.plantUml = [];
            tag.srcFile = path.join(doclet.meta.path, doclet.meta.filename);
            tag.value.description = '@startuml\n' + tag.value.description + '\n@enduml';
            if (tag.value.name) {
                // check if really name is given - look for plantuml known file extensions
                let extension = path.extname(tag.value.name);
                logger.debug(logPrefix + 'found uml tag with file name extension ' + extension);
                switch (extension.toLowerCase()) {
                    case '.png':
                    case '.svg':
                    case '.eps':
                        tag.outFilePuml = path.join(myConfig.pathPuml, tag.value.name.replace(new RegExp(extension + '$'), '.puml'));
                        if (!path.isAbsolute(tag.outFilePuml)) {
                            tag.outFilePuml = path.join(process.cwd(), tag.outFilePuml);
                            logger.debug(logPrefix + 'new puml path not absolute - new is ' + tag.outFilePuml);
                        }
                        if (myConfig.pathImages) {
                            tag.imageFormat = extension.substr(1);
                            tag.outFileImage = path.join(myConfig.pathImages, tag.value.name);
                            if (!path.isAbsolute(tag.outFileImage)) {
                                tag.outFileImage = path.join(process.cwd(), tag.outFileImage);
                            }
                        }
                        doclet.plantUml.push(tag);
                        break;

                    case '.puml':
                        tag.imageFormat = myConfig.imageFormat;
                        if (myConfig.pathPuml) {
                            tag.outFilePuml = path.join(myConfig.pathPuml, tag.value.name);
                            if (!path.isAbsolute(tag.outFilePuml)) {
                                tag.outFilePuml = path.join(process.cwd(), tag.outFilePuml);
                            }
                        }
                        // create image file name with default format
                        if (myConfig.pathImages) {
                            tag.outFileImage = path.join(myConfig.pathImages, tag.value.name.replace(new RegExp(extension + '$'), '.' + myConfig.imageFormat));
                            if (!path.isAbsolute(tag.outFileImage)) {
                                tag.outFileImage = path.join(process.cwd(), tag.outFileImage);
                            }
                        }
                        doclet.plantUml.push(tag);
                        break;

                    default:
                        logger.warn(logPrefix + 'IGNORED: unknown image format "' + extension + '" or image name missing for @startuml tag at doclet starting line ' +
                            doclet.meta.lineno + ', file ' + tag.srcFile);
                }
            }
            else {
                logger.warn(logPrefix + 'IGNORED: image name missing for @startuml tag at doclet starting line ' + doclet.meta.lineno +
                    ', file ' + tag.srcFile);
            }

            logger.debug(logPrefix + 'startuml / onTagged: tag=' + JSON.stringify(tag));
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
            logger.debug(logPrefix + 'enduml / onTagged: tag=' + JSON.stringify(tag));
        }
    });
};
