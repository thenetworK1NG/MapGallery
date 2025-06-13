document.addEventListener('DOMContentLoaded', function() {
    // Get the repository name from the current URL path
    const getRepoPath = () => {
        const path = window.location.pathname;
        // If running locally, return empty string
        if (path === '/' || path.includes('.html')) return '';
        // If on GitHub Pages, return the repository name with trailing slash
        const pathParts = path.split('/').filter(part => part.length > 0);
        if (pathParts.length > 0) {
            return `/${pathParts[0]}`;
        }
        return '';
    };

    const repoPath = getRepoPath();
    console.log('Repository path:', repoPath); // Debug log
    const gallery = document.getElementById('imageGallery');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const imageCounter = document.getElementById('imageCounter');
    let currentImageIndex = 0;
    let images = [];
    let likes = {};
    
    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    document.body.appendChild(lightbox);

    // Initialize Firebase references
    const database = firebase.database();
    const likesRef = database.ref('likes');

    // Load likes from Firebase
    likesRef.on('value', (snapshot) => {
        likes = snapshot.val() || {};
        console.log('Firebase likes data:', likes); // Debug log
        // Update all like counters
        updateAllLikeCounters();
    });

    // Function to update all visible like counters
    function updateAllLikeCounters() {
        document.querySelectorAll('.gallery-item').forEach(item => {
            const imagePath = item.querySelector('img').getAttribute('data-original-path');
            const likeCount = item.querySelector('.like-count');
            const likeButton = item.querySelector('.like-button');
            
            if (likeCount && imagePath) {
                // Convert image path to Firebase key format
                const firebaseKey = imagePath.replace(/[.#$/\[\]]/g, '_');
                const currentLikes = likes[firebaseKey] || 0;
                
                likeCount.textContent = currentLikes;
                likeButton.classList.toggle('liked', currentLikes > 0);
                
                console.log(`Image: ${imagePath}, Firebase key: ${firebaseKey}, Likes: ${currentLikes}`); // Debug log
            }
        });
    }

    // Function to handle like click
    function handleLike(imagePath, likeButton, likeCount) {
        const firebaseKey = imagePath.replace(/[.#$/\[\]]/g, '_');
        const currentLikes = likes[firebaseKey] || 0;
        const newLikes = likeButton.classList.contains('liked') ? 
            Math.max(0, currentLikes - 1) : 
            currentLikes + 1;

        console.log(`Liking image: ${imagePath}, Firebase key: ${firebaseKey}, New likes: ${newLikes}`); // Debug log

        // Update Firebase
        likesRef.child(firebaseKey).set(newLikes);
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
        
        // Convert image path to Firebase key format
        const firebaseKey = imagePath.replace(/[.#$/\[\]]/g, '_');
        const currentLikes = likes[firebaseKey] || 0;
        count.textContent = currentLikes;

        if (currentLikes > 0) {
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
        const fullImagePath = repoPath ? `${repoPath}/${imagePath}` : imagePath;
        img.src = fullImagePath;
        img.setAttribute('data-original-path', imagePath);
        img.alt = 'Gallery Image';
        img.loading = 'lazy';
        
        // Add error handling for images
        img.onerror = function() {
            console.error('Failed to load image:', fullImagePath);
            // Try without repo path as fallback
            if (repoPath) {
                this.src = imagePath;
            }
        };
        
        // Add like container
        const likeContainer = createLikeContainer(imagePath);
        
        // Add click event for lightbox
        div.addEventListener('click', () => {
            const lightboxImg = document.createElement('img');
            lightboxImg.src = fullImagePath;
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
            viewToggles.forEach(t => t.classList.remove('active'));
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