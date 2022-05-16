const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')

/**
 * 分析单独模块
 * @param {*}file
 */
function getModuleInfo(file) {
    // 读取文件
    const body = fs.readFileSync(file, 'utf-8')
    // console.log(body)
    //第一个问题:有哪些依赖被引入了
    //转换语法树
    //过程就是:代码字符串str => 对象(AST) =>对象遍历解析
    //类比vue:模板字符串=> AST =>render
    const ast = parser.parse(body, {
        sourceType: 'module'//指的是ES Module
    })
    // console.log(ast)
    const deps = {}
    traverse(ast, {
        // vistor
        ImportDeclaration({ node }) {
            //遇到import节点的时候
            const dirname = path.dirname(file)
            //在windows下join拼接的是反斜杠，我们要加上转换才能正常
            const abspath = './' + path.join(dirname, node.source.value).replace(/\\/g, '/')
            // console.log(abspath)
            // 收集依赖
            deps[node.source.value] = abspath
        }
    })

    //利用babel将ast转译为es5的代码
    const { code } = babel.transformFromAst(ast, null, {
        presets: ["@babel/preset-env"]
    })

    const moduleInfo = { file, deps, code }
    //导出入口文件和依赖项还有es5的代码
    return moduleInfo
}

// const info = getModuleInfo("./src/index.js")
// // getModuleInfo('./src/index.js')
// console.log(info)

/**
 * 解析模块
 */
function parseModules(file) {
    //获取入口文件的依赖和信息
    const entry = getModuleInfo(file)
    //把入口文件的信息存入数组
    const temp = [entry]
    //依赖关系图
    const depsGraph = {}

    getDeps(temp, entry)

    temp.forEach(info => {
        //整理信息
        depsGraph[info.file] = {
            deps: info.deps,
            code: info.code
        }
    })

    return depsGraph
}

/**
 * 获取依赖,因为入口文件所依赖的文件本身也可能存在依赖，所以需要
 * 不断向下查询依赖直到没有依赖为止,在这个过程中也顺便把依赖项
 * 的代码转成了es5
 */
function getDeps(temp, { deps }) {
    //遍历每一个依赖文件
    Object.keys(deps).forEach(key => {
        const child = getModuleInfo(deps[key])
        temp.push(child)
        //递归向深处遍历，直到依赖全部加载
        getDeps(temp, child)
    })
}

//组合boundle原型和我们获取的依赖关系图
function bundle(file) {
    const depsGraph = JSON.stringify(parseModules(file))
    return `(function (graph) {
            function require(file) {
                function absRequire(relPath) {
                    return require(graph[file].deps[relPath])
                }
                var exports = {};
                (function (require, exports, code) {
                    eval(code)
                })(absRequire, exports, graph[file].code)
                return exports
            }
            require('${file}')
        })(${depsGraph})`
}

const content = bundle('./src/index.js')

//创建dist文件夹，存放bundle.js
!fs.existsSync('./dist') && fs.mkdirSync('./dist')
fs.writeFileSync('./dist/bundle.js', content)