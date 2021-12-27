// проромисифицирует запрос к БД
const promisifyQuery = (conn, query, ...params) => {
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

module.exports = promisifyQuery;
