
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

        // если adData имеет вложенный массив -> "расплющим"
        if (Array.isArray(adData[0])) {
            ads = adData[0];
        } else {
            ads = adData;
        }

        // рендерим новости
        renderNews();

        // запускаем рекламу (только теперь!)
        initAds();

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// просто вызываем fetchData, renderNews будет вызвана внутри
fetchData();

  
function renderNews() {
    const newsList = document.getElementById('news-list');
    newsList.innerHTML = ''; // очищаем список перед рендером

    newsData.forEach(item => {
        const li = document.createElement('li');
        li.className = 'news-item';

        // используем шаблон с проверкой наличия данных
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
        ${item.image ? `<div class="news-image">
            <img src="${item.image}" alt="Новость" style="cursor:pointer;">
        </div>` : ''}
        `;

        // добавляем возможность открыть картинку в новом окне при клике
        const img = li.querySelector('img');
        if (img) {
            img.addEventListener('click', () => window.open(item.image, '_blank'));
        }

        newsList.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', renderNews);


function initAds() {
    if (!ads || ads.length === 0) return;

    const adImage = document.getElementById("ad-image");
    const adLink = document.getElementById("ad-link");

    // генерируем случайный стартовый индекс
    let currentIndex = Math.floor(Math.random() * ads.length);

    function changeAd() {
        const ad = ads[currentIndex];
        if (!ad) return;

        adImage.style.opacity = 0;

        setTimeout(() => {
            adImage.src = ad.image;
            adLink.href = ad.url;
            adImage.style.opacity = 1;
        }, 500);

        // переключаем по кругу
        currentIndex = (currentIndex + 1) % ads.length;
    }

    changeAd(); // первая загрузка
    setInterval(changeAd, 600000); // каждые 10 минут
}
initAds();