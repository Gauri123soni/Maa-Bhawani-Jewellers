function setAuthMessage(message, isError = false) {
    const element = document.getElementById('message');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', isError);
}

async function submitAuthRequest(endpoint, payload) {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
}

async function registerUser(event) {
    event?.preventDefault();
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    if (!name || !email || !password) {
        setAuthMessage('Complete all fields to create an account.', true);
        return;
    }

    try {
        const data = await submitAuthRequest('register', { name, email, password });
        setAuthMessage(data.message);
        document.getElementById('password').value = '';
    } catch (error) {
        setAuthMessage(error.message, true);
    }
}

async function loginUser(event) {
    event?.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    if (!email || !password) {
        setAuthMessage('Enter your email and password.', true);
        return;
    }

    try {
        const data = await submitAuthRequest('login', { email, password });
        localStorage.setItem('mbjUser', JSON.stringify(data.user));
        window.location.href = '../index.html';
    } catch (error) {
        setAuthMessage(error.message, true);
    }
}

document.getElementById('registerForm')?.addEventListener('submit', registerUser);
document.getElementById('loginForm')?.addEventListener('submit', loginUser);