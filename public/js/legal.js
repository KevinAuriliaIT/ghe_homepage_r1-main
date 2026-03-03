document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.legal-link');
    const sections = document.querySelectorAll('.legal-section');

    function showSection(hash) {
        sections.forEach(section => {
            if (`#${section.id}` === hash) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        links.forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = e.target.getAttribute('href');
            history.pushState(null, null, hash);
            showSection(hash);
        });
    });

    // Show section based on initial URL hash
    if (window.location.hash) {
        showSection(window.location.hash);
    } else {
        // Show the first section by default
        showSection('#impressum');
    }

    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
        if (window.location.hash) {
            showSection(window.location.hash);
        } else {
            showSection('#impressum');
        }
    });
});
