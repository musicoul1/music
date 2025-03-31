// script.js

let lastScrollTop = 0;
const navbar = document.querySelector('nav');
const hamburger = document.querySelector('.hamburger');
const sideNav = document.querySelector('.side-nav');
const loginPopup = document.getElementById('loginPopup');

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
        document.body.style.backgroundImage = "url('Resources/Homepage/music-background1.jpg')";
    } else {
        document.body.style.backgroundImage = "url('Resources/Homepage/music-background.jpg')";
    }
});

hamburger.addEventListener('click', () => {
    if (sideNav.style.right === '0px') {
        sideNav.style.right = '-250px';
    } else {
        sideNav.style.right = '0px';
    }
});

window.addEventListener('click', (event) => {
    if (event.target === loginPopup) {
        if (loginPopup) {
            loginPopup.style.display = 'none';
        }
    }
});