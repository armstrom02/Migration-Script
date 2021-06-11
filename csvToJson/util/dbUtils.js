'use strict';
const mysql = require('mysql');

class dbUtil {


    // First you need to create a connection to the database
    // Be sure to replace 'user' and 'password' with the correct values
    createConnection() {
        this.con = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: "migration",
            charset: 'utf8mb4_general_ci'
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.con.connect((err) => {
                if (err) {
                    console.error('\nDatabase error connecting: ' + err.stack);
                    reject();
                    return;
                }
                console.log('\nDatabase connected as id ' + this.con.threadId);
                resolve();
            });
        })
    }

    end(callback) {
        return new Promise((resolve, reject) => {
            this.con.end((err) => {
                if (err) {
                    console.error('\nDatabase error ending: ' + err.stack);
                    reject();
                    return;
                }
                console.log('\nDatabase Ended');
                resolve();
            });
        })
    }

    createMessageInsertQuery(entry) {
        return `INSERT INTO messages (Message_ID, Conversation_ID, Segment, Direction, Status, Inbox, Message_date, Autoreply, Reaction_time, Resolution_time, Final_resolution, Handle_time, Response_time, Attributed_to, Assignee, Author, Contact_name, Contact_handle, Toward, Cc, Bcc, Extract, Tags, Message_API_ID, Conversation_API_ID, New_Conversation, First_response, Replies_to_resolve, Business_hours, Subject) VALUES ( ${entry.MessageID}, "${entry.ConversationID}", "${entry.Segment}", "${entry.Direction}", "${entry.Status}", "${entry.Inbox}", "${entry.Messagedate}", "${entry.Autoreply}", "${entry.Reactiontime}", "${entry.Resolutiontime}", "${entry.Finalresolution}", "${entry.Handletime}", "${entry.Responsetime}", "${entry.Attributedto}", "${entry.Assignee}", "${entry.Author}", "${entry.Contactname}", "${entry.Contacthandle}", "${entry.To}", "${entry.Cc}", "${entry.Bcc}", "${entry.Extract.replace(/\\/g, '')}", "${entry.Tags}", "${entry.MessageAPIID}", "${entry.ConversationAPIID}", "${entry.NewConversation}", "${entry.Firstresponse}", "${entry.Repliestoresolve}", "${entry.Businesshours}", "${entry.Subject}")`
    }

    updateConversationQuery(conversation, fields) {
        return `UPDATE CUSTOMERS SET ? WHERE Conversation_ID = ?`
    }


    createConversationQuery(entry) {
        return `INSERT INTO conversation (
            ticket_id,
            requester_email,
            subject,
            description,
            created_date,
            updated_date,
            inbox,
            status,
            assignee,
            contact_name,
            tags,
            source
            ) VALUES (
                "${entry.ConversationAPIID}", 
                "${entry.Contacthandle}", 
                "${entry.Subject}",
                "${entry.Extract.replace(/\\/g, '')}", 
                "${entry.Created_at}", 
                "${entry.Update_at}", 
                "${entry.Inbox}",
                "${entry.Status}", 
                "${entry.Attributedto || entry.Assignee || entry.Author}", 
                "${entry.Contactname}", 
                "${entry.Tags}", 
                "Migration"
                )`
    }


    makeMultipleEntryToDB(data) {
        let query = this.createMultipleMessageInsertQuery();
        this.con.query(query, [data], function (err, result) {
            if (err) throw err;
            console.log("Result: " + result);
        });
    }

    getDataFromDb(tableName, fields) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM ${tableName} WHERE ?`;
            this.con.query(sql, fields, (error, result) => {
                if (error) {
                    reject(error)
                    return;
                };
                result.length ? resolve(result) : resolve(null);
            });
        })
    }


    makeEntryToDB(data) {
        return new Promise((reslove, reject) => {
            let query = this.createConversationQuery(data);
            this.con.query(query, function (error, results) {
                if (error) {
                    reject(error);
                }
                reslove(results);
            });
        })
    }

    updateEntryToDB(tableName, ConversationAPIID, fields) {
        return new Promise((reslove, reject) => {
            this.con.query(`UPDATE ${tableName} SET ? WHERE ticket_id = ?`, [fields, ConversationAPIID], function (error, results) {
                if (error) {
                    reject(error);
                    throw error;
                }
                reslove(results);
            });
        })
    }
}


module.exports = new dbUtil();