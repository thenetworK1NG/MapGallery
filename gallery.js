document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.getElementById('imageGallery');
    
    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    document.body.appendChild(lightbox);

    // Function to create an image element
    function createImageElement(imagePath) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = 'Gallery Image';
        img.loading = 'lazy';
        
        // Add click event for lightbox
        div.addEventListener('click', () => {
            const lightboxImg = document.createElement('img');
            lightboxImg.src = imagePath;
            lightbox.innerHTML = '';
            lightbox.appendChild(lightboxImg);
            lightbox.classList.add('active');
        });
        
        div.appendChild(img);
        return div;
    }

    // Close lightbox when clicked
    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    // Function to load images
    function loadImages() {
        // Get all image files from the images directory
        const imageFiles = [
            'images/1.jpg',
            'images/2.jpg',
            'images/3.jpg',
            'images/4.jpg',
            'images/5.jpg',
            'images/6.jpg',
            'images/7.jpg'
        ];

        imageFiles.forEach(imagePath => {
            const imageElement = createImageElement(imagePath);
            gallery.appendChild(imageElement);
        });
    }

    // Load images when the page loads
    loadImages();
}); 