"use strict";
let fs = require('fs');
const readline = require('readline');

let fileUtils = require("./util/fileUtils");
let stringUtils = require("./util/stringUtils");
let dbUtils = require("./util/dbUtils");


dbUtils.createConnection();

const newLine = /\r?\n/;
const defaultFieldDelimiter = ",";

class Migration {

  tableName = 'conversation';

  formatValueByType(active) {
    this.printValueFormatByType = active;
    return this;
  }

  fieldDelimiter(delimieter) {
    this.delimiter = delimieter;
    return this;
  }

  parseSubArray(delimiter = '*', separator = ',') {
    this.parseSubArrayDelimiter = delimiter;
    this.parseSubArraySeparator = separator;
  }

  encoding(encoding) {
    this.encoding = encoding;
    return this;
  }

  migrateCsvDataToDb(fileInputName, delimiter) {
    if (delimiter) {
      this.delimiter = delimiter;
    }
    this.ProcessCsvData(fileInputName);
  }

  async ProcessCsvData(fileInputName) {
    console.time('Processing Time');

    let conversationResult = await this.readlineByLine(fileInputName, this.encoding);
    await dbUtils.connect();
    await this.saveDataToDB(conversationResult);
    await dbUtils.end();

    console.log('\n')
    console.timeEnd('Processing Time');
  }

  async saveDataToDB(conversations) {
    let index = 0;
    let indexCreated = 0;
    let indexUpdated = 0;

    for (const property in conversations) {
      index++;
      try {
        await dbUtils.makeEntryToDB(conversations[property]);
        indexCreated++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          let data = await dbUtils.getDataFromDb(this.tableName, { 'Conversation_ID': conversations[property]['ConversationID'] });
          if (data) {
            let fields = {
              Data: this.mergeMessages(data[0]['Data'], conversations[property]['Extract']),
              Update_at: conversations[property]['Update_at']
            }
            await dbUtils.updateEntryToDB(this.tableName, conversations[property]['ConversationID'], fields);
            indexUpdated++
          }
        }
      }
      this.printProgress('Total Conversation', index);
    }
    console.log(`\nCreated : ${indexCreated} | Updated : ${indexUpdated}`);

    return;
  }

  mergeMessages(oldMessages, newMessages) {
    let totalMessage = [...new Set([...oldMessages.split('<br><br>'), ...newMessages.split('<br><br>')])];
    totalMessage.sort((a, b) => new Date(a.split(' | ')[0]) - new Date(b.split(' | ')[0]));
    return totalMessage.join('<br><br>');
  }


  async readlineByLine(fileInputName, encoding) {
    var readerStream = fs.createReadStream(fileInputName, {
      encoding
    })

    const rl = readline.createInterface({
      input: readerStream,
      crlfDelay: Infinity
    });

    let index = 0
    let fieldDelimiter = this.getFieldDelimiter();
    let headers;

    let rateAbove200 = 0;

    let conversationResult = {};
    let impactedConversation = {};
    let inbox = {};

    for await (const line of rl) {

      if (index === 0) {
        headers = line.split(fieldDelimiter);
      } else {
        let currentLine = line.split(fieldDelimiter);
        if (stringUtils.hasContent(currentLine)) {
          let jsonObject = this.buildJsonResult(headers, currentLine);

          if(inbox[jsonObject.Inbox] === undefined){
            inbox[jsonObject.Inbox] = {totalMessage:1,incompleteMessage:0, percentage: 0}
          }else{
            inbox[jsonObject.Inbox]['totalMessage'] ++;
          }

          if(jsonObject['Extract'].split('<br>')[1].length >= 200){

            if(!impactedConversation[jsonObject.ConversationID]){
              impactedConversation[jsonObject.ConversationID] = true; 
            }

            if(inbox[jsonObject.Inbox]){
              inbox[jsonObject.Inbox]['incompleteMessage'] ++;
              inbox[jsonObject.Inbox]['percentage'] = +(inbox[jsonObject.Inbox]['incompleteMessage'] / inbox[jsonObject.Inbox]['totalMessage'] * 100).toFixed(2);
            }

            rateAbove200 ++;
          }

          if (conversationResult[jsonObject.ConversationID]) {
            conversationResult[jsonObject.ConversationID] = this.mergeMessageToConversation(conversationResult[jsonObject.ConversationID], jsonObject)
          } else {
            conversationResult[jsonObject.ConversationID] = jsonObject;
          }
          // console.log( jsonObject )

        }


        this.printProgress('Line fetched', index + 1);
      // break;

      }


      index++;
    }

    console.log('\nIncomplete Message :',rateAbove200 )
    console.log('Total Conversation :', Object.keys(conversationResult).length)
    console.log('Incomplete Conversation :', Object.keys(impactedConversation).length)
    console.log('Inbox Effected')
    console.table(inbox)
    return conversationResult;
  }


  mergeMessageToConversation(conversation, message) {
    conversation['Extract'] = conversation['Extract'] + '<br><br>' + message['Extract'];
    conversation['Update_at'] = message['Messagedate'];
    return conversation;
  }

  getFieldDelimiter() {
    if (this.delimiter) {
      return this.delimiter;
    }
    return defaultFieldDelimiter;
  }

  buildJsonResult(headers, currentLine) {
    let jsonObject = {};
    for (let j = 0; j < headers.length; j++) {
      let propertyName = stringUtils.trimPropertyName(headers[j]);
      let value = currentLine[j];

      if (this.isParseSubArray(value)) {
        value = this.buildJsonSubArray(value);
      }

      if (this.printValueFormatByType && !Array.isArray(value)) {
        value = stringUtils.getValueFormatByType(currentLine[j]);
      }

      if (typeof value === "string") {
        value = value.replace(/"/g, "");
      }

      jsonObject[propertyName] = value;
    }

    jsonObject['Extract'] = `${jsonObject['Messagedate']} | Contactname : ${jsonObject.Contactname} | ContactHandle : ${jsonObject.Contacthandle} | To : ${jsonObject.To} | Assignee : ${jsonObject.Author ||  jsonObject.Assignee ||  jsonObject.Attributedto}<br>${jsonObject['Extract']}`;
    jsonObject['Created_at'] = jsonObject['Messagedate'];
    jsonObject['Update_at'] = jsonObject['Messagedate'];

    return jsonObject
  }

  printProgress(text, progress) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${text}: ` + progress);
  }

  buildJsonSubArray(value) {
    let extractedValues = value.substring(
      value.indexOf(this.parseSubArrayDelimiter) + 1,
      value.lastIndexOf(this.parseSubArrayDelimiter)
    );
    extractedValues.trim();
    value = extractedValues.split(this.parseSubArraySeparator);
    if (this.printValueFormatByType) {
      for (let i = 0; i < value.length; i++) {
        value[i] = stringUtils.getValueFormatByType(value[i]);
      }
    }
    return value;
  }

  isParseSubArray(value) {
    if (this.parseSubArrayDelimiter) {
      if (value && (value.indexOf(this.parseSubArrayDelimiter) === 0 && value.lastIndexOf(this.parseSubArrayDelimiter) === (value.length - 1))) {
        return true;
      }
    }
    return false;
  }

}

module.exports = new Migration();
