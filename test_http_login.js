const axios = require('axios');

async function testLogin() {
    const email = 'sadekap9@gmail.com';
    const password = 'Byxpek7R';
    
    try {
        const response = await axios.post('http://localhost:5000/api/student/login', {
            email: email,
            password: password
        });
        console.log("Login Success:", response.data);
    } catch (error) {
        if (error.response) {
            console.log("Login Failed:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testLogin();
