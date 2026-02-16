const http = require('http');

const data = JSON.stringify({
    email: 'sadekap9@gmail.com',
    password: 'Byxpek7R'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', responseBody);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(data);
req.end();
