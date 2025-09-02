// Main JavaScript for S&S Computer Repair Single-Page Website

document.addEventListener('DOMContentLoaded', function() {
    
    // Navbar scroll effect
    const navbar = document.getElementById('mainNav');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.classList.add('shadow');
        } else {
            navbar.classList.remove('shadow');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
    });
    
    // Active navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link[href^="#"]');
    
    window.addEventListener('scroll', function() {
        let current = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
    
    // Form validation functions
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function validatePhone(phone) {
        if (!phone) return true; // Phone is optional
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    
    function sanitizeInput(input) {
        return input.replace(/[<>]/g, '').trim();
    }
    
    function validateForm(formData) {
        const errors = [];
        
        // Validate required fields
        const requiredFields = ['name', 'surname', 'email', 'message'];
        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim().length === 0) {
                errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
            }
        });
        
        // Validate email
        const email = formData.get('email');
        if (email && !validateEmail(email)) {
            errors.push('Please enter a valid email address');
        }
        
        // Validate phone (optional)
        const phone = formData.get('phone');
        if (phone && !validatePhone(phone)) {
            errors.push('Please enter a valid phone number');
        }
        
        // Validate message length
        const message = formData.get('message');
        if (message && message.length < 10) {
            errors.push('Message must be at least 10 characters long');
        }
        
        if (message && message.length > 1000) {
            errors.push('Message must be less than 1000 characters');
        }
        
        return errors;
    }
    
    // Form handling with reCAPTCHA and validation
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        // Real-time validation
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                const field = this.name;
                const value = this.value.trim();
                
                // Clear previous validation states
                this.classList.remove('is-valid', 'is-invalid');
                
                // Validate based on field type
                if (this.hasAttribute('required') && !value) {
                    this.classList.add('is-invalid');
                    return;
                }
                
                if (field === 'email' && value && !validateEmail(value)) {
                    this.classList.add('is-invalid');
                    return;
                }
                
                if (field === 'phone' && value && !validatePhone(value)) {
                    this.classList.add('is-invalid');
                    return;
                }
                
                if (value) {
                    this.classList.add('is-valid');
                }
            });
        });
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            // Get form data and sanitize
            const formData = new FormData(this);
            const sanitizedData = new FormData();
            
            // First, add the reCAPTCHA token if it exists
            const recaptchaToken = document.getElementById('recaptcha_token').value;
            if (recaptchaToken) {
                sanitizedData.append('recaptcha_token', recaptchaToken);
            }
            
            // Then add all other form fields
            for (let [key, value] of formData.entries()) {
                if (key !== 'recaptcha_token') {
                    sanitizedData.append(key, sanitizeInput(value));
                }
            }
            
            // Client-side validation
            const validationErrors = validateForm(sanitizedData);
            if (validationErrors.length > 0) {
                showNotification(validationErrors.join('<br>'), 'danger');
                return;
            }
            
            // Show loading state
            submitButton.textContent = 'Verifying...';
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            
            // Check if reCAPTCHA is available
            if (typeof grecaptcha === 'undefined') {
                showNotification('Security verification is not available. Please refresh the page and try again.', 'danger');
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
                return;
            }
            
            if (typeof grecaptcha.enterprise === 'undefined') {
                showNotification('Security verification is not properly loaded. Please refresh the page and try again.', 'danger');
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
                return;
            }

            // Execute reCAPTCHA
            grecaptcha.enterprise.ready(function() {
                grecaptcha.enterprise.execute('6Leg-rorAAAAAHmNOisI0o5uQyx4YN1dDrSutJDr', {action: 'contact_form'})
                .then(function(token) {
                    // Set the token in the hidden input
                    document.getElementById('recaptcha_token').value = token;
                    
                    // Create a new FormData with the token included
                    const finalFormData = new FormData();
                    
                    // Add the reCAPTCHA token first
                    finalFormData.append('recaptcha_token', token);
                    
                    // Add all sanitized form data
                    for (let [key, value] of sanitizedData.entries()) {
                        if (key !== 'recaptcha_token') {
                            finalFormData.append(key, value);
                        }
                    }
                    
                                         // Submit the final form data via AJAX
                     fetch('content/contact-simple.php', {
                         method: 'POST',
                         body: finalFormData
                     })
                    .then(response => {
                        //console.log('Response status:', response.status, response.statusText);
                        
                        if (!response.ok) {
                            // Handle specific status codes
                            if (response.status === 409) {
                                throw new Error('Server conflict - please try again in a few minutes');
                            } else if (response.status === 500) {
                                throw new Error('Server error - please try again later');
                            } else if (response.status === 403) {
                                throw new Error('Access denied - please check your connection');
                            } else {
                                throw new Error(`Server error (${response.status}): ${response.statusText}`);
                            }
                        }
                        
                        return response.text().then(text => {
                            try {
                                return JSON.parse(text);
                            } catch (e) {
                                console.error('Response is not valid JSON:', text);
                                throw new Error('Server returned invalid response format');
                            }
                        });
                    })
                    .then(data => {
                        if (data.type === 'success') {
                            showNotification(data.message, 'success');
                            contactForm.reset();
                        } else {
                            showNotification(data.message, 'danger');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showNotification('There was an error sending your message. Please try again.', 'danger');
                    })
                    .finally(() => {
                        // Reset button
                        submitButton.textContent = originalText;
                        submitButton.disabled = false;
                        submitButton.classList.remove('loading');
                    });
                })
                .catch(function(error) {
                    console.error('reCAPTCHA error:', error);
                    showNotification('Error with security verification. Please try again.', 'danger');
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                    submitButton.classList.remove('loading');
                });
            });
        });
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .about-features, .contact-form, .contact-info');
    animateElements.forEach(el => observer.observe(el));
    
    // Enhanced mobile menu behavior
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
        
        // Close mobile menu when clicking on a nav link
        const mobileNavLinks = navbarCollapse.querySelectorAll('.nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            });
        });
    }
    
    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Back to top button
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTopButton.className = 'btn btn-primary position-fixed';
    backToTopButton.style.cssText = 'bottom: 20px; right: 20px; z-index: 1000; width: 50px; height: 50px; border-radius: 50%; display: none;';
    backToTopButton.setAttribute('aria-label', 'Back to top');
    
    document.body.appendChild(backToTopButton);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Enhanced accessibility
    document.addEventListener('keydown', function(e) {
        // Escape key closes mobile menu
        if (e.key === 'Escape') {
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        }
    });
    
    // Service card hover effects
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Contact form validation enhancement
    const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
            }
        });
    });
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Performance optimization: Debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Apply debouncing to scroll events
    const debouncedScrollHandler = debounce(function() {
        // Handle scroll-based effects here
    }, 10);
    
    window.addEventListener('scroll', debouncedScrollHandler);

    // Set current year in copyright
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});
