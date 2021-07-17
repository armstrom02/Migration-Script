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
  con.query('DROP TABLE conversation;');
  createTable()
});

function createTable() {
  con.query(`CREATE TABLE conversation (
    ticket_id varchar(400),
    requester_email varchar(400),
    subject varchar(400),
    description longtext,
    created_date varchar(400),
    updated_date varchar(400),
    inbox varchar(400),
    agent_email varchar(400),
    priority varchar(400),
    status varchar(400),
    source varchar(400),
    type varchar(400),
    assignee varchar(400),
    contact_name varchar(400),
    tags varchar(400),
    migration_no varchar(400),
    PRIMARY KEY (ticket_id)
  ) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;`
    , (err, data) => {
      if (err) throw err;
      console.log('Database created');
      console.log(data);
      con.end((err) => {
        console.log('Connection end')
      });
    });
}
