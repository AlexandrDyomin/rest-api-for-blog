const express = require( 'express' );
const formData = require( 'express-form-data' );
const bodyParser = require( 'body-parser' );
const os = require( 'os' );
const fs = require( "fs" );
const mysql = require( 'mysql' );
const createConn = require( './model/createConn.js' );
const authData = require( './model/authData.js' );
const promisifyQuery = require( './model/promisifyQuery.js' );
const queries = require( './model/queries.js' );
const promisifyReadFile = require( './model/promisifyReadFile.js' );
const handlers = require( './callbacks/handlers.js' );

let { queryOnArticle,
  queryOnComments,
  queryOnRegistration,
  queryOnCreateChannel,
  queryOnCreateArticle,
  queryOnDeleteArticle,
  queryOnInfoChannel,
  queryOntArticlesOnTopic
} = { ...queries };

const app = express();
app.set( 'port', process.env.PORT || 3000 );

app.use( bodyParser.urlencoded( { extended:true } ) );
app.use( 
  formData.parse(
    { 
      uploadDir: os.tmpdir(), 
      autoClean: true // для удаления пустых файлов
    } 
  ) 
);
app.use( formData.format() );

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', [ '*' ]);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Регистрация пользователя
app.post( 
  '/login', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      queryOnRegistration, 
      [ req.body.name, req.body.surname, req.body.login, req.body.password ], 
      handlers.closeConnSendRes( conn, res ) 
    );
  } 
);

// создание канала
app.post(
  '/create-channel',
  ( req, res ) => {
    // читаем файл картинки
    let path = req.files.image.path;
    let promiseReadFile = promisifyReadFile( fs, path );
    // устанавливаем соединение с БД
    let conn = createConn( mysql, authData, handlers.processErrConn );
    // сохраняем данные в БД
    promiseReadFile.then( 
      ( data ) => {
        conn.query(
          queryOnCreateChannel,
          [ req.body.name, data, req.body.author ],
          handlers.closeConnSendRes( conn, res ) 
        );
      } 
    );
  }
);

// Создание статьи
app.post(
  '/create-article', 
  ( req, res ) => {
    console.log(req.files)





    // const conn = createConn( mysql, authData, handlers.processErrConn );
    // conn.query(
    //   queryOnCreateArticle,
    //   [ req.body.channel, req.body.theme, req.body.title, req.body.article ],
    //   handlers.closeConnSendRes( conn, res ) 
    // );
  } 
);

// Удаление статьи
app.delete(
  '/delete-article/:id', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      queryOnDeleteArticle,
      [ req.params.id ],
      handlers.closeConnSendRes( conn, res ) 
    );
  } 
);

// Получение информации о канале
app.get(
  '/get-channel/:id', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      queryOnInfoChannel,
      [ req.params.id ],
      handlers.closeConnSendRes( conn, res ) 
    );
  } 
);

// Получение статей по теме
app.get(
  '/get-channel/:theme', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      queryOntArticlesOnTopic,
      [ req.params.theme ],
      handlers.closeConnSendRes( conn, res ) 
    );
  }
);

// запрос на получение статьи и комментарий к ней
app.get(
  '/get-article/:id', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );     
    Promise.all( 
      [
        promisifyQuery( conn, queryOnArticle, req.params.id ),
        promisifyQuery( conn, queryOnComments, req.params.id )
      ] 
    ).then( 
      results => {
        conn.end();
        res.status( 200 ).send( [ ...results[0], ...results[1] ] );
      } 
    );
  } 
);

app.listen( app.get( 'port' ), () => {
  console.log( 'APP started on port', app.get( 'port' ) );
  }
);