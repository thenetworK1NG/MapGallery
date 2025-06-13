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
    let userLikes = {};
    let dataLoaded = false;
    
    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    document.body.appendChild(lightbox);

    // Initialize Firebase references
    const database = firebase.database();
    const likesRef = database.ref('likes');
    const userLikesRef = database.ref('userLikes');

    // Get or generate a persistent user ID
    const userId = localStorage.getItem('galleryUserId') || 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('galleryUserId', userId);

    // Promise to track data loading
    const dataLoadPromise = Promise.all([
        new Promise(resolve => {
            likesRef.once('value', snapshot => {
                likes = snapshot.val() || {};
                resolve();
            });
        }),
        new Promise(resolve => {
            userLikesRef.once('value', snapshot => {
                userLikes = snapshot.val() || {};
                resolve();
            });
        })
    ]);

    // Load likes from Firebase
    likesRef.on('value', (snapshot) => {
        likes = snapshot.val() || {};
        console.log('Firebase likes data:', likes); // Debug log
        if (dataLoaded) {
            updateAllLikeCounters();
        }
    });

    // Load user likes from Firebase
    userLikesRef.on('value', (snapshot) => {
        userLikes = snapshot.val() || {};
        console.log('Firebase user likes data:', userLikes); // Debug log
        console.log('Current user ID:', userId); // Debug log
        if (dataLoaded) {
            updateAllLikeButtons();
        }
    });

    // Listen for specific user like changes
    userLikesRef.child(userId).on('child_changed', (snapshot) => {
        const firebaseKey = snapshot.key;
        const imagePath = firebaseKey.replace(/_/g, '/').replace('images', 'images');
        updateSpecificLikeButton(imagePath);
    });

    userLikesRef.child(userId).on('child_added', (snapshot) => {
        const firebaseKey = snapshot.key;
        const imagePath = firebaseKey.replace(/_/g, '/').replace('images', 'images');
        updateSpecificLikeButton(imagePath);
    });

    userLikesRef.child(userId).on('child_removed', (snapshot) => {
        const firebaseKey = snapshot.key;
        const imagePath = firebaseKey.replace(/_/g, '/').replace('images', 'images');
        updateSpecificLikeButton(imagePath);
    });

    // Function to update all visible like counters
    function updateAllLikeCounters() {
        document.querySelectorAll('.gallery-item').forEach(item => {
            const imagePath = item.querySelector('img').getAttribute('data-original-path');
            const likeCount = item.querySelector('.like-count');
            
            if (likeCount && imagePath) {
                // Convert image path to Firebase key format
                const firebaseKey = imagePath.replace(/[.#$/\[\]]/g, '_');
                const currentLikes = likes[firebaseKey] || 0;
                
                likeCount.textContent = currentLikes;
                console.log(`Image: ${imagePath}, Firebase key: ${firebaseKey}, Likes: ${currentLikes}`); // Debug log
            }
        });
    }

    // Function to update all like buttons
    function updateAllLikeButtons() {
        document.querySelectorAll('.gallery-item').forEach(item => {
            const imagePath = item.querySelector('img').getAttribute('data-original-path');
            const likeButton = item.querySelector('.like-button');
            
            if (likeButton && imagePath) {
                // Convert image path to Firebase key format
                const firebaseKey = imagePath.replace(/[.#$/\[\]]/g, '_');
                const userLiked = userLikes[userId] && userLikes[userId][firebaseKey];
                
                // Only add 'liked' class if userLiked is true, remove it otherwise
                if (userLiked === true) {
                    likeButton.classList.add('liked');
                } else {
                    likeButton.classList.remove('liked');
                }
                console.log(`Updating button for ${imagePath}: User ${userId} liked = ${userLiked}, Button has 'liked' class = ${likeButton.classList.contains('liked')}`);
            }
        });
    }

    // Function to update a specific like button
    function updateSpecificLikeButton(imagePath) {
        const firebaseKey = imagePath.replace(/[.#$/\[\]]/g, '_');
        const userLiked = userLikes[userId] && userLikes[userId][firebaseKey];
        
        // Find the specific button for this image
        document.querySelectorAll('.gallery-item').forEach(item => {
            const itemImagePath = item.querySelector('img').getAttribute('data-original-path');
            if (itemImagePath === imagePath) {
                const likeButton = item.querySelector('.like-button');
                if (likeButton) {
                    // Only add 'liked' class if userLiked is true, remove it otherwise
                    if (userLiked === true) {
                        likeButton.classList.add('liked');
                    } else {
                        likeButton.classList.remove('liked');
                    }
                    console.log(`Updated specific button for ${imagePath}: User ${userId} liked = ${userLiked}`);
                }
            }
        });
    }

    // Function to handle like click
    function handleLike(imagePath, likeButton, likeCount) {
        if (!dataLoaded) {
            console.log('Data not yet loaded, ignoring click');
            return;
        }

        const firebaseKey = imagePath.replace(/[.#$/\[\]]/g, '_');
        const currentLikes = likes[firebaseKey] || 0;
        const userLiked = userLikes[userId] && userLikes[userId][firebaseKey];
        
        console.log(`Click detected - User ${userId}, Image: ${imagePath}, Currently liked: ${userLiked}`);
        
        if (userLiked) {
            // User is unliking
            const newLikes = Math.max(0, currentLikes - 1);
            // Remove user's like
            userLikesRef.child(userId).child(firebaseKey).remove();
            // Update total likes
            likesRef.child(firebaseKey).set(newLikes);
            
            console.log(`User ${userId} unliked image: ${imagePath}, New total likes: ${newLikes}`);
        } else {
            // User is liking (only if they haven't liked it before)
            const newLikes = currentLikes + 1;
            // Add user's like
            userLikesRef.child(userId).child(firebaseKey).set(true);
            // Update total likes
            likesRef.child(firebaseKey).set(newLikes);
            
            console.log(`User ${userId} liked image: ${imagePath}, New total likes: ${newLikes}`);
        }
        
        // Update only this specific button instead of all buttons
        setTimeout(() => {
            updateSpecificLikeButton(imagePath);
        }, 100);
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
        
        // Check if current user has liked this image
        const userLiked = userLikes[userId] && userLikes[userId][firebaseKey];
        
        count.textContent = currentLikes;
        
        // Only set as liked if the user has actually liked it
        if (userLiked) {
            button.classList.add('liked');
            console.log(`Setting initial state for ${imagePath}: User has liked it`);
        } else {
            console.log(`Setting initial state for ${imagePath}: User has NOT liked it`);
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
        // Fetch image list from backend
        fetch('/list-images')
            .then(response => response.json())
            .then(imageFiles => {
                images = imageFiles.map(filename => `images/${filename}`);
                // Wait for Firebase data to load before showing images
                dataLoadPromise.then(() => {
                    dataLoaded = true;
                    showAllImages();
                    updateAllLikeCounters();
                    updateAllLikeButtons();
                });
            })
            .catch(err => {
                console.error('Failed to fetch image list:', err);
                // Fallback to hardcoded list if fetch fails
                images = [
                    'images/1.jpg',
                    'images/2.jpg',
                    'images/3.jpg',
                    'images/4.jpg',
                    'images/5.jpg',
                    'images/6.jpg',
                    'images/7.jpg'
                ];
                dataLoadPromise.then(() => {
                    dataLoaded = true;
                    showAllImages();
                    updateAllLikeCounters();
                    updateAllLikeButtons();
                });
            });
    }

    // Load images when the page loads
    loadImages();
}); 