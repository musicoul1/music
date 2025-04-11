// courses.js

document.addEventListener('DOMContentLoaded', function() {
    const readMoreButtons = document.querySelectorAll('.read-more');
    const searchInput = document.getElementById('courseSearch');
    const courseCards = document.querySelectorAll('.course-card');
    const filterButton = document.getElementById('filterButton');
    const pricingFilter = document.getElementById('pricingFilter');
    const typeFilter = document.getElementById('typeFilter');
    const examFilter = document.getElementById('examFilter');
    const subjectFilter = document.getElementById('subjectFilter'); // Get the new filter
    const hamburger = document.querySelector('.hamburger');
    const sideNav = document.querySelector('.side-nav');
    const closeBtn = document.querySelector('.side-nav .close-btn'); // Get the close button correctly within side-nav

    // Function to filter courses based on selected criteria
    function filterCourses() {
        const pricingValue = pricingFilter.value;
        const typeValue = typeFilter.value;
        const examValue = examFilter.value;
        const subjectValue = subjectFilter.value; // Get the subject filter value
        const searchTerm = searchInput.value.toLowerCase();

        courseCards.forEach(card => {
            const pricingMatch = pricingValue === "" || card.dataset.pricing === pricingValue;
            const typeMatch = typeValue === "" || card.dataset.type === typeValue;
            const examMatch = examValue === "" || card.dataset.exam === examValue;
            const subjectMatch = subjectValue === "" || card.dataset.subject === subjectValue; // Check subject
            const searchMatch = searchTerm === "" ||
                                card.querySelector('h3').textContent.toLowerCase().includes(searchTerm) ||
                                card.querySelector('p').textContent.toLowerCase().includes(searchTerm) ||
                                card.querySelector('.course-tags').textContent.toLowerCase().includes(searchTerm) ||
                                card.querySelector('.course-price').textContent.toLowerCase().includes(searchTerm); // Include price in search

            if (pricingMatch && typeMatch && examMatch && subjectMatch && searchMatch) {
                card.style.display = 'grid'; // Or 'block' depending on your grid/flex setup
            } else {
                card.style.display = 'none';
            }
        });
    }

    readMoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course');
            const details = document.getElementById(`course-details-${courseId}`);

            if (details.style.display === 'block') {
                details.style.display = 'none';
            } else {
                details.style.display = 'block';
            }
        });
    });

    if (searchInput) searchInput.addEventListener('input', filterCourses);
    if (filterButton) filterButton.addEventListener('click', filterCourses);
    if (pricingFilter) pricingFilter.addEventListener('change', filterCourses);
    if (typeFilter) typeFilter.addEventListener('change', filterCourses);
    if (examFilter) examFilter.addEventListener('change', filterCourses);
    if (subjectFilter) subjectFilter.addEventListener('change', filterCourses); // Add listener for subject filter

    // Hamburger menu functionality
    if (hamburger && sideNav) {
        hamburger.addEventListener('click', () => {
            sideNav.classList.add('active'); // Use classList for adding/removing classes
        });
    }

    if (closeBtn && sideNav) {
        closeBtn.addEventListener('click', () => {
            sideNav.classList.remove('active'); // Use classList for adding/removing classes
        });
    }

    // Close side navigation when clicking outside (optional, but good for UX)
    window.addEventListener('click', (event) => {
        if (sideNav && sideNav.classList.contains('active') && !event.target.closest('.side-nav') && event.target !== hamburger) {
            sideNav.classList.remove('active');
        }
    });
});