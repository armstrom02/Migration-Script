

let str = '38502090309,17298271749,1,"Inbound","Open","Support","2021-04-01 08:27:24",0,"","",0,"","","","","","Juspay","no-reply@juspay.in","support@ixigo.com, puneet@ixigo.com, satinder.kumar@ixigo.com, payment-support@ixigo.com, ishan.b@ixigo.com","harshit.khare@juspay.in, udit.khandelwal@juspay.in","","Please find successful/failed/pending refunds from Last 7 Days","","msg_hor5f0l","cnv_7y2xzwl",1,0,"",1,"Juspay Reports: ixigo Refunds Report from2021-03-25"'

function spliter(line, fieldDelimiter) {
    let correctArr = [];
    let arrStr = line.split(fieldDelimiter);

    let isString = false;
    let value = ''

    for (const element of arrStr) {
        if (isString) {
            value = `${value}` + `${fieldDelimiter}${element}`;
            if (element.endsWith('"')) {
                correctArr.push(value);
                value = '';
                isString = false;
            }
            continue;
        }

        if (element.startsWith('"') && !element.endsWith('"')) {
            value = element
            isString = true;
        } else {
            correctArr.push(element);
        }
    }
    return correctArr;
}

let arr = spliter(str, ',');

console.log(arr);



// function spliter(line,fieldDelimiter){
//     let arrstr = [];
//     let str = '';
//     let isString = false;

//     for (const c of line) {
//         if(c === '"'){
//             if( !isString){
//                 isString = true;
//                 continue;
//             }else{
//                 arrstr.push(str);
//                 str = '';
//                 continue;
//             }
//         }
//         if(c === fieldDelimiter && !isString){
//             arrstr.push(str);
//             str = '';
//             continue;
//         }
//         str = str + c;
//     }


//    return arrstr;
// }