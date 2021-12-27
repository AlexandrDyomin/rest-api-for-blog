// проромисифицирует чтение файла
const promisifyReadFile = ( fs, path) => {
  return(
    new Promise(
      ( resolve, reject ) => {
        fs.readFile(
          path,
          ( err, data ) => {
            if ( err ){
              reject( 'Ошибка чтения файла' + err );
            }
            resolve( data );
          }
        );
      }
    )
  );
}

module.exports = promisifyReadFile;