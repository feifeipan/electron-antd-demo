var grunt=require('grunt');

//配置
grunt.config.init({
    pkg: grunt.file.readJSON('package.json'),
    'create-windows-installer': {
        x64:{
            authors:'Ares',
            projectUrl:'',
            appDirectory:'./release/Ares-win32-x64',//要打包的输入目录
            outputDirectory:'./release-win32',//grunt打包后的输出目录
            exe:'Ares.exe',
            description:'Ares GUI',
            // setupIcon:"./app/assets/icon/jxb.ico",
            noMsi:true
        }
    }
});

//加载任务
grunt.loadNpmTasks('grunt-electron-installer');

//设置为默认
grunt.registerTask('default', ['create-windows-installer']);