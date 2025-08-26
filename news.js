
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://istnqmqguvosyflgypxq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdG5xbXFndXZvc3lmbGd5cHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzA5NDYsImV4cCI6MjA3MTU0Njk0Nn0.d35e0PYruq_8RtMrvqNFSZT5ZPm0ImPLDqE-P6jnvBw";
const TABLE_NAME = "news";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let newsData = [];
let adData = [];
let ads = [];

async function fetchData() {
    try {
        const { data, error } = await supabase.from(TABLE_NAME).select('*');
        if (error) {
            console.error('Supabase error:', error);
            return;
        }

        newsData = [];
        adData = [];

        data.forEach(item => {
            if (item.News && Array.isArray(item.News)) newsData.push(...item.News);
            if (item.ad) adData.push(item.ad);
        });

        console.log('newsData:', newsData);
        console.log('adData:', adData);

        if (Array.isArray(adData[0])) {
            ads = adData[0];
        } else {
            ads = adData;
        }

        renderNews();


        initAds();

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}


fetchData();

  
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-image');
const modalOverlay = modal.querySelector('.image-modal__overlay');
const modalCloseBtn = modal.querySelector('.image-modal__close');

function openModal(src, alt = '') {
  modalImg.src = src;
  modalImg.alt = alt || 'Увеличенное изображение';
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden'; 
}

function closeModal() {
  modal.classList.remove('is-open');
  modalImg.src = '';
  document.body.style.overflow = '';
}

modalOverlay.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

let visibleCount = 0; 
const step = 5;      
let currentQuery = ''; 
function parseDateFromString(str) {
  if (!str) return new Date(0);
  const [time, date] = str.split(' ');
  const [hours, minutes] = (time || '00:00').split(':').map(Number);
  const [day, month, year] = (date || '01.01.1970').split('.').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function getFilteredSortedNews() {
  const q = currentQuery.trim().toLowerCase();
  const filtered = newsData.filter(item => {
    if (!q) return true;
    const hay = (
      (item.title || '') + ' ' +
      (item.fulltext || '') + ' ' +
      (item.source || '') + ' ' +
      (item.category || '')
    ).toLowerCase();
    return hay.includes(q);
  });

  return filtered.slice().sort((a, b) => parseDateFromString(b.time) - parseDateFromString(a.time));
}

function createNewsItem(item) {
  const li = document.createElement('li');
  li.className = 'news-item';

  li.innerHTML = `
    <div class="news-content">
      <div class="news-meta">
        <span class="news-time">${item.time || ''}</span>
        <span class="news-source">${item.source || ''}</span>
        <span class="news-category">${item.category || ''}</span>
      </div>
      <h3 class="news-title">${item.title || ''}</h3>
      <div class="news-fulltext">${item.fulltext || ''}</div>
    </div>
    ${item.image ? `
      <div class="news-image">
        <img src="${item.image}" alt="Новость" style="cursor: zoom-in;">
      </div>` : ''}
  `;

  const img = li.querySelector('img');
  if (img) img.addEventListener('click', () => openModal(item.image, item.title));

  return li;
}

function animateShow(li) {
  li.style.overflow = 'hidden';
  li.style.maxHeight = '0px';
  li.style.opacity = '0';
  requestAnimationFrame(() => {
    const target = li.scrollHeight;
    li.style.transition = 'max-height 0.5s ease, opacity 0.45s ease, padding 0.45s ease';
    li.style.maxHeight = target + 'px';
    li.style.opacity = '1';
  });

  function onTransitionEnd(e) {
    if (e.propertyName === 'max-height') {
      li.style.maxHeight = '';
      li.style.overflow = '';
      li.style.transition = '';
      li.removeEventListener('transitionend', onTransitionEnd);
    }
  }
  li.addEventListener('transitionend', onTransitionEnd);
}

function renderNews() {
  const newsList = document.getElementById('news-list');
  const newsNewList = document.getElementById('news-new-list');
  const loadMoreBtn = document.getElementById('load-more');

  const sortedNews = getFilteredSortedNews();

  if (sortedNews.length === 0) {
    newsNewList.innerHTML = '';
    newsList.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    const no = document.createElement('li');
    no.className = 'no-results';
    no.textContent = 'Ничего не найдено';
    newsList.appendChild(no);
    return;
  }

  if (visibleCount === 0) {
    newsNewList.innerHTML = '';
    newsList.innerHTML = '';
  }

  if (visibleCount === 0 && sortedNews.length > 0) {
    const first = sortedNews[0];
    const liFirst = createNewsItem(first);
    newsNewList.appendChild(liFirst);
    animateShow(liFirst);
    visibleCount = 1;
  }

  const nextNews = sortedNews.slice(visibleCount, visibleCount + step);
  nextNews.forEach(item => {
    const li = createNewsItem(item);
    newsList.appendChild(li);
    animateShow(li);
  });

  visibleCount += nextNews.length;

  if (visibleCount >= sortedNews.length) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'block';
  }
}

const loadMoreBtn = document.getElementById('load-more');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', renderNews);
}

const searchInput = document.querySelector('.search input');
const searchBtn = document.querySelector('.search button');

let searchDebounce = null;
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      currentQuery = searchInput.value.trim();
      visibleCount = 0;
      renderNews();
    }
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentQuery = searchInput.value.trim();
      visibleCount = 0;
      renderNews();
    }, 250);
  });
}

if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    currentQuery = searchInput ? searchInput.value.trim() : '';
    visibleCount = 0;
    renderNews();
  });
}

document.addEventListener('DOMContentLoaded', renderNews);

document.getElementById('load-more').addEventListener('click', renderNews);

function initAds() {
    if (!ads || ads.length === 0) return;

    const adImage = document.getElementById("ad-image");
    const adLink = document.getElementById("ad-link");

    let currentIndex = Math.floor(Math.random() * ads.length);

    function changeAd() {
        const ad = ads[currentIndex];
        if (!ad) return;

        adImage.src = ad.image;
        adLink.href = ad.url;
        adImage.style.opacity = 0;
        setTimeout(() => {
            adImage.src = ad.image;
            adLink.href = ad.url;
            adImage.style.opacity = 1;
        }, 500);

        currentIndex = (currentIndex + 1) % ads.length;
    }

    changeAd(); 
    setInterval(changeAd, 600000);
}
initAds();

