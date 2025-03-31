/* courses.js */

document.addEventListener('DOMContentLoaded', function() {
    const readMoreButtons = document.querySelectorAll('.read-more');
    const searchInput = document.getElementById('courseSearch');
    const courseCards = document.querySelectorAll('.course-card');

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

    searchInput.addEventListener('input', function() {
        const searchTerm = searchInput.value.toLowerCase();

        courseCards.forEach(card => {
            const courseName = card.querySelector('h3').textContent.toLowerCase();
            const courseDesc = card.querySelector('p').textContent.toLowerCase();

            if (courseName.includes(searchTerm) || courseDesc.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});