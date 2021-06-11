"use strict";
let fs = require('fs');
const readline = require('readline');

let fileUtils = require("./util/fileUtils");
let stringUtils = require("./util/stringUtils");
let dbUtils = require("./util/dbUtils");

const readMoreEndPoint = 'https://oneview.ixigo.com/migration';
const inMessageSeprator = '<br>';
const messageSeprator = '<br><br>';


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

          let data = await dbUtils.getDataFromDb(this.tableName, { 'ticket_id': conversations[property]['ConversationAPIID'] });
          if (data) {
            let fields = {
              description: this.mergeMessages(data[0]['description'], conversations[property]['Extract']),
              updated_date: conversations[property]['Update_at']
            }

            // console.log(fields, conversations[property]['ConversationAPIID'], data);
            // break
            await dbUtils.updateEntryToDB(this.tableName, conversations[property]['ConversationAPIID'], fields);
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
    let totalMessage = [...new Set([...oldMessages.split(messageSeprator), ...newMessages.split(messageSeprator)])];
    totalMessage.sort((a, b) => new Date(a.split(' | ')[0]) - new Date(b.split(' | ')[0]));
    return totalMessage.join(messageSeprator);
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

    let errorMessage = 0;

    for await (const line of rl) {

      if (index === 0) {
        headers = line.split(fieldDelimiter);
      } else {
        let currentLine = line.split(fieldDelimiter);
        if (stringUtils.hasContent(currentLine)) {
          let jsonObject = this.buildJsonResult(headers, currentLine);

          if (inbox[jsonObject.Inbox] === undefined) {
            inbox[jsonObject.Inbox] = { totalMessage: 1, incompleteMessage: 0, percentage: 0 }
          } else {
            inbox[jsonObject.Inbox]['totalMessage']++;
          }

          if (jsonObject['Extract'].split(inMessageSeprator)[1].length >= 200) {

            if (!impactedConversation[jsonObject.ConversationAPIID]) {
              impactedConversation[jsonObject.ConversationAPIID] = true;
            }

            if (inbox[jsonObject.Inbox]) {
              inbox[jsonObject.Inbox]['incompleteMessage']++;
              inbox[jsonObject.Inbox]['percentage'] = +(inbox[jsonObject.Inbox]['incompleteMessage'] / inbox[jsonObject.Inbox]['totalMessage'] * 100).toFixed(2);
            }

            rateAbove200++;
          }


          if (conversationResult[jsonObject.ConversationAPIID]) {
            conversationResult[jsonObject.ConversationAPIID] = this.mergeMessageToConversation(conversationResult[jsonObject.ConversationAPIID], jsonObject)
          } else {
            conversationResult[jsonObject.ConversationAPIID] = jsonObject;
          }

        }
        this.printProgress('Line fetched', index + 1);
      }


      index++;
    }

    console.log('\nIncomplete Message :', rateAbove200)
    console.log('Total Conversation :', Object.keys(conversationResult).length)
    console.log('Incomplete Conversation :', Object.keys(impactedConversation).length)
    console.log('Inbox Effected')
    console.table(inbox)

    console.log('errorFields',errorMessage);
    return conversationResult;
  }


  mergeMessageToConversation(conversation, message) {
    conversation['Extract'] = conversation['Extract'] + messageSeprator + message['Extract'];
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

    let assignee = jsonObject['Attributedto'] || jsonObject['Assignee'] || jsonObject['Author'] || 'none';

    let readMoreLink = this.getReadMoreLink(jsonObject['ConversationAPIID'], jsonObject['MessageAPIID']);

    jsonObject['Extract'] = `${jsonObject['Messagedate']} | Assignee : ${assignee} | Direction : ${jsonObject['Direction']}${readMoreLink}${inMessageSeprator}${jsonObject['Extract']}`;
    jsonObject['Created_at'] = jsonObject['Messagedate'];
    jsonObject['Update_at'] = jsonObject['Messagedate'];

    return jsonObject
  }

  getReadMoreLink(conversationId, messageId) {
    if (!conversationId || !messageId) {
      return '';
    }
    const url = `${readMoreEndPoint}?cnvID=${conversationId}&msgId=${messageId}`;
    const readMoreText = ` | <a href='${url}' target='_blank'>Read More</a>`;
    return readMoreText
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
