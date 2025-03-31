// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBaDBLoe2Wi2WgmJfPRXoEP-ZSgkVhMxVI",
    authDomain: "musicoul-15025.firebaseapp.com",
    projectId: "musicoul-15025",
    storageBucket: "musicoul-15025.firebasestorage.app",
    messagingSenderId: "863099041367",
    appId: "1:863099041367:web:c3d61399489a219611d512",
    measurementId: "G-WBPE697N9Q"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

export { auth };