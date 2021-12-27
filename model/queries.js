let queryOnArticle = `SELECT a.date_of_creation as date_of_creation_article, 
a.theme, a.title, a.article, c.name_channel, c.image, u.name as name_author, 
u.surname as surname_author       
FROM articles as a
JOIN channels as c ON a.channel = c.id
JOIN users as u ON c.author = u.id             
WHERE a.id = ?`;

let queryOnComments =  `SELECT com.date_of_creation as date_of_creation_comment, 
us.name as name_commentator, us.surname as surname_commentator, com.comment
FROM comments as com
JOIN users as us ON com.user=us.id                 
WHERE com.article = ?`;

const queryOnRegistration = `INSERT INTO users( name, surname, login, password ) 
VALUES( ?, ?, ?, ? )`;

const queryOnCreateChannel = 'INSERT INTO channels( name_channel, image, author ) VALUES( ?, ?, ? )';

const queryOnCreateArticle = `INSERT INTO articles( channel, theme, title, article ) 
VALUES( ?, ?, ?, ? )`;

const queryOnDeleteArticle = 'DELETE FROM articles WHERE id = ?';

const queryOnInfoChannel = `SELECT  name_channel, image, 
c.date_of_creation as date_of_creation_channel, name, surname, theme, 
title, article, a.date_of_creation as date_of_creation_article
FROM channels as c      
JOIN articles as a ON c.id = a.channel
JOIN users as u ON c.author = u.id
WHERE c.id = ?`;

const queryOntArticlesOnTopic = `SELECT theme, title, article, a.date_of_creation, 
name_channel, image
FROM articles as a JOIN channels as c ON a.channel = c.id
WHERE MATCH( theme ) AGAINST( ? )`;

const queries = {
  queryOnArticle,
  queryOnComments,
  queryOnRegistration,
  queryOnCreateChannel,
  queryOnCreateArticle,
  queryOnDeleteArticle,
  queryOnInfoChannel,
  queryOntArticlesOnTopic
};

module.exports = queries;

