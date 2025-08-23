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

    // Lazy loading изображений
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
  const EL_ID = "gorod";
  const REFRESH_MS = 10 * 60 * 1000; // 10 минут
  const FALLBACK = { name: "Киев", lat: 50.4501, lon: 30.5234 };

  function getCoords(timeoutMs = 8000) {
    return new Promise(resolve => {
      if (!("geolocation" in navigator)) return resolve(FALLBACK);
      const opts = { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 };
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(FALLBACK), // сюда попадает, если отказано
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
    const el = document.getElementById(EL_ID);
    if (!el) return;

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

  // Первый запуск
  updateWeather();

  // Каждые 10 минут
  setInterval(updateWeather, REFRESH_MS);
})();
