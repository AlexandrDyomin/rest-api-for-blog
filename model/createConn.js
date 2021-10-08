const createConn = (mysql, authData, handler) => {
    const conn = mysql.createConnection( authData );
    conn.connect(handler);
    return conn;
}

module.exports = createConn;