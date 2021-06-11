'use strict';

let fs = require('fs');
const readline = require('readline');

class FileUtils {

    readFile(fileInputName, encoding) {
        return fs.readFileSync(fileInputName, encoding).toString();
    }



    readLargeFile(fileInputName, encoding) {
        return new Promise((resolve, reject) => {
            var data = ''
            let index = 0
            var readerStream = fs.createReadStream(fileInputName, {
                encoding
            })

            readerStream.on('data', function (chunk) {
                data += chunk
                index++;

                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write('chunk : ' + index);
            })

            readerStream.on('end', function () {
                console.log('\n')
                resolve(data);
            })

            readerStream.on('error', function (err) {
                reject(err);
                console.log(err.stack)
            })

        })
    }

    writeFile(json, fileOutputName) {
        fs.writeFile(fileOutputName, json, function (err) {
            if (err) {
                throw err;
            } else {
                console.log('File saved: ' + fileOutputName);
            }
        });
    }

}
module.exports = new FileUtils();
