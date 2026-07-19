async function testOrder() {
  try {
    // 1. Login to get token
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@example.com', // Let's use a dummy that probably exists or just print if fails
        password: 'password123'
      })
    });
    
    // We don't have the user's password, so maybe I can't login as them.
    // Let me just send an invalid token to see if it even reaches the validation. Wait, protect middleware will block it.
  } catch (error) {
    console.error('Error:', error);
  }
}
