const closeConnSendRes = ( connection, response ) => {
    return( (err, result ) => {
        if ( err ) {
            console.log('Ошибка запроса' + err);
        } else {
            connection.end();
            response.status( 200 ).send( result );
        }
    } );
}

const processErrConn = ( err ) => {
    if ( err ) {
        console.log( 'Ошибка соединения');
    }
}

const handlers = {
    closeConnSendRes,
    processErrConn
};

module.exports = handlers;
