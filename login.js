/* login.js */

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const submitLogin = document.getElementById('submitLogin');
const loginMessage = document.getElementById('loginMessage');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const submitSignup = document.getElementById('submitSignup');
const signupMessage = document.getElementById('signupMessage');
const toggleButton = document.getElementById('toggleButton');
const toggleButtonLogin = document.getElementById('toggleButtonLogin');
const formContainer = document.querySelector('.form-container');

toggleButton.addEventListener('click', () => {
    formContainer.style.transform = 'translateX(-50%)';
});

toggleButtonLogin.addEventListener('click', () => {
    formContainer.style.transform = 'translateX(0)';
});

submitLogin.addEventListener('click', () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            loginMessage.textContent = 'Login successful!';
            window.location.href = "index.html";
        })
        .catch((error) => {
            const errorMessage = error.message;
            loginMessage.textContent = errorMessage;
        });
});

submitSignup.addEventListener('click', () => {
    const email = signupEmail.value;
    const password = signupPassword.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            signupMessage.textContent = 'Signup successful!';
            window.location.href = "index.html";
        })
        .catch((error) => {
            const errorMessage = error.message;
            signupMessage.textContent = errorMessage;
        });
});