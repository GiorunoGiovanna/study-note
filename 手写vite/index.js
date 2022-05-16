const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const complierSFC = require('@vue/compiler-sfc')
const compilerDOM = require('@vue/compiler-dom')

app.use((req, res) => {
    //组合拼接出请求文件的绝对地址
    const url = req.url
    const query = req.query
    if (url === '/') {
        let body = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8')
        res.send(body)
    } else if (url.endsWith('js')) {
        // js文件加载处理
        const p = path.join(__dirname, url)
        let body = rewriteImport(fs.readFileSync(p, 'utf-8'))
        res.setHeader("Content-Type", "application/javascript;charset=utf-8")
        res.send(body)
    } else if (url.startsWith('/@modules/')) {
        //模块加载处理
        //取出裸模块名称
        const moduleName = url.replace('/@modules/', '')
        //去node_modules目录中找
        const prefix = path.join(__dirname, "./node_modules", moduleName)
        // console.log(prefix)
        //package.json中获取module字段,这个地方就是打包好的依赖
        const module = require(prefix + "/package.json").module
        //拼接完整的真实依赖地址
        const filePath = path.join(prefix, module)
        //读取这个真实依赖
        const ret = fs.readFileSync(filePath, "utf-8")
        res.setHeader("Content-Type", "application/javascript;charset=utf-8")
        res.send(rewriteImport(ret))
    } else if (url.indexOf('.vue') > -1) {
        //SFC解析
        //读取vue文件，解析为js
        const p = path.join(__dirname, url.split('?')[0])
        //通过vue模板编译工具转换为AST
        const ret = complierSFC.parse(fs.readFileSync(p, 'utf8'))
        if (!query.type) {
            //获取脚本部分的内容
            const scriptContent = ret.descriptor.script.content
            //替换默认导出（export default）为一个常量，方便后续修改
            const script = scriptContent.replace('export default ', 'const __script = ')
            res.setHeader("Content-Type", "application/javascript;charset=utf-8")
            // 重写依赖路径，防止依赖中又有裸模版依赖
            // 在首次编译的时候，为每一个vue模板挂载上render方法
            let body = `
            ${rewriteImport(script)}
            import { render as __render } from '${url}?type=template'
            __script.render = __render
            export default __script`
            res.send(body)
            // console.log(body)
            // console.log('query', req.query)
        } else if (query.type === 'template') {
            //获取编译过的AST中的模板内容
            const tpl = ret.descriptor.template.content
            //编译为虚拟DOM，此时浏览器就能理解了
            const render = compilerDOM.compile(tpl, { mode: 'module' }).code
            res.setHeader("Content-Type", "application/javascript;charset=utf-8")
            let body = rewriteImport(render)
            // console.log('body', body)
            res.send(body)
        }
    }
})


//裸模块重写
// import xx from 'vue'
// import xx from '/@modules/vue'
function rewriteImport(content) {
    return content.replace(/from ['"](.*)['"]/g, (s1, s2) => {
        if (s2.startsWith('/') || s2.startsWith('./') || s2.startsWith('../')) {
            return s1
        } else {
            //说明是裸模块，进行替换
            return ` from '/@modules/${s2}'`
        }
    })
}


app.listen(8081, () => {
    console.log('http server running at http://127.0.0.1:8081')
})