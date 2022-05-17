/**
 * 食用方法:修改下面三个参数就可以进行替换
 */

const fs = require('fs')
const dialog = require('dialog')

//等待被修改的字符串
let toBeChange = 'http'
//用于替换的字符串
let toChange = 'https'
//指定文件的绝对地址
let dirName = 'D:\\学习笔记\\手写\\try'


// //指定输入输出流的格式
// process.stdin.setEncoding('utf8');
// process.stdout.setEncoding('utf8')
// function readlineSync() {
//     return new Promise((resolve, reject) => {
//         process.stdin.resume();
//         process.stdin.on('data', function (data) {
//             process.stdin.pause(); // stops after one line reads
//             resolve(data);
//         });
//     });
// }
// async function main() {
//     process.stdout._write('请输入需要批量转换的文件夹绝对地址\n')
//     let inputLine1 = await readlineSync();
//     process.stdout._write('请输入需要被替换掉的字符\n')
//     let inputLine2 = await readlineSync();
//     process.stdout._write('请输入需要替换进去的字符\n')
//     let inputLine3 = await readlineSync();
//     dirName = inputLine1;
//     toChange = inputLine2;
//     toBeChange = inputLine3;
// }
// main();



//输入模式,0:只对图床地址生效（默认），1:全局修改
const inputMode = 0

//构造正则
const reg = new RegExp(`${toBeChange}`, 'g')

const files = fs.readdirSync(dirName)
files.forEach((file, index) => {
    // 筛选markdown文件
    if (file.includes('.md')) {
        //原理，取出md文件转换为字符串进行正则替换，然后再将替换过的文字写回原文件
        let content = fs.readFileSync(file, 'utf-8')
        if (inputMode === 0) {
            //思路：先把所有的url地址找到，存起来，供修改
            //修改完成后再替换掉对应的url
            const arr = [...content.matchAll(/(?<=\!\[.*\]\().*(?=\))/g)]
            // 换好的数组
            let arr2 = arr.map(m => m[0].replace(reg, toChange))
            //计数器
            let count = 0
            content = content.replace(/(?<=\!\[.*\]\().*(?=\))/g, (match) => {
                return arr2[count++]
            })
            fs.writeFileSync(file, content)
        } else if (inputMode === 1) {
            content = content.replace(reg, toChange)
            fs.writeFileSync(file, content)
        }
    }
})


//todo 获取用户输入
//todo 弹窗获取用户输入