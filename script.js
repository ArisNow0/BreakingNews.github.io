document.addEventListener('DOMContentLoaded', function() {
    const timeElements = document.querySelectorAll('.news-time');
    const now = new Date();

    timeElements.forEach(el => {
        el.setAttribute('title', now.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }));
    });

    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('.news-image img');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.style.opacity = 1;
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => {
            img.style.opacity = 0;
            img.style.transition = 'opacity 0.3s';
            imageObserver.observe(img);
        });
    }
});

(async function () {
  const REFRESH_MS = 10 * 60 * 1000;
  const FALLBACK = { name: "Киев", lat: 50.4501, lon: 30.5234 };

  const cities = [
    { id: "Kiev", name: "Киев", lat: 50.4501, lon: 30.5234 },
    { id: "Lvov", name: "Львов", lat: 49.8397, lon: 24.0297 },
    { id: "Odessa", name: "Одесса", lat: 46.4825, lon: 30.7233 },
  ];

  function getCoords(timeoutMs = 8000) {
    return new Promise(resolve => {
      if (!("geolocation" in navigator)) return resolve(FALLBACK);
      const opts = { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 };
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(FALLBACK),
        opts
      );
    });
  }

  async function getCityName(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`;
      const res = await fetch(url, { headers: { "User-Agent": "weather-script" } });
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || FALLBACK.name;
    } catch {
      return FALLBACK.name;
    }
  }

  async function getTemperature(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;
      const res = await fetch(url);
      const data = await res.json();
      return Math.round(data.current_weather?.temperature ?? NaN);
    } catch {
      return NaN;
    }
  }

  async function updateWeather() {
    const el = document.getElementById("gorod");
    if (el) {
      el.textContent = "Определяем погоду…";
      const coords = await getCoords();
      const [city, temp] = await Promise.all([
        getCityName(coords.lat, coords.lon),
        getTemperature(coords.lat, coords.lon)
      ]);
      const safeCity = city || FALLBACK.name;
      const safeTemp = Number.isFinite(temp) ? temp : "—";
      el.textContent = `${safeCity}, ${safeTemp}°C`;
    }

    for (const city of cities) {
      const elCity = document.getElementById(city.id);
      if (!elCity) continue;
      elCity.textContent = `${city.name}: ...°C`;
      const temp = await getTemperature(city.lat, city.lon);
      const safeTemp = Number.isFinite(temp) ? `+${temp}°C` : "—";
      elCity.textContent = `${city.name}: ${safeTemp}`;
    }
  }

  async function updateCurrency() {
    try {
      const response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json');
      const data = await response.json();

      const usd = data.find(item => item.cc === 'USD');
      const eur = data.find(item => item.cc === 'EUR');

      if (usd && eur) {
        const usdToUah = usd.rate.toFixed(2);
        const eurToUah = eur.rate.toFixed(2);

        document.getElementById('valute').innerText = `USD ${usdToUah} | EUR ${eurToUah}`;
        document.getElementById('USDv').innerText = `USD: ${usdToUah} ₴`;
        document.getElementById('EURv').innerText = `EUR: ${eurToUah} ₴`;
      } else {
        throw new Error('Не удалось найти курсы валют');
      }
    } catch (error) {
      console.error('Ошибка при получении курса валют:', error);
    }
  }

  async function updateAll() {
    await Promise.all([updateWeather(), updateCurrency()]);
  }

  updateAll();

  setInterval(updateAll, REFRESH_MS);
})();

const newsList = document.getElementById('news-list');

newsList.addEventListener('click', e => {
    const item = e.target.closest('.news-item');
    if (!item) return;

    // Клик только по текстовой части
    if (!e.target.closest('.news-image')) {
        item.classList.toggle('open');
    }
});
const newsNewList = document.getElementById('news-new-list');

newsNewList.addEventListener('click', e => {
    const item = e.target.closest('.news-item');
    if (!item) return;

    // Клик только по текстовой части
    if (!e.target.closest('.news-image')) {
        item.classList.toggle('open');
    }
});

document.addEventListener('DOMContentLoaded', () => {

    const chips = document.querySelectorAll('.chip');
    const sourceChips = document.querySelectorAll('.source-chip');

    // Объединяем обработку кликов для всех фильтров
    function setupChips(list, isSource=false) {
        list.forEach(chip => {
            chip.addEventListener('click', () => {
                if (isSource && chip.textContent === "Все источники") {
                    // Деактивируем все остальные
                    list.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                } else if (isSource) {
                    chip.classList.toggle('active');
                    // Снимаем "Все источники", если выбран хотя бы один
                    const allChip = Array.from(list).find(c => c.textContent === "Все источники");
                    if (allChip) allChip.classList.remove('active');
                } else {
                    // Для темы просто переключаем активность
                    chip.classList.toggle('active');
                }
                applyFilter();
            });
        });
    }

    setupChips(chips);
    setupChips(sourceChips, true);

    function applyFilter() {
        const activeCategories = Array.from(document.querySelectorAll('.chip.active'))
            .map(c => c.textContent.trim().toLowerCase());
        const activeSources = Array.from(document.querySelectorAll('.source-chip.active'))
            .map(c => c.textContent.trim());

        const items = document.querySelectorAll('.news-item');
        items.forEach(item => {
            const catEl = item.querySelector('.news-category');
            const srcEl = item.querySelector('.news-source');

            const itemCat = catEl ? catEl.textContent.trim().toLowerCase() : '';
            const itemSrc = srcEl ? srcEl.textContent.trim() : '';

            const categoryMatch = activeCategories.length === 0 || activeCategories.includes(itemCat);
            const sourceMatch = activeSources.includes("Все источники") || activeSources.includes(itemSrc);

            if (categoryMatch && sourceMatch) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // Поддержка динамически добавляемых новостей
    const newsList = document.querySelector('.news-list');
    if (newsList) {
        const observer = new MutationObserver(() => applyFilter());
        observer.observe(newsList, { childList: true });
    }

    applyFilter(); // первый запуск
});