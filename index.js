const express = require( 'express' );
const formData = require( 'express-form-data' );
const bodyParser = require( 'body-parser' );
const os = require( 'os' );
const fs = require( "fs" );
const path = require( "path" );
const mysql = require( 'mysql' );
const createConn = require( './model/createConn.js' );
const authData = require( './model/authData.js' );
const handlers = require( './callbacks/handlers.js' );

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
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Регистрация
app.post( 
  '/login', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      'INSERT INTO users( name, surname, login, password ) VALUES( ?, ?, ?, ? )', 
      [ req.body.name, req.body.surname, req.body.login, req.body.password ], 
      handlers.closeConnSendRes( conn, res ) 
    );
  } 
);

// Создание канала
app.post(
  '/create-channel', 
  ( req, res) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      'INSERT INTO channels( name, image, author ) VALUES( ?, ?, ? )',
      [ req.body.name, `LOAD_FILE(${req.files.image.path})`, req.body.author ],
      handlers.closeConnSendRes( conn, res ) 
    );
  } 
);

// Создание статьи
app.post(
  '/create-article', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      'INSERT INTO articles( channel, theme, title, article ) VALUES( ?, ?, ?, ? )',
      [ req.body.channel, req.body.theme, req.body.title, req.body.article ],
      handlers.closeConnSendRes( conn, res ) 
    );
  } 
);

// Удаление статьи
app.delete(
  '/delete-article/:id', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      'DELETE FROM articles WHERE id = ?',
      [ req.params.id ],
      handlers.closeConnSendRes( conn, res ) 
    );
  } 
);

// // Получение статьи
// app.get(
//   '/get-article/:id', 
//   ( req, res ) => {
//     const conn = createConn( mysql, authData, handlers.processErrConn );
//     conn.query(      
//       `SELECT a.date_of_creation as date_of_creation_article, a.theme, a.title, a.article, 
//       c.name_channel, c.image, u.name as name_author, u.surname as surname_author,  
//       com.date_of_creation as date_of_creation_comment,us.name as name_commentator, 
//       us.surname as surname_commentator, com.comment
//       FROM articles as a
//       JOIN channels as c ON a.channel = c.id
//       JOIN comments as com ON a.id = com.article
//       JOIN users as u ON c.author = u.id
//       JOIN users as us ON com.user=us.id                 
//       WHERE a.id = ?`,
//       [ req.params.id ],
//       handlers.closeConnSendRes( conn, res ) 
//     );
//   } 
// );

// Получение информации о канале
app.get(
  '/get-channel/:id', 
  ( req, res ) => {
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
  } 
);

// Получение статей по теме
app.get(
  '/get-channel/:theme', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn );
    conn.query(
      `SELECT theme, title, article, a.date_of_creation, name_channel, image
      FROM articles as a JOIN channels as c ON a.channel = c.id
      WHERE MATCH( theme ) AGAINST( ? );`,
      [ req.params.theme ],
      handlers.closeConnSendRes( conn, res ) 
    );
  }
);




// Черновик
// Получение статьи 
// app.get(
//   '/get-article/:id', 
//   ( req, res ) => {
//     const conn = createConn( mysql, authData, handlers.processErrConn );   
//     let promise = new Promise(
//       (resolve, reject) => {
//         conn.query(      
//           `SELECT a.date_of_creation as date_of_creation_article, a.theme, a.title, a.article, 
//           c.name_channel, c.image, u.name as name_author, u.surname as surname_author       
//           FROM articles as a
//           JOIN channels as c ON a.channel = c.id
//           JOIN users as u ON c.author = u.id             
//           WHERE a.id = ?`,
//           [ req.params.id ],
//           (err, result) => {
//             if (err) {
//               reject('Ошибка запроса' + err);
//             }
//             resolve(result);
//           }
//         );
//       }
//     );
    
//     promise.then( 
//       (article) => {
//         conn.query(      
//           `SELECT   
//           com.date_of_creation as date_of_creation_comment, us.name as name_commentator, 
//           us.surname as surname_commentator, com.comment
//           FROM comments as com
//           JOIN users as us ON com.user=us.id                 
//           WHERE com.article = ?`,
//           [ req.params.id ],
//           (err, result ) => {
//             if ( err ) {
//               console.log( 'Ошибка запроса' + err );
//             }
//             conn.end();
//             res.status( 200 ).send( article.concat( result ) );
//           }
//         );
//       }
//     )
//   } 
// );


const query = (conn, query, ...params) => {
  return new Promise (
    ( resolve, reject ) => {
      conn.query(
        query,
        params,
        ( err, result ) => {
          if ( err ) {
            reject( 'Ошибка запроса' + err );
          }
          resolve( result );
        }
      );
    }
  );
}

let query1 = `SELECT a.date_of_creation as date_of_creation_article, a.theme, a.title, a.article, 
c.name_channel, c.image, u.name as name_author, u.surname as surname_author       
FROM articles as a
JOIN channels as c ON a.channel = c.id
JOIN users as u ON c.author = u.id             
WHERE a.id = ?`;

let query2 =  `SELECT   
com.date_of_creation as date_of_creation_comment, us.name as name_commentator, 
us.surname as surname_commentator, com.comment
FROM comments as com
JOIN users as us ON com.user=us.id                 
WHERE com.article = ?`;

app.get(
  '/get-article/:id', 
  ( req, res ) => {
    const conn = createConn( mysql, authData, handlers.processErrConn ); 
    
    Promise.all( 
      [
        query( conn, query1, req.params.id ),
        query( conn, query2, req.params.id )
      ] 
    ).then( 
      results => {
        conn.end();
        res.status( 200 ).send( [...results[0], ...results[1] ] );
      } 
    );
  } 
);

app.get(
  "/read-file",
  ( req, res ) => {
    fs.readFile(
      path.join("C:", "Users","alexa", "Desktop", "my-project", "backgroundHeader.jpg" ),
      // path.resolve( "backgroundHeader.jpg" ),
      ( err, data ) => {
        if ( err ) {
          return console.log(err);
        }
        console.log(data);
      }
    );
  }
);



app.listen( app.get( 'port' ), () => {
  console.log( 'APP started on port', app.get( 'port' ) );
  }
);

module.exports = app;
