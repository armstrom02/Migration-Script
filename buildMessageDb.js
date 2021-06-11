const mysql = require('mysql');

// First you need to create a connection to the database
// Be sure to replace 'user' and 'password' with the correct values
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
});

con.connect((err) => {
  if (err) {
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

con.query('USE migration', (err, result) => {
  if (err) {
    con.query('CREATE DATABASE migration CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;');
    con.query('USE migration');
    createTable()
    return;
  }
  con.query('DROP TABLE messages;');
  createTable()
});

function createTable() {
  con.query('CREATE TABLE messages ( Message_ID varchar(200), Conversation_ID varchar(200), Segment varchar(200), Direction varchar(200), Status varchar(200), Inbox varchar(200), Message_date varchar(200), Autoreply varchar(200), Reaction_time varchar(200), Resolution_time varchar(200), Final_resolution varchar(200), Handle_time varchar(200), Response_time varchar(200), Attributed_to varchar(200), Assignee varchar(200), Author varchar(200), Contact_name varchar(200), Contact_handle varchar(200), Toward varchar(200), Cc varchar(400), Bcc varchar(200), Extract longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL , Tags varchar(200), Message_API_ID varchar(200), Conversation_API_ID varchar(200), New_Conversation varchar(200), First_response varchar(200), Replies_to_resolve varchar(200), Business_hours varchar(200), Subject varchar(200)) ENGINE=InnoDB  DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;'
    , (err, data) => {
      if (err) throw err;
      console.log('Data received from Db:');
      console.log(data);
    });
  con.end((err) => {
    console.log('Connection end')
  });
}



