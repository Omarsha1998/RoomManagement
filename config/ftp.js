require('dotenv/config')

const ftpConfig = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    server: process.env.FTP_SERVER,
};

module.exports = ftpConfig