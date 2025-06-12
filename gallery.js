document.addEventListener('DOMContentLoaded', function() {
    // Get the repository name from the current URL path
    const getRepoPath = () => {
        const path = window.location.pathname;
        // If running locally, return empty string
        if (path === '/' || path.includes('.html')) return '';
        // If on GitHub Pages, return the repository name with trailing slash
        const repoName = path.split('/')[1];
        return `/${repoName}`;
    };

    const repoPath = getRepoPath();
    const gallery = document.getElementById('imageGallery');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const imageCounter = document.getElementById('imageCounter');
    let currentImageIndex = 0;
    let images = [];
    
    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    document.body.appendChild(lightbox);

    // Initialize likes from localStorage
    let likes = JSON.parse(localStorage.getItem('galleryLikes')) || {};

    // Function to save likes to localStorage
    function saveLikes() {
        localStorage.setItem('galleryLikes', JSON.stringify(likes));
    }

    // Function to handle like click
    function handleLike(imagePath, likeButton, likeCount) {
        if (!likes[imagePath]) {
            likes[imagePath] = 0;
        }

        if (likeButton.classList.contains('liked')) {
            likes[imagePath]--;
            likeButton.classList.remove('liked');
        } else {
            likes[imagePath]++;
            likeButton.classList.add('liked');
        }

        likeCount.textContent = likes[imagePath];
        saveLikes();
    }

    // Function to create like container
    function createLikeContainer(imagePath) {
        const container = document.createElement('div');
        container.className = 'like-container';

        const button = document.createElement('button');
        button.className = 'like-button';
        button.innerHTML = '<i class="fas fa-heart"></i>';

        const count = document.createElement('span');
        count.className = 'like-count';

        // Initialize like count and button state
        if (!likes[imagePath]) {
            likes[imagePath] = 0;
        }
        count.textContent = likes[imagePath];
        if (likes[imagePath] > 0) {
            button.classList.add('liked');
        }

        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent image click event
            handleLike(imagePath, button, count);
        });

        container.appendChild(button);
        container.appendChild(count);
        return container;
    }

    // Function to create an image element
    function createImageElement(imagePath) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        const img = document.createElement('img');
        // Add repository path for GitHub Pages
        img.src = `${repoPath}/${imagePath}`;
        img.alt = 'Gallery Image';
        img.loading = 'lazy';
        
        // Add like container
        const likeContainer = createLikeContainer(imagePath);
        
        // Add click event for lightbox
        div.addEventListener('click', () => {
            const lightboxImg = document.createElement('img');
            lightboxImg.src = `${repoPath}/${imagePath}`;
            lightbox.innerHTML = '';
            lightbox.appendChild(lightboxImg);
            lightbox.classList.add('active');
        });
        
        div.appendChild(img);
        div.appendChild(likeContainer);
        return div;
    }

    // Close lightbox when clicked
    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    // View toggle functionality
    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            // Remove active class from all toggles
            viewToggles.forEach(t => t.classList.remove('active'));
            // Add active class to clicked toggle
            toggle.classList.add('active');
            
            const viewType = toggle.dataset.view;
            gallery.className = `gallery ${viewType}-view`;
            document.body.classList.toggle('single-view-active', viewType === 'single');
            
            if (viewType === 'single') {
                showImage(currentImageIndex);
            } else {
                showAllImages();
            }
        });
    });

    // Navigation functionality
    function showImage(index) {
        gallery.innerHTML = '';
        gallery.appendChild(createImageElement(images[index]));
        imageCounter.textContent = `Image ${index + 1} of ${images.length}`;
        
        // Update button states
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === images.length - 1;
    }

    function showAllImages() {
        gallery.innerHTML = '';
        images.forEach(imagePath => {
            gallery.appendChild(createImageElement(imagePath));
        });
    }

    prevBtn.addEventListener('click', () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            showImage(currentImageIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentImageIndex < images.length - 1) {
            currentImageIndex++;
            showImage(currentImageIndex);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (document.body.classList.contains('single-view-active')) {
            if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
                currentImageIndex--;
                showImage(currentImageIndex);
            } else if (e.key === 'ArrowRight' && currentImageIndex < images.length - 1) {
                currentImageIndex++;
                showImage(currentImageIndex);
            }
        }
    });

    // Function to load images
    function loadImages() {
        // Get all image files from the images directory
        images = [
            'images/1.jpg',
            'images/2.jpg',
            'images/3.jpg',
            'images/4.jpg',
            'images/5.jpg',
            'images/6.jpg',
            'images/7.jpg'
        ];

        showAllImages();
    }

    // Load images when the page loads
    loadImages();
}); 