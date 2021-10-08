const express = require( 'express' );
const formData = require( 'express-form-data' );
const bodyParser = require( 'body-parser' );
const os = require( 'os' );
const mysql = require( 'mysql' );
const createConn = require( './model/createConn.js' );
const authData = require( './model/authData.js' );
const handlers = require( './callbacks/handlers.js' );

const app = express();
app.set( 'port', process.env.PORT || 3000 );

app.use(bodyParser.urlencoded( { extended:true } ) );
app.use( formData.parse( 
    { 
      uploadDir: os.tmpdir(), 
      autoClean: true // для удаления пустых файлов
    } 
) );
app.use( formData.format() );

// Регистрация
app.post( '/login', ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
        'INSERT INTO users( name, surname, login, password ) VALUES( ?, ?, ?, ? )', 
        [ req.body.name, req.body.surname, req.body.login, req.body.password ], 
        handlers.closeConnSendRes( conn, res ) 
    );
} );

// Создание канала
app.post('/create-channel', ( req, res) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
        'INSERT INTO channels( name, image, author ) VALUES( ?, ?, ? )',
        [ req.body.name, `LOAD_FILE(${req.files.image.path})`, req.body.author ],
        handlers.closeConnSendRes( conn, res ) 
    );
} );

// Создание статьи
app.post('/create-article', ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
        'INSERT INTO articles( channel, theme, title, article ) VALUES( ?, ?, ?, ? )',
        [ req.body.channel, req.body.theme, req.body.title, req.body.article ],
        handlers.closeConnSendRes( conn, res ) 
    );
} );

// Удаление статьи
app.delete('/delete-article/:id', ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
        'DELETE FROM articles WHERE id = ?',
        [ req.params.id ],
        handlers.closeConnSendRes( conn, res ) 
    );
} );

// Получение статьи
app.get('/get-article/:id', ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(      
        `SELECT a.date_of_creation as date_of_creation_article, a.theme, a.title, a.article, 
        c.name_channel, c.image, u.name as name_author, u.surname as surname_author,  
        com.date_of_creation as date_of_creation_comment,us.name as name_commentator, 
        us.surname as surname_commentator, com.comment
        FROM articles as a
        JOIN channels as c ON a.channel = c.id
        JOIN comments as com ON a.id = com.article
        JOIN users as u ON c.author = u.id
        JOIN users as us ON com.user=us.id                 
        WHERE a.id = ?`,
        [ req.params.id ],
        handlers.closeConnSendRes( conn, res ) 
    );
} );

// Получение информации о канале
app.get('/get-channel/:id', ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
        `SELECT  name_channel, image, c.date_of_creation as date_of_creation_channel, 
        name, surname, theme, title, article, a.date_of_creation as date_of_creation_article
        FROM channels as c      
        JOIN articles as a ON c.id = a.channel
        JOIN users as u ON c.author = u.id
        WHERE c.id = ?`,
        [ req.params.id ],
        handlers.closeConnSendRes( conn, res ) 
    );
} );

// Получение статей по теме
app.get('/get-channel/:theme', ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
        `SELECT theme, title, article, a.date_of_creation, name_channel, image
        FROM articles as a JOIN channels as c ON a.channel = c.id
		WHERE MATCH( theme ) AGAINST( ? );`,
        [ req.params.theme ],
        handlers.closeConnSendRes( conn, res ) 
    );
} );

app.listen( app.get( 'port' ), () => {
    console.log( 'APP started on port', app.get( 'port' ) );
});

module.exports = app;
