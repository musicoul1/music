/* login.js */

 // Import necessary Firebase modules from your config file
 import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './firebase-config.js'; // Removed GoogleAuthProvider from import

 // Get references to HTML elements for Login form
 const loginEmail = document.getElementById('loginEmail');
 const loginPassword = document.getElementById('loginPassword');
 const submitLogin = document.getElementById('submitLogin');
 const loginMessage = document.getElementById('loginMessage');

 // Get references to HTML elements for Signup form
 const signupEmail = document.getElementById('signupEmail');
 const signupPassword = document.getElementById('signupPassword');
 const submitSignup = document.getElementById('submitSignup');
 const signupMessage = document.getElementById('signupMessage');

 // Get references to toggle buttons and form container
 const toggleButton = document.getElementById('toggleButton');
 const toggleButtonLogin = document.getElementById('toggleButtonLogin');
 const formContainer = document.querySelector('.form-container');

 // Get reference to the Google Sign-in button
 const googleSignInBtn = document.getElementById('googleSignInBtn');

 // --- Step 1: Implement Toggle Functionality ---
 toggleButton.addEventListener('click', () => {
     formContainer.style.transform = 'translateX(-50%)'; // Show Signup form (move container to the left)
 });

 toggleButtonLogin.addEventListener('click', () => {
     formContainer.style.transform = 'translateX(0)'; // Show Login form (move container back to the right)
 });

 // --- Step 2: Implement Email/Password Login with Firebase ---
 submitLogin.addEventListener('click', () => {
     const email = loginEmail.value;
     const password = loginPassword.value;

     firebase.auth().signInWithEmailAndPassword(email, password)
         .then((userCredential) => {
             const user = userCredential.user;
             loginMessage.textContent = 'Login successful!';
             window.location.href = "index.html";
             console.log('Login successful:', user);
         })
         .catch((error) => {
             const errorCode = error.code;
             const errorMessage = error.message;
             loginMessage.textContent = errorMessage;
             console.error('Login failed:', errorCode, errorMessage);
         });
 });

 // --- Step 3: Implement Email/Password Signup with Firebase ---
 submitSignup.addEventListener('click', () => {
     const email = signupEmail.value;
     const password = signupPassword.value;

     firebase.auth().createUserWithEmailAndPassword(email, password)
         .then((userCredential) => {
             const user = userCredential.user;
             signupMessage.textContent = 'Signup successful!';
             window.location.href = "index.html";
             console.log('Signup successful:', user);
         })
         .catch((error) => {
             const errorCode = error.code;
             const errorMessage = error.message;
             signupMessage.textContent = errorMessage;
             console.error('Signup failed:', errorCode, errorMessage);
         });
 });

 // --- Step 4: Implement Google Authentication with Firebase ---
 googleSignInBtn.addEventListener('click', () => {
     const provider = new firebase.auth.GoogleAuthProvider(); // Access it directly here

     firebase.auth().signInWithPopup(provider)
         .then((result) => {
             const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
             const token = credential.accessToken;
             const user = result.user;
             loginMessage.textContent = 'Google sign-in successful!';
             window.location.href = "index.html";
             console.log('Google sign-in successful:', user, token);
         }).catch((error) => {
             const errorCode = error.code;
             const errorMessage = error.message;
             const email = error.email;
             const credential = firebase.auth.GoogleAuthProvider.credentialFromError(error);
             loginMessage.textContent = errorMessage;
             console.error('Google sign-in failed:', errorCode, errorMessage, email, credential);
         });
 });