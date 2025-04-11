// script.js

let lastScrollTop = 0;
const navbar = document.querySelector('nav');
const hamburger = document.querySelector('.hamburger');
const sideNav = document.querySelector('.side-nav');
const closeBtn = document.querySelector('.close-btn'); // Get the close button
const body = document.body; // Get the body element

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    lastScrollTop = scrollTop;
});

window.addEventListener('scroll', function() {
    const exploreCourses = document.querySelector('.explore-courses');
    const rect = exploreCourses.getBoundingClientRect();

    if (rect.top <= window.innerHeight / 2) {
        body.style.backgroundImage = "url('Resources/Homepage/music-background1.jpg')";
    } else {
        body.style.backgroundImage = "url('Resources/Homepage/music-background.jpg')";
    }
});

hamburger.addEventListener('click', () => {
    sideNav.style.right = '0px';
});

closeBtn.addEventListener('click', () => {
    sideNav.style.right = '-250px';
});

window.addEventListener('click', (event) => {
    const loginPopup = document.getElementById('loginPopup'); // Ensure loginPopup is defined if used later
    if (loginPopup && event.target === loginPopup) {
        loginPopup.style.display = 'none';
    }
});