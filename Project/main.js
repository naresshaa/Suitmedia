document.addEventListener('DOMContentLoaded', () => {

  let lastScroll = 0;
  const header = document.getElementById('header');
  let ticking = false; 

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll + 10) {
          header.classList.add('hidden'); 
        } else if (currentScroll < lastScroll - 10 || currentScroll === 0) {
          header.classList.remove('hidden'); 
        }
        lastScroll = currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  });

  const navLinks = document.querySelectorAll('header nav a');

  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      if (this.getAttribute('href') === '#') {
        event.preventDefault();
      }

      const currentActive = document.querySelector('header nav a.active');
      if (currentActive) {
        currentActive.classList.remove('active');
      }

      this.classList.add('active');
    });
  });

  const bannerImg = document.querySelector('.banner img');
  const bannerText = document.querySelector('.banner .text');

  window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    bannerImg.style.transform = `translateY(${scroll * 0.3}px)`;
    bannerText.style.transform = `translate(-50%, calc(-50% + ${scroll * 0.15}px))`;
  });

  const postsEl = document.getElementById('posts');
  const showingEl = document.getElementById('showing');
  const totalEl = document.getElementById('total');
  const paginationEl = document.getElementById('pagination');
  const perPageEl = document.getElementById('perPage');
  const sortEl = document.getElementById('sort');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessageEl = document.getElementById('error-message');

  const state = {
    page: parseInt(localStorage.getItem('page')) || 1, 
    size: parseInt(localStorage.getItem('size')) || 10, 
    sort: localStorage.getItem('sort') || '-published_at', 
  };

  function saveState() {
    localStorage.setItem('page', state.page);
    localStorage.setItem('size', state.size);
    localStorage.setItem('sort', state.sort);
  }

  async function fetchPosts() {
    loadingIndicator.style.display = 'block';
    errorMessageEl.style.display = 'none';
    postsEl.innerHTML = '';

    try {
        const API_PROXY_URL = 'http://localhost:3000'; 
        const url = `${API_PROXY_URL}/api/ideas?page[number]=${state.page}&page[size]=${state.size}&append[]=small_image&append[]=medium_image&sort=${state.sort}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const json = await res.json();
      renderPosts(json); 
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      errorMessageEl.textContent = 'Failed to load ideas. Please try again later.';
      errorMessageEl.style.display = 'block'; 
    } finally {
      loadingIndicator.style.display = 'none'; 
    }
  }

  function renderPosts(data) {
    postsEl.innerHTML = ''; 

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      postsEl.innerHTML = '<p class="loading-indicator">No ideas found.</p>';
      showingEl.textContent = `0-0`;
      totalEl.textContent = `0`;
      paginationEl.innerHTML = ''; 
      return;
    }

    data.data.forEach(item => {
      const imageUrl = item.small_image?.url || item.medium_image?.url || `https://placehold.co/400x225/E0E0E0/333333?text=No+Image`;
      
      const publishedDate = new Date(item.published_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="thumb">
          <img loading="lazy" src="${imageUrl}" alt="${item.title || 'Idea Image'}">
        </div>
        <div class="content">
          <small class="date">${publishedDate}</small>
          <h3>${item.title || 'No Title Available'}</h3>
        </div>`;
      postsEl.appendChild(card);
    });

    const start = (state.page - 1) * state.size + 1;
    const end = Math.min(state.page * state.size, data.meta.total);
    showingEl.textContent = `${start}-${end}`;
    totalEl.textContent = data.meta.total;

    renderPagination(data.meta.total); 
  }

  function renderPagination(total) {
    paginationEl.innerHTML = ''; 
    const pages = Math.ceil(total / state.size); 

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = state.page === 1;
    prevBtn.onclick = () => {
      state.page--;
      saveState();
      fetchPosts();
    };
    paginationEl.appendChild(prevBtn);

    let startPage = Math.max(1, state.page - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(pages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === state.page) btn.disabled = true; 
      btn.onclick = () => {
        state.page = i;
        saveState();
        fetchPosts();
      };
      paginationEl.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = state.page === pages;
    nextBtn.onclick = () => {
      state.page++;
      saveState();
      fetchPosts();
    };
    paginationEl.appendChild(nextBtn);
  }

  perPageEl.value = state.size;
  sortEl.value = state.sort;

  perPageEl.onchange = () => {
    state.size = parseInt(perPageEl.value);
    state.page = 1; 
    saveState();
    fetchPosts();
  };

  sortEl.onchange = () => {
    state.sort = sortEl.value;
    state.page = 1; 
    saveState();
    fetchPosts();
  };

  fetchPosts();
});
