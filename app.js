// app.js
// Palm Beach Pass - Main Application Logic with Travel Website Color Scheme

class PalmBeachPassApp {
    constructor() {
        this.state = {
            isLoggedIn: false,
            currentUser: null,
            cart: [],
            passes: [],
            attractions: [],
            map: null,
            markers: [],
            currentFilter: 'all',
            installPrompt: null
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🌴 Initializing Palm Beach Pass PWA...');
            
            // Register service worker
            await this.registerServiceWorker();
            
            // Load data
            await this.loadAppData();
            
            // Setup authentication
            this.setupAuth();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup PWA features
            this.setupPWA();
            
            // Initialize UI
            this.initializeUI();
            
            console.log('✅ Palm Beach Pass PWA initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showToast('Failed to load app. Please refresh the page.', 'error');
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('SW registered:', registration);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showToast('New version available! Refresh to update.', 'info');
                        }
                    });
                });
            } catch (error) {
                console.log('SW registration failed:', error);
            }
        }
    }

    async loadAppData() {
        try {
            // Load passes data
            const passesResponse = await fetch('/data/passes.json');
            if (passesResponse.ok) {
                this.state.passes = await passesResponse.json();
            } else {
                // Fallback data
                this.state.passes = this.getDefaultPasses();
            }
            
            // Load attractions data
            const attractionsResponse = await fetch('/data/attractions.json');
            if (attractionsResponse.ok) {
                this.state.attractions = await attractionsResponse.json();
            } else {
                // Fallback data
                this.state.attractions = this.getDefaultAttractions();
            }
            
            console.log('Data loaded:', {
                passes: this.state.passes.length,
                attractions: this.state.attractions.length
            });
        } catch (error) {
            console.warn('Failed to load data files, using defaults:', error);
            this.state.passes = this.getDefaultPasses();
            this.state.attractions = this.getDefaultAttractions();
        }
    }

    getDefaultPasses() {
        return [
            {
                id: '1-day',
                name: '1 Day Pass',
                duration: 1,
                prices: { adult: 89, child: 69 },
                features: ['Access to all attractions', 'Skip-the-line privileges', 'Digital QR pass', 'Perfect for day trips'],
                badge: null
            },
            {
                id: '3-day',
                name: '3 Day Pass',
                duration: 3,
                prices: { adult: 189, child: 149 },
                features: ['Access to all attractions', 'Skip-the-line privileges', 'Restaurant discounts', 'Ideal for weekends'],
                badge: 'Most Popular'
            },
            {
                id: '5-day',
                name: '5 Day Pass',
                duration: 5,
                prices: { adult: 269, child: 209 },
                features: ['Access to all attractions', 'VIP experiences included', 'Premium dining benefits', 'Perfect for vacations'],
                badge: null
            },
            {
                id: '7-day',
                name: '7 Day Pass',
                duration: 7,
                prices: { adult: 329, child: 259 },
                features: ['Unlimited attraction access', 'All VIP benefits', 'Exclusive events access', 'Ultimate Palm Beach experience'],
                badge: 'Best Value'
            }
        ];
    }

    getDefaultAttractions() {
        return [
            {
                id: 'worth-avenue',
                name: 'Worth Avenue Shopping',
                category: 'shopping',
                description: 'Luxury shopping destination with world-class boutiques, galleries, and dining options.',
                regularPrice: 0,
                coordinates: { lat: 26.7006, lng: -80.0364 },
                image: '🛍️',
                gradient: 'linear-gradient(135deg, #FF6B35, #2E86AB)',
                featured: true
            },
            {
                id: 'flagler-museum',
                name: 'Flagler Museum',
                category: 'culture',
                description: 'Historic mansion showcasing America\'s Gilded Age with guided tours and exhibitions.',
                regularPrice: 18,
                coordinates: { lat: 26.7138, lng: -80.0484 },
                image: '🏛️',
                gradient: 'linear-gradient(135deg, #2E86AB, #A8E6CF)',
                featured: true
            },
            {
                id: 'palm-beach-zoo',
                name: 'Palm Beach Zoo',
                category: 'family',
                description: 'Home to over 900 animals with interactive exhibits and conservation programs.',
                regularPrice: 24.95,
                coordinates: { lat: 26.6502, lng: -80.6749 },
                image: '🦁',
                gradient: 'linear-gradient(135deg, #FF6B35, #FFD23F)',
                featured: true
            },
            {
                id: 'science-center',
                name: 'South Florida Science Center',
                category: 'family',
                description: 'Interactive science museum with planetarium, aquarium, and hands-on exhibits.',
                regularPrice: 19.95,
                coordinates: { lat: 26.6900, lng: -80.0725 },
                image: '🔬',
                gradient: 'linear-gradient(135deg, #2E86AB, #FF6B35)',
                featured: true
            },
            {
                id: 'peanut-island',
                name: 'Peanut Island Park',
                category: 'nature',
                description: 'Scenic island park perfect for snorkeling, camping, and beach activities.',
                regularPrice: 15,
                coordinates: { lat: 26.7755, lng: -80.0450 },
                image: '🏝️',
                gradient: 'linear-gradient(135deg, #A8E6CF, #FFD23F)',
                featured: false
            },
            {
                id: 'breakers',
                name: 'The Breakers Palm Beach',
                category: 'dining',
                description: 'Iconic luxury resort with world-class dining, spa, and oceanfront activities.',
                regularPrice: 50,
                coordinates: { lat: 26.7173, lng: -80.0395 },
                image: '🏨',
                gradient: 'linear-gradient(135deg, #FF6B35, #2E86AB)',
                featured: true
            },
            {
                id: 'norton-museum',
                name: 'Norton Museum of Art',
                category: 'culture',
                description: 'Premier art museum featuring American, European, and Chinese collections.',
                regularPrice: 18,
                coordinates: { lat: 26.7000, lng: -80.0500 },
                image: '🎨',
                gradient: 'linear-gradient(135deg, #2E86AB, #A8E6CF)',
                featured: false
            },
            {
                id: 'lion-country-safari',
                name: 'Lion Country Safari',
                category: 'family',
                description: 'Drive-through safari adventure featuring over 1,000 animals roaming freely across 320 acres.',
                regularPrice: 39.95,
                coordinates: { lat: 26.6700, lng: -80.1800 },
                image: '🦁',
                gradient: 'linear-gradient(135deg, #FF6B35, #FFD23F)',
                featured: true
            },
            {
                id: 'mounts-botanical-garden',
                name: 'Mounts Botanical Garden',
                category: 'nature',
                description: 'Tropical paradise featuring the largest botanical garden in Palm Beach County.',
                regularPrice: 10,
                coordinates: { lat: 26.6400, lng: -80.0900 },
                image: '🌺',
                gradient: 'linear-gradient(135deg, #A8E6CF, #FFF3A0)',
                featured: false
            },
            {
                id: 'rapids-water-park',
                name: 'Rapids Water Park',
                category: 'family',
                description: 'South Florida\'s premier water park featuring thrilling slides, lazy river, and wave pool.',
                regularPrice: 34.99,
                coordinates: { lat: 26.6300, lng: -80.1200 },
                image: '💦',
                gradient: 'linear-gradient(135deg, #2E86AB, #FF6B35)',
                featured: true
            }
        ];
    }

    setupAuth() {
        // Check if user is already logged in
        const savedAuth = localStorage.getItem('pbp_auth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                if (authData.isLoggedIn && authData.user) {
                    this.state.isLoggedIn = true;
                    this.state.currentUser = authData.user;
                    this.updateAuthUI();
                }
            } catch (error) {
                console.error('Failed to parse saved auth:', error);
                localStorage.removeItem('pbp_auth');
            }
        }

        // Load cart
        const savedCart = localStorage.getItem('pbp_cart');
        if (savedCart) {
            try {
                this.state.cart = JSON.parse(savedCart);
                this.updateCartBadge();
            } catch (error) {
                console.error('Failed to parse saved cart:', error);
                localStorage.removeItem('pbp_cart');
            }
        }
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Online/offline handling
        window.addEventListener('online', () => {
            this.showToast('Back online! 🌐', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast('You\'re offline. Some features may be limited.', 'warning');
        });

        // Intersection Observer for animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        document.querySelectorAll('.pass-card, .attraction-card, .step-card').forEach(el => {
            observer.observe(el);
        });
    }

    setupPWA() {
        // Install prompt handling
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.state.installPrompt = e;
            this.showInstallBanner();
        });

        // Handle successful installation
        window.addEventListener('appinstalled', () => {
            this.showToast('Palm Beach Pass installed successfully! 🎉', 'success');
            this.hideInstallBanner();
            this.state.installPrompt = null;
        });
    }

    initializeUI() {
        // Render passes
        this.renderPasses();
        
        // Render featured attractions
        this.renderFeaturedAttractions();
        
        // Update auth UI
        this.updateAuthUI();
        
        // Update cart badge
        this.updateCartBadge();
        
        // Initialize map after a short delay
        setTimeout(() => {
            this.initializeMap();
        }, 1000);
    }

    renderPasses() {
        const passGrid = document.getElementById('passGrid');
        if (!passGrid) return;

        passGrid.innerHTML = this.state.passes.map(pass => `
            <div class="pass-card" data-pass-id="${pass.id}" onclick="window.AppInstance.selectPass('${pass.id}')">
                ${pass.badge ? `<div class="pass-badge">${pass.badge}</div>` : ''}
                <div class="pass-header">
                    <div class="pass-days">${pass.duration}</div>
                    <div class="pass-label">Day Pass</div>
                </div>
                <div class="pass-body">
                    <div class="pass-price">
                        <div class="price-item">
                            <div class="price-label">Adult</div>
                            <div class="price-value">$${pass.prices.adult}</div>
                        </div>
                        <div class="price-item">
                            <div class="price-label">Child</div>
                            <div class="price-value">$${pass.prices.child}</div>
                        </div>
                    </div>
                    <ul class="pass-features">
                        ${pass.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    <button class="btn-select-pass">Select Pass</button>
                </div>
            </div>
        `).join('');
    }

    renderFeaturedAttractions() {
        const attractionsGrid = document.getElementById('attractionsGrid');
        if (!attractionsGrid) return;

        const featuredAttractions = this.state.attractions.filter(attr => attr.featured).slice(0, 6);
        
        attractionsGrid.innerHTML = featuredAttractions.map(attraction => `
            <div class="attraction-card" data-attraction-id="${attraction.id}" onclick="window.AppInstance.openAttractionDetails('${attraction.id}')">
                <div class="attraction-image" style="background: ${attraction.gradient}">
                    <div style="font-size: 4rem;">${attraction.image}</div>
                    <div class="category-tag">${this.getCategoryIcon(attraction.category)} ${attraction.category}</div>
                    <div class="free-badge">FREE</div>
                </div>
                <div class="attraction-info">
                    <h3>${attraction.name}</h3>
                    <div class="price-row">
                        ${attraction.regularPrice > 0 ? `<span class="regular-price">Regular $${attraction.regularPrice}</span>` : ''}
                        <span style="color: var(--success); font-weight: 600;">FREE with pass</span>
                    </div>
                    <p class="attraction-desc">${attraction.description}</p>
                </div>
            </div>
        `).join('');
    }

    getCategoryIcon(category) {
        const icons = {
            shopping: '🛍️',
            culture: '🏛️',
            family: '👨‍👩‍👧‍👦',
            nature: '🌿',
            dining: '🍽️',
            adventure: '🎯'
        };
        return icons[category] || '🎢';
    }

    // Map Functions
    initializeMap() {
        console.log('Initializing map...');
        
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        try {
            // Check if Google Maps is available (mock or real)
            if (typeof google === 'undefined' || !google.maps) {
                console.log('Google Maps not available, showing fallback');
                this.handleMapLoadError();
                return;
            }

            // Center map on Palm Beach County
            const palmBeachCenter = { lat: 26.7000, lng: -80.0500 };
            
            this.state.map = new google.maps.Map(mapContainer, {
                zoom: 11,
                center: palmBeachCenter,
                styles: this.getMapStyles(),
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });

            // Add attraction markers with a small delay for better UX
            setTimeout(() => {
                this.addAttractionMarkers();
            }, 500);
            
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.handleMapLoadError();
        }
    }

    getMapStyles() {
        return [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#2E86AB' }]
            },
            {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#FFF3A0' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#A8E6CF' }]
            }
        ];
    }

    addAttractionMarkers() {
        if (!this.state.map) return;

        // Clear existing markers
        this.state.markers.forEach(marker => {
            if (marker.setMap) marker.setMap(null);
        });
        this.state.markers = [];

        this.state.attractions.forEach(attraction => {
            if (!attraction.coordinates) return;

            try {
                const markerIcon = this.createCustomMarker(attraction.category);
                
                const marker = new google.maps.Marker({
                    position: attraction.coordinates,
                    map: this.state.map,
                    title: attraction.name,
                    icon: markerIcon,
                    animation: google.maps.Animation.DROP,
                    category: attraction.category
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: this.createInfoWindowContent(attraction)
                });

                marker.addListener('click', () => {
                    // Close other info windows
                    this.state.markers.forEach(m => {
                        if (m.infoWindow && m.infoWindow.close) {
                            m.infoWindow.close();
                        }
                    });
                    
                    infoWindow.open(this.state.map, marker);
                });

                marker.infoWindow = infoWindow;
                marker.attractionData = attraction;
                this.state.markers.push(marker);
            } catch (error) {
                console.error('Failed to create marker for:', attraction.name, error);
            }
        });

        console.log(`Created ${this.state.markers.length} attraction markers`);
    }

    createCustomMarker(category) {
        const colors = {
            shopping: '#FF6B35',
            culture: '#2E86AB',
            family: '#FFD23F',
            nature: '#A8E6CF',
            dining: '#FF6B35',
            adventure: '#2E86AB'
        };

        const color = colors[category] || '#FF6B35';
        const icon = this.getCategoryIcon(category);
        
        // Return simple object for mock implementation
        return {
            emoji: icon,
            color: color,
            category: category
        };
    }

    createInfoWindowContent(attraction) {
        return `
            <div class="custom-info-window">
                <div class="info-window-header">
                    <div class="info-window-title">${attraction.name}</div>
                    <div class="info-window-category">${this.getCategoryIcon(attraction.category)} ${attraction.category.toUpperCase()}</div>
                </div>
                <div class="info-window-body">
                    <div class="info-window-description">${attraction.description}</div>
                    <div class="info-window-price">
                        ${attraction.regularPrice > 0 ? `<span class="info-window-regular">Regular $${attraction.regularPrice}</span>` : ''}
                        <span class="info-window-free">FREE with Pass</span>
                    </div>
                </div>
                <div class="info-window-actions">
                    <button class="btn-info-action" onclick="window.AppInstance.selectPass('3-day')">Get Pass</button>
                    <button class="btn-info-action" onclick="window.AppInstance.openAttractionDetails('${attraction.id}')">Details</button>
                </div>
            </div>
        `;
    }

    // Filter attractions on map
    filterAttractions(category) {
        // Update active filter tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-category="${category}"]`);
        if (activeTab) activeTab.classList.add('active');

        this.state.currentFilter = category;

        // Filter markers
        this.state.markers.forEach(marker => {
            const attraction = marker.attractionData;
            const shouldShow = category === 'all' || attraction.category === category;
            
            if (marker.setVisible) {
                marker.setVisible(shouldShow);
            }
            
            if (shouldShow && marker.setAnimation && google.maps.Animation) {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    if (marker.setAnimation) marker.setAnimation(null);
                }, 600);
            }
            
            if (!shouldShow && marker.infoWindow && marker.infoWindow.close) {
                marker.infoWindow.close();
            }
        });

        const categoryName = category === 'all' ? 'all' : category;
        this.showToast(`Showing ${categoryName} attractions`, 'info');
    }

    handleMapLoadError() {
        console.log('Map failed to load, showing fallback');
        const mapContainer = document.getElementById('map');
        const fallback = document.getElementById('mapFallback');
        
        if (mapContainer) mapContainer.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
    }

    // Authentication Functions
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmitBtn');
        const loginText = document.getElementById('loginText');
        const spinner = document.getElementById('loginSpinner');

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        // Show loading
        submitBtn.disabled = true;
        loginText.style.display = 'none';
        spinner.style.display = 'inline-block';

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Demo authentication
            if (email === 'demo@palmbeachpass.com' && password === 'demo123') {
                const userData = {
                    id: 'demo-user',
                    email: email,
                    name: 'Demo User',
                    joinDate: '2025-01-01'
                };

                this.state.isLoggedIn = true;
                this.state.currentUser = userData;

                // Save to localStorage
                localStorage.setItem('pbp_auth', JSON.stringify({
                    isLoggedIn: true,
                    user: userData,
                    timestamp: Date.now()
                }));

                this.updateAuthUI();
                this.closeModal('loginModal');
                this.showToast('Welcome back! 🎉', 'success');

                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            } else {
                this.showToast('Invalid credentials. Use demo@palmbeachpass.com / demo123', 'error');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showToast('Login failed. Please try again.', 'error');
        } finally {
            // Reset button
            submitBtn.disabled = false;
            loginText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    logout() {
        this.state.isLoggedIn = false;
        this.state.currentUser = null;
        
        localStorage.removeItem('pbp_auth');
        
        this.updateAuthUI();
        this.showToast('Logged out successfully', 'info');
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        
        if (this.state.isLoggedIn && loginBtn) {
            loginBtn.textContent = 'My Account';
            loginBtn.onclick = () => {
                window.location.href = 'customer-account.html';
            };
        }
    }

    // Pass Selection
    selectPass(passId) {
        const pass = this.state.passes.find(p => p.id === passId);
        if (!pass) {
            this.showToast('Pass not found', 'error');
            return;
        }

        if (!this.state.isLoggedIn) {
            this.showLogin();
            this.showToast('Please sign in to purchase a pass', 'info');
            return;
        }

        // Add to cart
        this.state.cart = [{
            passId: pass.id,
            name: pass.name,
            duration: pass.duration,
            adultPrice: pass.prices.adult,
            childPrice: pass.prices.child,
            adultQty: 1,
            childQty: 0,
            timestamp: Date.now()
        }];

        this.saveCart();
        this.updateCartBadge();
        
        this.showToast(`${pass.name} added to cart! 🎫`, 'success');
        
        // Navigate to checkout after delay
        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 1500);
    }

    saveCart() {
        localStorage.setItem('pbp_cart', JSON.stringify(this.state.cart));
    }

    updateCartBadge() {
        const badge = document.getElementById('cartCount');
        const count = this.state.cart.length;
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Modal Functions
    showLogin() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            setTimeout(() => {
                const firstInput = modal.querySelector('input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    showSignup() {
        this.closeAllModals();
        this.showToast('Sign up coming soon! Use demo login for now.', 'info');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    // Cart Functions
    showCart() {
        if (this.state.cart.length === 0) {
            this.showToast('Your cart is empty. Select a pass to get started!', 'info');
            return;
        }

        const item = this.state.cart[0];
        this.showToast(`Cart: ${item.name} - ${item.adultPrice}`, 'info');
        
        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 1000);
    }

    // Attraction Functions
    openAttractionDetails(attractionId) {
        const attraction = this.state.attractions.find(a => a.id === attractionId);
        if (!attraction) return;

        const priceText = attraction.regularPrice > 0 ? `Regular: ${attraction.regularPrice}` : '';
        const message = `🎫 ${attraction.name} | ${priceText} | FREE with Palm Beach Pass! | ${attraction.description}`;
        this.showToast(message, 'info');
    }

    viewAllAttractions() {
        // In a real app, this would navigate to attractions page
        this.showToast('Loading all 156+ attractions...', 'info');
        setTimeout(() => {
            this.showToast('All attractions page would load here!', 'success');
        }, 1000);
    }

    // PWA Functions
    showInstallBanner() {
        const banner = document.getElementById('installBanner');
        if (banner && !localStorage.getItem('pbp_install_dismissed')) {
            banner.classList.add('show');
        }
    }

    hideInstallBanner() {
        const banner = document.getElementById('installBanner');
        if (banner) {
            banner.classList.remove('show');
        }
    }

    async installApp() {
        if (this.state.installPrompt) {
            try {
                const result = await this.state.installPrompt.prompt();
                console.log('Install prompt result:', result);
                
                if (result.outcome === 'accepted') {
                    this.showToast('Thanks for installing Palm Beach Pass! 🎉', 'success');
                }
                
                this.state.installPrompt = null;
                this.hideInstallBanner();
            } catch (error) {
                console.error('Install failed:', error);
                this.showToast('Installation failed. Please try again.', 'error');
            }
        } else {
            // Fallback instructions
            this.showToast('To install: Use your browser\'s "Add to Home Screen" option', 'info');
            this.hideInstallBanner();
        }
    }

    dismissInstall() {
        this.hideInstallBanner();
        localStorage.setItem('pbp_install_dismissed', 'true');
    }

    // Utility Functions
    showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = 70;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Analytics (placeholder)
    trackEvent(eventName, data = {}) {
        console.log('📊 Event:', eventName, data);
        
        // In a real app, send to analytics service
        if (navigator.onLine) {
            // fetch('/api/analytics', { ... })
        }
    }
}

// Global Functions (for onclick handlers)
window.scrollToTop = () => window.AppInstance?.scrollToTop();
window.scrollToSection = (id) => window.AppInstance?.scrollToSection(id);
window.showLogin = () => window.AppInstance?.showLogin();
window.showSignup = () => window.AppInstance?.showSignup();
window.showCart = () => window.AppInstance?.showCart();
window.closeModal = (id) => window.AppInstance?.closeModal(id);
window.handleLogin = (e) => window.AppInstance?.handleLogin(e);
window.filterAttractions = (category) => window.AppInstance?.filterAttractions(category);
window.viewAllAttractions = () => window.AppInstance?.viewAllAttractions();
window.installApp = () => window.AppInstance?.installApp();
window.dismissInstall = () => window.AppInstance?.dismissInstall();
window.handleMapLoadError = () => window.AppInstance?.handleMapLoadError();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.AppInstance = new PalmBeachPassApp();
});

// Handle page visibility for PWA features
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.AppInstance) {
        window.AppInstance.trackEvent('page_visible');
    }
});

console.log('🌴 Palm Beach Pass PWA loaded successfully!');
