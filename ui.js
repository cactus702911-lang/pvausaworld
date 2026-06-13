function initUI() {
    // 1. Path Management (Simplified with root-relative paths)
    const paths = (window.siteConfig && window.siteConfig.pathConfig) ? window.siteConfig.pathConfig : {
        product: 'product',
        category: 'category',
        blog: 'blog'
    };

    const mobileMenuBtn = document.getElementById('mobile-menu-btn'),
          mobileMenu = document.getElementById('mobile-menu'),
          mobileBackdrop = document.getElementById('mobile-menu-backdrop'),
          menuOpenIcon = document.getElementById('menu-open-icon'),
          menuCloseIcon = document.getElementById('menu-close-icon'),
          searchInput = document.getElementById('search-services'),
          categorySelect = document.getElementById('category-select'),
          productGrid = document.getElementById('product-grid');

    // 2. Header Search Logic
    const headerSearchBtn = document.getElementById('search-btn');
    const headerSearchContainer = document.getElementById('search-container');
    const headerSearchInput = document.getElementById('search-input');
    const headerSearchResults = document.getElementById('search-results');

    if (headerSearchBtn && headerSearchContainer && headerSearchInput && headerSearchResults) {
        // Toggle search overlay
        headerSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = headerSearchContainer.classList.contains('opacity-0');
            if (isHidden) {
                headerSearchContainer.classList.remove('opacity-0', 'pointer-events-none');
                headerSearchInput.focus();
            } else {
                headerSearchContainer.classList.add('opacity-0', 'pointer-events-none');
                headerSearchResults.classList.add('hidden');
                headerSearchInput.value = '';
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!headerSearchContainer.contains(e.target) && !headerSearchBtn.contains(e.target)) {
                headerSearchContainer.classList.add('opacity-0', 'pointer-events-none');
                headerSearchResults.classList.add('hidden');
            }
        });

        // Search logic
        headerSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (term.length < 2) {
                headerSearchResults.classList.add('hidden');
                return;
            }

            if (window.products) {
                const matches = window.products.filter(p => 
                    p.title.toLowerCase().includes(term) || 
                    (p.category && p.category.toLowerCase().includes(term))
                ).slice(0, 5); // Limit to 5 results

                if (matches.length > 0) {
                    headerSearchResults.innerHTML = matches.map(p => {
                        const url = `/${paths.product}/${p.slug}/`;
                        return `
                            <a href="${url}" class="block px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                                <div class="font-bold text-slate-800 text-sm">${p.title}</div>
                                <div class="text-xs text-slate-500 mt-0.5">${p.category} &bull; From $${p.min_price}</div>
                            </a>
                        `;
                    }).join('');
                    headerSearchResults.classList.remove('hidden');
                } else {
                    headerSearchResults.innerHTML = `<div class="px-4 py-3 text-sm text-slate-500 text-center">No products found</div>`;
                    headerSearchResults.classList.remove('hidden');
                }
            }
        });
    }

    // 2.1 Filter Products (Optimized)
    function filterProducts() {
        if (!productGrid) return;
        const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const selectedCategory = (categorySelect ? categorySelect.value : 'All Categories');
        const cards = productGrid.querySelectorAll('.card-glow');
        const isFilterActive = searchTerm !== '' || selectedCategory !== 'All Categories';
        const loadMoreBtnContainer = document.getElementById('view-all-products-container');
        
        // Use document fragment for better performance if we were adding/removing, 
        // but here we just toggle display. Still, we can minimize reflows.
        productGrid.style.display = 'none'; 
        
        let visibleCount = 0;
        let hasHiddenCards = false;
        cards.forEach(card => {
            const title = card.getAttribute('data-title') || card.querySelector('h3, .font-bold.text-slate-100, a')?.textContent.toLowerCase() || '';
            const category = card.getAttribute('data-category') || card.querySelector('.text-cyan-400')?.textContent || '';
            const matchesSearch = title.includes(searchTerm);
            const matchesCategory = selectedCategory === 'All Categories' || category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
            
            if (matchesSearch && matchesCategory) {
                const isLoadMoreCard = card.classList.contains('js-load-more-card');
                if (!isFilterActive && !window.allProductsLoaded && isLoadMoreCard) {
                    card.style.display = 'none';
                    hasHiddenCards = true;
                } else {
                    card.style.display = '';
                    visibleCount++;
                }
            } else {
                card.style.display = 'none';
            }
        });
        
        productGrid.style.display = '';

        // Toggle load more button container visibility
        if (loadMoreBtnContainer) {
            if (isFilterActive || window.allProductsLoaded || !hasHiddenCards) {
                loadMoreBtnContainer.classList.add('hidden');
            } else {
                loadMoreBtnContainer.classList.remove('hidden');
            }
        }

        let noResults = document.getElementById('no-results-message');
        if (visibleCount === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'no-results-message';
                noResults.className = 'col-span-full py-20 text-center';
                noResults.innerHTML = `
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                        <i data-lucide="search-x" class="w-8 h-8 text-slate-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">No results found</h3>
                    <p class="text-slate-400">Try adjusting your search or category filter</p>
                `;
                productGrid.appendChild(noResults);
                if (window.lucide) window.lucide.createIcons();
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    // Debounce search for better performance
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterProducts, 150);
        }, { passive: true });
    }
    if (categorySelect) categorySelect.addEventListener('change', filterProducts, { passive: true });

    // 2.2 View All Products Load More Logic
    window.allProductsLoaded = false;
    const viewAllProductsBtn = document.getElementById('view-all-products-btn');
    if (viewAllProductsBtn) {
        viewAllProductsBtn.addEventListener('click', () => {
            window.allProductsLoaded = true;
            filterProducts();
        });
    }

    // 3. Popup & Mobile Menu Logic (Streamlined)
    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
        if (mobileBackdrop) mobileBackdrop.classList.add('hidden', 'opacity-0', 'pointer-events-none');
        if (menuOpenIcon) menuOpenIcon.classList.remove('hidden');
        if (menuCloseIcon) menuCloseIcon.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
    window.closeMobileMenu = closeMobileMenu;

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('flex');
                if (mobileBackdrop) {
                    mobileBackdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                    mobileBackdrop.classList.add('opacity-100');
                }
                if (menuOpenIcon) menuOpenIcon.classList.add('hidden');
                if (menuCloseIcon) menuCloseIcon.classList.remove('hidden');
                document.body.classList.add('overflow-hidden');
            } else closeMobileMenu();
        });
    }

    if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('.mobile-cat-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const cat = toggle.getAttribute('data-cat');
            const items = document.getElementById(`mobile-items-${cat}`);
            const icon = toggle.querySelector('i');
            if (items) {
                const isHidden = items.classList.toggle('hidden');
                if (icon) icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    });

    window.openPopup = function() {
        const popup = document.getElementById('contact-popup');
        const popupBackdrop = document.getElementById('popup-backdrop');
        const popupPanel = document.getElementById('popup-panel');
        if (!popup) return;
        
        popup.classList.remove('hidden');
        setTimeout(() => {
            if (popupBackdrop) popupBackdrop.classList.remove('opacity-0', 'pointer-events-none');
            if (popupPanel) popupPanel.classList.remove('opacity-0', 'scale-95');
        }, 10);
        document.body.classList.add('overflow-hidden');
    };

    window.closePopup = function() {
        const popup = document.getElementById('contact-popup');
        const popupBackdrop = document.getElementById('popup-backdrop');
        const popupPanel = document.getElementById('popup-panel');
        if (!popup) return;
        
        if (popupBackdrop) popupBackdrop.classList.add('opacity-0', 'pointer-events-none');
        if (popupPanel) popupPanel.classList.add('opacity-0', 'scale-95');
        
        setTimeout(() => {
            popup.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300);
    };

    // 4. Tab Switching Logic (Robust & Independent)
    function handleTabSwitching() {
        // Use event delegation on the document for maximum robustness
        document.addEventListener('click', (e) => {
            const tabBtn = e.target.closest('[id^="tab-btn-"]');
            if (!tabBtn) return;

            const tabId = tabBtn.id.replace('tab-btn-', '');
            const tabContainer = tabBtn.closest('.mt-12'); // The tab wrapper
            if (!tabContainer) return;

            const allBtns = tabContainer.querySelectorAll('[id^="tab-btn-"]');
            const allTabs = tabContainer.querySelectorAll('[id^="tab-"]');

            const activeClass = "px-4 md:px-8 py-3 bg-white text-cyan-600 font-bold rounded-t-lg border-t border-x border-slate-200 text-sm relative top-[1px] transition-all";
            const inactiveClass = "px-4 md:px-8 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors";

            // Update Tabs
            allTabs.forEach(tab => {
                // Ensure we are only targeting the actual tab content divs, not the buttons
                if (tab.id === `tab-${tabId}`) {
                    tab.classList.remove('hidden');
                } else if (tab.id.startsWith('tab-') && !tab.id.includes('btn')) {
                    tab.classList.add('hidden');
                }
            });

            // Update Buttons
            allBtns.forEach(btn => {
                if (btn.id === `tab-btn-${tabId}`) btn.className = activeClass;
                else btn.className = inactiveClass;
            });

            if (window.lucide) window.lucide.createIcons();
        });
    }
    handleTabSwitching();

    // 5. Dynamic Hydration Logic (Ensures site_data.js updates reflect immediately)
    function hydratePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const dynamicProductPath = urlParams.get('p');
        const dynamicCategoryPath = urlParams.get('c');
        const path = dynamicProductPath || dynamicCategoryPath || window.location.pathname;
        
        const siteConfig = window.siteConfig || {};
        const paths = siteConfig.pathConfig || { product: 'product', category: 'category', blog: 'blog' };
        
        // If we came from 404 redirect, we might need to show a special UI or just hydrate the home
        if (dynamicProductPath || dynamicCategoryPath) {
            console.log("Dynamic route detected:", path);
            // In a real SPA we would swap templates here. 
            // For now, let's at least show the correct info if possible.
        }

        // Helper: Find item by slug in a list
        const findBySlug = (list, slug) => list ? list.find(item => item.slug === slug) : null;
        const getOverlayTitle = (product) => {
            const displayTitle = product && typeof product.display_title === 'string' ? product.display_title.trim() : '';
            if (displayTitle) return displayTitle;
            const title = product && typeof product.title === 'string' ? product.title : '';
            return title.replace(/^Buy\s+/i, '');
        };

        // 5a. Product Page Hydration
        if (path.includes(`/${paths.product}/`)) {
            const slugPart = path.split(`/${paths.product}/`)[1];
            if (!slugPart) return;
            let slug = slugPart.split(/[?#]/)[0];
            slug = slug.replace(/\/+$/, '');
            slug = slug.replace(/(?:index)?\.html$/, '');
            slug = slug.replace(/\/+$/, '');
            const product = findBySlug(window.products, slug);
            if (product) {
                console.log("Hydrating Product:", product.title);
                const titleEl = document.getElementById('detail-title') || document.querySelector('h1');
                const priceEl = document.getElementById('detail-price');
                const descEl = document.getElementById('detail-desc') || document.getElementById('long-desc');
                
                if (titleEl) titleEl.textContent = product.title;
                if (priceEl) priceEl.textContent = `$${product.min_price.toFixed(2)} - $${product.max_price.toFixed(2)}`;
                
                const shortDescEl = document.getElementById('detail-desc');
                if (shortDescEl) shortDescEl.textContent = product.short_description || product.description;

                // Update reviews count if elements exist
                const reviewCountBadge = document.getElementById('review-count-badge');
                if (reviewCountBadge && window.reviewsData) {
                    const count = window.reviewsData.filter(r => r.productId === product.id).length;
                    reviewCountBadge.textContent = count;
                }
                const reviewsCountLabel = document.getElementById('reviews-count-label');
                if (reviewsCountLabel && window.reviewsData) {
                    const count = window.reviewsData.filter(r => r.productId === product.id).length;
                    reviewsCountLabel.textContent = `${count} Reviews`;
                }
            }
        }
        
        // 5b. Category Page Hydration
        else if (path.includes(`/${paths.category}/`)) {
            const slugPart = path.split(`/${paths.category}/`)[1];
            if (!slugPart) return;
            let slug = slugPart.split(/[?#]/)[0];
            slug = slug.replace(/\/+$/, '');
            slug = slug.replace(/(?:index)?\.html$/, '');
            slug = slug.replace(/\/+$/, '');
            const category = findBySlug(window.categories, slug);
            if (category) {
                console.log("Hydrating Category:", category.name);
                const titleEl = document.querySelector('h1');
                if (titleEl) titleEl.textContent = category.name;
            }
        }

        // 5c. Global Elements (Header/Footer Links)
        // We can update the navigation links to use the latest slugs from paths
        document.querySelectorAll('a[data-type]').forEach(link => {
            const type = link.getAttribute('data-type');
            const slug = link.getAttribute('data-slug');
            if (type && paths[type]) {
                const newUrl = (type === 'home') ? '/' : `/${paths[type]}/${slug || ''}/`.replace(/\/+/g, '/');
                link.href = newUrl;
            }
        });

        // 5d. Product Grid Updates (for Home/Category pages)
        if (document.getElementById('product-grid') && window.products) {
            const cards = document.querySelectorAll('.card-glow');
            cards.forEach(card => {
                const cardLink = card.querySelector('a');
                if (!cardLink) return;
                
                // Extract slug from card link
                const href = cardLink.getAttribute('href');
                const slugPart = href.split(`/${paths.product}/`)[1];
                if (!slugPart) return;
                const slug = slugPart.replace(/\/+$/, '');
                
                const product = findBySlug(window.products, slug);
                if (product) {
                    // Check Active Status
                    if (product.active === false) {
                        card.style.display = 'none';
                        return;
                    }

                    // Update Title
                    const titleEl = card.querySelector('h3, .font-bold.text-slate-100');
                    if (titleEl) titleEl.textContent = getOverlayTitle(product);
                    
                    // Update Price
                    const priceEl = card.querySelector('.text-xl.font-black.text-white');
                    if (priceEl) priceEl.textContent = `$${product.min_price.toFixed(2)}`;
                }
            });
        }
    }
    hydratePage();

    // 7. Floating Multi-Chat Widget (WhatsApp & Telegram)
    function initWhatsAppChat() {
        const whatsappNum = window.siteConfig?.whatsapp;
        const telegramUsername = window.siteConfig?.telegram;
        if (!whatsappNum && !telegramUsername) return;

        const cleanNumber = whatsappNum ? whatsappNum.replace(/\D/g, '') : '';
        const waUrl = cleanNumber ? `https://wa.me/${cleanNumber}` : '';
        const tgUrl = telegramUsername ? `https://t.me/${telegramUsername}` : '';

        // Create Container
        const container = document.createElement('div');
        container.id = 'wa-floating-chat';
        
        // Add custom style tag for complete CSS independence
        const style = document.createElement('style');
        style.textContent = `
            #wa-floating-chat {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 16px;
                font-family: 'Outfit', 'Inter', sans-serif;
                transition: all 0.3s ease;
            }
            .wa-submenu {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 12px;
                opacity: 0;
                transform: translateY(20px) scale(0.9);
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .wa-submenu.open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }
            .wa-sub-item, .wa-main-item {
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
            }
            /* Sub Tooltips */
            .wa-sub-tooltip {
                background-color: #1e293b;
                color: #ffffff;
                font-size: 13px;
                font-weight: 700;
                padding: 8px 12px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.05);
                opacity: 0;
                transform: translateX(10px);
                transition: all 0.3s ease;
                pointer-events: none;
                white-space: nowrap;
            }
            .wa-sub-item:hover .wa-sub-tooltip {
                opacity: 1;
                transform: translateX(0);
            }
            /* Main Tooltip */
            .wa-main-tooltip {
                background-color: #ffffff;
                color: #1e293b;
                font-size: 14px;
                font-weight: 700;
                padding: 10px 16px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                border: 1px solid #f1f5f9;
                opacity: 0;
                transform: translateX(10px);
                transition: all 0.3s ease;
                pointer-events: none;
                white-space: nowrap;
            }
            .wa-main-tooltip-visible {
                opacity: 1 !important;
                transform: translateX(0) !important;
            }
            .wa-main-item:hover .wa-main-tooltip {
                opacity: 1;
                transform: translateX(0);
            }
            /* Launcher Button */
            .wa-launcher-btn {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                background: linear-gradient(135deg, #10b981, #059669);
                border: none;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                outline: none;
            }
            .wa-launcher-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 12px 30px rgba(16, 185, 129, 0.5);
            }
            .wa-launcher-btn svg {
                width: 28px;
                height: 28px;
                transition: transform 0.3s ease;
                fill: none;
                stroke: currentColor;
            }
            .wa-launcher-btn.active svg {
                transform: rotate(90deg);
            }
            /* Sub Buttons */
            .wa-sub-btn {
                width: 52px;
                height: 52px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                text-decoration: none;
            }
            .wa-sub-btn:hover {
                transform: scale(1.1) translateY(-2px);
            }
            .wa-wa-btn {
                background-color: #25d366;
                box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
            }
            .wa-wa-btn:hover {
                background-color: #20ba5a;
                box-shadow: 0 10px 24px rgba(37, 211, 102, 0.4);
            }
            .wa-tg-btn {
                background-color: #0088cc;
                box-shadow: 0 8px 20px rgba(0, 136, 204, 0.3);
            }
            .wa-tg-btn:hover {
                background-color: #0077b5;
                box-shadow: 0 10px 24px rgba(0, 136, 204, 0.4);
            }
            .wa-sub-btn svg {
                width: 24px;
                height: 24px;
                fill: currentColor;
            }
            /* Pulse Animation */
            @keyframes wa-pulse-ring {
                0% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.15); opacity: 0.3; }
                100% { transform: scale(1.3); opacity: 0; }
            }
            .wa-pulse-ring {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background-color: #10b981;
                animation: wa-pulse-ring 2s infinite ease-out;
                pointer-events: none;
            }
            /* Mobile Adjustments */
            @media (max-width: 768px) {
                #wa-floating-chat {
                    bottom: 16px;
                    right: 16px;
                    gap: 12px;
                }
                .wa-launcher-btn {
                    width: 56px;
                    height: 56px;
                }
                .wa-sub-btn {
                    width: 48px;
                    height: 48px;
                }
                .wa-sub-tooltip {
                    display: none !important;
                }
                .wa-main-tooltip {
                    display: none !important;
                }
            }
            .hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        // Build Inner HTML (Conditional based on WhatsApp and Telegram settings)
        let submenuContent = '';
        if (tgUrl) {
            submenuContent += `
                <div class="wa-sub-item">
                    <span class="wa-sub-tooltip">Telegram</span>
                    <a href="${tgUrl}" target="_blank" rel="noopener noreferrer" aria-label="Chat on Telegram" class="wa-sub-btn wa-tg-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                            <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.5-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"/>
                        </svg>
                    </a>
                </div>
            `;
        }
        if (waUrl) {
            submenuContent += `
                <div class="wa-sub-item">
                    <span class="wa-sub-tooltip">WhatsApp</span>
                    <a href="${waUrl}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" class="wa-sub-btn wa-wa-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 472l110.3-29c32.7 17.8 69 27.2 106.4 27.2 122.4 0 222-99.6 222-222 0-59.3-23-115.1-60.8-157.1zM223.9 446c-33.1 0-65.6-8.9-93.9-25.7l-6.7-4-65.7 17.2 17.5-64-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                    </a>
                </div>
            `;
        }

        container.innerHTML = `
            <div id="wa-submenu" class="wa-submenu">
                ${submenuContent}
            </div>
            <div class="wa-main-item">
                <span class="wa-main-tooltip" id="wa-main-tooltip">Contact Us</span>
                <button id="wa-launcher" class="wa-launcher-btn" aria-label="Toggle chat options">
                    <span class="wa-pulse-ring"></span>
                    <svg id="wa-icon-msg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <svg id="wa-icon-close" class="hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(container);

        // Core Interactive States
        const launcher = document.getElementById('wa-launcher');
        const submenu = document.getElementById('wa-submenu');
        const iconMsg = document.getElementById('wa-icon-msg');
        const iconClose = document.getElementById('wa-icon-close');
        const mainTooltip = document.getElementById('wa-main-tooltip');

        // Toggle Open/Close
        launcher.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = submenu.classList.toggle('open');
            launcher.classList.toggle('active', isOpen);
            if (isOpen) {
                iconMsg.classList.add('hidden');
                iconClose.classList.remove('hidden');
                if (mainTooltip) mainTooltip.classList.remove('wa-main-tooltip-visible');
            } else {
                iconMsg.classList.remove('hidden');
                iconClose.classList.add('hidden');
            }
        });

        // Close when clicking outside the widget
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                submenu.classList.remove('open');
                launcher.classList.remove('active');
                iconMsg.classList.remove('hidden');
                iconClose.classList.add('hidden');
            }
        });

        // Delayed display of main tooltip
        setTimeout(() => {
            if (mainTooltip && !submenu.classList.contains('open')) {
                mainTooltip.classList.add('wa-main-tooltip-visible');
            }
        }, 3000);

        // Hide main tooltip on user action
        launcher.addEventListener('mouseenter', () => {
            if (mainTooltip) mainTooltip.classList.remove('wa-main-tooltip-visible');
        });
    }
    initWhatsAppChat();

    // 6. Hydration Logic (Lucide Icons)
    function initIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        } else {
            // Retry if lucide is not yet loaded
            setTimeout(initIcons, 100);
        }
    }
    initIcons();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
else initUI();
