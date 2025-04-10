/* courses.js */

document.addEventListener('DOMContentLoaded', function() {
    const readMoreButtons = document.querySelectorAll('.read-more');
    const searchInput = document.getElementById('courseSearch');
    const courseCards = document.querySelectorAll('.course-card');
    const filterButton = document.getElementById('filterButton');
    const pricingFilter = document.getElementById('pricingFilter');
    const typeFilter = document.getElementById('typeFilter');
    const examFilter = document.getElementById('examFilter');
    const subjectFilter = document.getElementById('subjectFilter'); // Get the new filter

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

    searchInput.addEventListener('input', filterCourses);
    filterButton.addEventListener('click', filterCourses);
    pricingFilter.addEventListener('change', filterCourses);
    typeFilter.addEventListener('change', filterCourses);
    examFilter.addEventListener('change', filterCourses);
    subjectFilter.addEventListener('change', filterCourses); // Add listener for subject filter
});