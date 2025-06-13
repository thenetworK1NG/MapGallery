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
                    likeButton.classList.remove('pulse');
                    likeButton.setAttribute('data-tooltip', 'You liked this!');
                } else {
                    likeButton.classList.remove('liked');
                    likeButton.classList.add('pulse');
                    likeButton.setAttribute('data-tooltip', 'Like this image!');
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
                        likeButton.classList.remove('pulse');
                        likeButton.setAttribute('data-tooltip', 'You liked this!');
                    } else {
                        likeButton.classList.remove('liked');
                        likeButton.classList.add('pulse');
                        likeButton.setAttribute('data-tooltip', 'Like this image!');
                    }
                    console.log(`Updated specific button for ${imagePath}: User ${userId} liked = ${userLiked}`);
                }
            }
        });
    }

    // Confetti colors
    const CONFETTI_COLORS = ['#ff1493', '#ffec3d', '#00e0ff', '#2ecc40', '#ff6f61', '#a259ff'];

    function launchConfetti(targetButton) {
        const rect = targetButton.getBoundingClientRect();
        const confettiCount = 18;
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
            confetti.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 30) + 'px';
            confetti.style.top = (rect.top + rect.height / 2) + 'px';
            confetti.style.position = 'fixed';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.opacity = 0.8;
            document.body.appendChild(confetti);
            // Animate
            const angle = Math.random() * 2 * Math.PI;
            const distance = 60 + Math.random() * 40;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            setTimeout(() => {
                confetti.style.transition = 'transform 0.8s cubic-bezier(0.23,1,0.32,1), opacity 0.8s';
                confetti.style.transform += ` translate(${x}px, ${y}px)`;
                confetti.style.opacity = 0;
            }, 10);
            setTimeout(() => {
                confetti.remove();
            }, 900);
        }
    }

    // Helper: animate number jump for like count
    function animateLikeCount(countElem, from, to) {
        if (from === to) {
            countElem.textContent = to;
            return;
        }
        const duration = 400;
        const start = performance.now();
        function animate(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.round(from + (to - from) * progress);
            countElem.textContent = value;
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                countElem.textContent = to;
            }
        }
        requestAnimationFrame(animate);
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
            // Animate like count down
            if (likeCount) animateLikeCount(likeCount, currentLikes, newLikes);
        } else {
            // User is liking (only if they haven't liked it before)
            const newLikes = currentLikes + 1;
            // Add user's like
            userLikesRef.child(userId).child(firebaseKey).set(true);
            // Update total likes
            likesRef.child(firebaseKey).set(newLikes);
            
            console.log(`User ${userId} liked image: ${imagePath}, New total likes: ${newLikes}`);
            // Confetti effect
            launchConfetti(likeButton);
            // Animate like count up
            if (likeCount) animateLikeCount(likeCount, currentLikes, newLikes);
        }
        // Like count bounce
        if (likeCount) {
            likeCount.classList.remove('bounce');
            void likeCount.offsetWidth; // force reflow
            likeCount.classList.add('bounce');
        }
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
    function createImageElement(imagePath, index = 0) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        // Staggered animation
        div.style.setProperty('--stagger-delay', (index * 80) + 'ms');

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
        images.forEach((imagePath, idx) => {
            gallery.appendChild(createImageElement(imagePath, idx));
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
        // Try to load images 1.jpg to 200.jpg, but only show those that exist
        const tryCount = 200;
        const basePath = 'images/';
        let loaded = 0;
        let foundImages = [];
        return new Promise(resolve => {
            for (let i = 1; i <= tryCount; i++) {
                const imgPath = `${basePath}${i}.jpg`;
                const img = new window.Image();
                img.onload = function() {
                    foundImages.push(imgPath);
                    loaded++;
                    if (loaded === tryCount) {
                        resolve(foundImages);
                    }
                };
                img.onerror = function() {
                    loaded++;
                    if (loaded === tryCount) {
                        resolve(foundImages);
                    }
                };
                img.src = imgPath;
            }
        });
    }

    // Load images and Firebase data together
    Promise.all([
        loadImages(),
        dataLoadPromise
    ]).then(([foundImages]) => {
        images = foundImages;
        dataLoaded = true;
        showAllImages();
        updateAllLikeCounters();
        updateAllLikeButtons();
    });

    // --- View Toggle Ripple Effect ---
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Remove old ripples
            const oldRipple = this.querySelector('.ripple');
            if (oldRipple) oldRipple.remove();
            // Create ripple
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.position = 'absolute';
            ripple.style.left = e.offsetX + 'px';
            ripple.style.top = e.offsetY + 'px';
            ripple.style.width = ripple.style.height = Math.max(this.offsetWidth, this.offsetHeight) + 'px';
            ripple.style.background = 'rgba(52,152,219,0.15)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'translate(-50%, -50%) scale(0.2)';
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = 2;
            ripple.style.transition = 'transform 0.5s, opacity 0.5s';
            this.appendChild(ripple);
            setTimeout(() => {
                ripple.style.transform = 'translate(-50%, -50%) scale(1)';
                ripple.style.opacity = 0;
            }, 10);
            setTimeout(() => {
                ripple.remove();
            }, 500);
        });
    });

    // --- Easter Egg: 5x click on title shows hearts and message ---
    (function() {
        const title = document.getElementById('galleryTitle');
        const heartsContainer = document.getElementById('evadneHearts');
        let clickCount = 0;
        let clickTimer = null;
        if (title && heartsContainer) {
            title.addEventListener('click', function() {
                clickCount++;
                if (clickTimer) clearTimeout(clickTimer);
                clickTimer = setTimeout(() => { clickCount = 0; }, 700);
                if (clickCount === 5) {
                    clickCount = 0;
                    showEvadneHearts();
                }
            });
        }
        function showEvadneHearts() {
            heartsContainer.innerHTML = '';
            heartsContainer.style.display = 'flex';
            // Add animated hearts
            for (let i = 0; i < 18; i++) {
                const heart = document.createElement('div');
                heart.innerHTML = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 43s-1.45-1.32-3.2-2.91C12.4 33.36 4 26.28 4 18.5 4 12.7 8.7 8 14.5 8c3.04 0 5.91 1.41 7.5 3.57C23.59 9.41 26.46 8 29.5 8 35.3 8 40 12.7 40 18.5c0 7.78-8.4 14.86-16.8 21.59C25.45 41.68 24 43 24 43z" fill="#ff1493"/></svg>';
                heart.style.position = 'absolute';
                heart.style.left = (50 + Math.random() * 40 - 20) + '%';
                heart.style.top = (40 + Math.random() * 30 - 15) + '%';
                heart.style.transform = `scale(${0.7 + Math.random() * 0.7}) rotate(${Math.random()*360}deg)`;
                heart.style.opacity = 0.7 + Math.random() * 0.3;
                heart.style.pointerEvents = 'none';
                heart.style.transition = 'transform 1.2s cubic-bezier(0.23,1,0.32,1), opacity 1.2s';
                heartsContainer.appendChild(heart);
                setTimeout(() => {
                    heart.style.transform += ` translateY(-${80 + Math.random()*60}px) scale(${1.1 + Math.random()*0.5})`;
                    heart.style.opacity = 0;
                }, 30 + i*30);
            }
            // Add message
            const msg = document.createElement('div');
            msg.textContent = 'Love you Evadne';
            msg.style.fontSize = '2.2rem';
            msg.style.fontWeight = 'bold';
            msg.style.color = '#ff1493';
            msg.style.textShadow = '0 2px 16px #fff, 0 2px 8px #ff1493cc';
            msg.style.marginTop = '2.5rem';
            msg.style.letterSpacing = '2px';
            msg.style.opacity = '0.95';
            msg.style.pointerEvents = 'none';
            heartsContainer.appendChild(msg);
            setTimeout(() => {
                heartsContainer.style.display = 'none';
                heartsContainer.innerHTML = '';
            }, 2500);
        }
    })();
}); 