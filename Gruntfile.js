module.exports = function(grunt) {
  grunt.initConfig({

    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    nodemon: {
      dev: {
        script: 'index.js',
        options: {
          ignore: ['node_modules/','src/','public/'],
          nodeArgs: ['--debug'],
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
            nodemon.on('restart', function () {
              setTimeout(function() {
                require('fs').writeFileSync('.rebooted', 'rebooted');
              }, 2000);
            });
          }
        }
      }
    },
    
    watch: {
      dev: {
        files: ['.rebooted', './public/*'],
        options: {
          livereload: {
            port: 35728
          }
        }
      },
      js: {
        files: ['./src/*.js', './lib/*.js'],
        tasks: ['browserify']
      },
      css: {
        files: ['./src/*.less'],
        tasks: ['less']
      },
      html: {
        files: ['./src/*.html'],
        tasks: ['htmlmin']
      }
    },

    browserify: {
      dev: {
        src: './src/main.js',
        dest: './public/main.js'
      }
    },
    less: {
      dev: {
        options: {
          paths: ["./"]
        },
        files: {
          'public/style.css': 'src/style.less'
        }
      }
    },
    htmlmin: {
      dev: {
        files: [{
          expand: true,
          cwd: './src/',
          src: '**/*.html',
          dest: './public/'
        }]
      }
    }

  });

  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-less');


  grunt.registerTask('default', ['browserify','less','htmlmin','concurrent']);

};
