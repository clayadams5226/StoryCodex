/**
 * ImageHandler - Handles character picture uploads with automatic resizing and compression
 */

export class ImageHandler {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.targetSize = 200; // 200x200px
    this.quality = 0.8; // JPEG quality (0-1)
  }

  /**
   * Process an uploaded image file
   * @param {File} file - The uploaded image file
   * @returns {Promise<string>} Base64 encoded image string
   */
  async processImage(file) {
    // Validate file type
    if (!this.isValidImageType(file)) {
      throw new Error('Invalid file type. Please upload a PNG or JPG image.');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit.`);
    }

    // Load the image
    const img = await this.loadImage(file);

    // Resize and compress
    const base64 = await this.resizeAndCompress(img);

    return base64;
  }

  /**
   * Validate image file type
   * @param {File} file - The file to validate
   * @returns {boolean} True if valid image type
   */
  isValidImageType(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    return validTypes.includes(file.type);
  }

  /**
   * Load image file into an Image element
   * @param {File} file - The image file
   * @returns {Promise<HTMLImageElement>} Loaded image element
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));

        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Resize image to target dimensions and compress
   * @param {HTMLImageElement} img - The image to resize
   * @returns {Promise<string>} Base64 encoded resized image
   */
  async resizeAndCompress(img) {
    return new Promise((resolve) => {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate dimensions (square crop)
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      // Set canvas size to target
      canvas.width = this.targetSize;
      canvas.height = this.targetSize;

      // Draw the image (cropped and resized)
      ctx.drawImage(
        img,
        x, y, size, size, // Source rectangle (square crop from center)
        0, 0, this.targetSize, this.targetSize // Destination rectangle
      );

      // Convert to base64 with compression
      const base64 = canvas.toDataURL('image/jpeg', this.quality);

      resolve(base64);
    });
  }

  /**
   * Process a canvas (from Cropper.js) and convert to base64
   * @param {HTMLCanvasElement} canvas - The cropped canvas
   * @returns {Promise<string>} Base64 encoded image string
   */
  async processCanvas(canvas) {
    return new Promise((resolve) => {
      // Create a new canvas at target size
      const resizedCanvas = document.createElement('canvas');
      const ctx = resizedCanvas.getContext('2d');

      // Set canvas size to target
      resizedCanvas.width = this.targetSize;
      resizedCanvas.height = this.targetSize;

      // Draw the cropped image (resized to target dimensions)
      ctx.drawImage(
        canvas,
        0, 0, canvas.width, canvas.height, // Source
        0, 0, this.targetSize, this.targetSize // Destination
      );

      // Convert to base64 with compression
      const base64 = resizedCanvas.toDataURL('image/jpeg', this.quality);

      resolve(base64);
    });
  }

  /**
   * Get image dimensions from base64 string
   * @param {string} base64 - Base64 encoded image
   * @returns {Promise<{width: number, height: number}>} Image dimensions
   */
  async getImageDimensions(base64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    });
  }

  /**
   * Estimate the size of a base64 string in bytes
   * @param {string} base64 - Base64 encoded string
   * @returns {number} Size in bytes
   */
  getBase64Size(base64) {
    // Remove data:image prefix if present
    const base64Data = base64.split(',')[1] || base64;

    // Calculate size: each base64 character = 6 bits
    // Account for padding characters
    const padding = (base64Data.match(/=/g) || []).length;
    return (base64Data.length * 3 / 4) - padding;
  }
}
