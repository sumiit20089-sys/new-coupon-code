// Utility function to check if a coupon is expired
function isExpired(dateString) {
  const expirationDate = new Date(dateString);
  const currentDate = new Date();
  return currentDate > expirationDate;
}

// Function to copy coupon code
function copyCoupon(code, buttonId) {
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById(buttonId);
    const originalText = btn.innerText;
    btn.innerText = "Copied!";
    btn.classList.add("btn-primary");
    btn.classList.remove("btn-outline");
    
    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-outline");
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy code: ", err);
  });
}

// Generate HTML for a single coupon card
function createCouponCard(coupon) {
  const isCouponExpired = isExpired(coupon.expirationDate);
  const badgeHtml = coupon.verified ? '<span class="badge badge-verified">Verified</span>' : '';
  const seniorBadgeHtml = coupon.seniorOnly ? '<span class="badge badge-senior mt-1">Senior Discount</span>' : '';
  
  return `
    <div class="coupon-card">
      <div class="coupon-header">
        <div>
          <div class="coupon-store">${coupon.storeName}</div>
          <div class="coupon-discount">${coupon.discount}</div>
        </div>
        <div>
          ${badgeHtml}
          ${seniorBadgeHtml}
        </div>
      </div>
      <h3 class="coupon-title">${coupon.title}</h3>
      <p class="coupon-desc">${coupon.description}</p>
      
      <div class="coupon-meta">
        <span>Category: ${coupon.category}</span>
        <span>Expires: ${new Date(coupon.expirationDate).toLocaleDateString()}</span>
      </div>
      
      <div class="coupon-actions">
        <div class="code-box" id="code-${coupon.id}">${coupon.code}</div>
      </div>
      <div class="coupon-actions mt-2">
        <button id="btn-copy-${coupon.id}" class="btn btn-outline btn-block" onclick="copyCoupon('${coupon.code}', 'btn-copy-${coupon.id}')">Copy Code</button>
        <a href="${coupon.url}" target="_blank" class="btn btn-primary btn-block text-center">Get Coupon</a>
      </div>
    </div>
  `;
}

// Main function to render coupons based on filters
function renderCoupons(containerId, filters = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let filtered = coupons.filter(c => c.active && !isExpired(c.expirationDate));

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(c => 
      c.storeName.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q) || 
      c.category.toLowerCase().includes(q)
    );
  }

  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(c => c.category.toLowerCase() === filters.category.toLowerCase());
  }

  if (filters.featuredOnly) {
    filtered = filtered.filter(c => c.featured);
  }

  if (filters.seniorOnly) {
    filtered = filtered.filter(c => c.seniorOnly);
  }

  // Sorting
  if (filters.sort === 'newest') {
    filtered.sort((a, b) => new Date(b.expirationDate) - new Date(a.expirationDate)); // Simplification for demo
  } else if (filters.sort === 'highest') {
    // Basic sorting logic based on the discount string (e.g., matching numbers)
    filtered.sort((a, b) => {
      const getVal = (str) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      return getVal(b.discount) - getVal(a.discount);
    });
  }

  // Update count
  const countEl = document.getElementById('coupon-count');
  if (countEl) {
    countEl.innerText = `${filtered.length} active coupons found`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No coupons found matching your criteria.</h3><p>Try adjusting your search or filters.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(c => createCouponCard(c)).join('');
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu Toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // Determine current page and logic
  const path = window.location.pathname;

  // Home Page
  if (document.getElementById('featured-coupons')) {
    renderCoupons('featured-coupons', { featuredOnly: true });
    
    // Recent coupons (just top 4 for demo)
    const recentContainer = document.getElementById('recent-coupons');
    if (recentContainer) {
      const activeCoupons = coupons.filter(c => c.active && !isExpired(c.expirationDate));
      recentContainer.innerHTML = activeCoupons.slice(0, 4).map(c => createCouponCard(c)).join('');
    }
  }

  // Senior Discounts Page
  if (document.getElementById('senior-coupons')) {
    renderCoupons('senior-coupons', { seniorOnly: true });
  }

  // Coupons Page with Filters and URL Params
  if (document.getElementById('all-coupons')) {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    let currentFilters = {
      category: categoryParam || 'all',
      search: '',
      sort: 'highest'
    };

    if (categoryParam && categoryFilter) {
      categoryFilter.value = categoryParam;
    }

    const updateCoupons = () => {
      currentFilters.search = searchInput ? searchInput.value : '';
      currentFilters.category = categoryFilter ? categoryFilter.value : 'all';
      currentFilters.sort = sortFilter ? sortFilter.value : 'highest';
      renderCoupons('all-coupons', currentFilters);
    };

    if (searchInput) searchInput.addEventListener('input', updateCoupons);
    if (categoryFilter) categoryFilter.addEventListener('change', updateCoupons);
    if (sortFilter) sortFilter.addEventListener('change', updateCoupons);

    // Initial render
    renderCoupons('all-coupons', currentFilters);
  }

  // Global search handler (from header or hero)
  const heroSearchBtn = document.getElementById('hero-search-btn');
  const heroSearchInput = document.getElementById('hero-search-input');
  
  if (heroSearchBtn && heroSearchInput) {
    heroSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const q = heroSearchInput.value.trim();
      if (q) {
        window.location.href = `coupons.html?search=${encodeURIComponent(q)}`;
      } else {
        window.location.href = 'coupons.html';
      }
    });
  }

  // Handle search from URL param on coupons.html
  if (document.getElementById('all-coupons')) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = searchParam;
        // manually trigger input event
        searchInput.dispatchEvent(new Event('input'));
      }
    }
  }
});
