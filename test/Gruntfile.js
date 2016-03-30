module.exports = function (grunt) {
    'use strict';

    var debugTasks = ['browserify:script_web', 'browserify:script_external', 'cssmin:dist', 'htmlmin:dist'],
        productionTasks = debugTasks.concat('uglify:dist');
    var serverTask = ['connect'];

    grunt.registerTask('build-Debug', debugTasks);
    grunt.registerTask('build-Release', productionTasks);
    grunt.registerTask('build-Production', productionTasks);
    grunt.registerTask('connect', serverTask);

    var externalModules = [
        "react",
        "react-dom",
        "request-promise"
    ];

    var buildTargetDirectory = 'dist/';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            script_external: {
                // External modules that don't need to be constantly re-compiled
                src: ['.'],
                dest: buildTargetDirectory + 'external.js',
                options: {
                    browserifyOptions: {
                        debug: true
                    },
                    alias: externalModules.map(function (mod) {
                        return mod + ':'
                    })
                }
            },
            script_web: {
                options: {
                    transform: [["babelify", {presets: ["es2015", "stage-0", "react"]}]],
                    browserifyOptions: {
                        debug: true
                    },
                    external: externalModules
                },
                src: 'js/index.js',
                dest: buildTargetDirectory + 'index.js'
            }
        },
        uglify: {
            dist: {
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true
                },
                files: {
                    //[buildTargetDirectory + 'index.js']: [buildTargetDirectory + 'index.js'],
                }
            }
        },
        cssmin: {
            dist: {
                options: {
                    keepSpecialComments: 0,
                    sourceMap: true,
                    sourceMapInlineSources: true
                },
                files: [{
                    expand: true,
                    cwd: 'css',
                    src: ['*.css'],
                    dest: buildTargetDirectory
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: false,
                    collapseWhitespace: true
                },
                files: [{
                    expand: true,
                    src: '*.html',
                    dest: buildTargetDirectory
                }]
            }
        },
        watch: {
            scripts_browser: {
                files: ['js/**/*.jsx', 'js/**/*.js'],
                tasks: ['browserify:script_web'],
                options: {
                    spawn: false
                }
            },
            styles_browser: {
                files: ['css/**/*.css'],
                tasks: ['cssmin'],
                options: {
                    spawn: false
                }
            },
            html_browser: {
                files: ['*.html'],
                tasks: ['htmlmin'],
                options: {
                    spawn: false
                }
            }
        },
        connect: {
        server: {
            options: {
                port: 9000,
                    hostname: 'localhost',
                    keepalive: true
            }
        }
    }


});

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-connect');
};