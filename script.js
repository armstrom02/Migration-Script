let csvToJson = require('./csvToJson');

// csvToJson.utf8Encoding().migrateCsvDataToDb('./data/data_71377.csv', ';');
csvToJson.utf8Encoding().migrateCsvDataToDb('./data/data_big.csv', ';');
// csvToJson.utf8Encoding().migrateCsvDataToDb('./data/data_month.csv', ',');
// csvToJson.utf8Encoding().migrateCsvDataToDb('./data/example.csv',',');

// Merge Data Case
// csvToJson.utf8Encoding().migrateCsvDataToDb('./data/mergeData/data1.csv',';');
// csvToJson.utf8Encoding().migrateCsvDataToDb('./data/mergeData/data2.csv',';');


