window.addEventListener('DOMContentLoaded', () => {
    console.log('Welcome to our website!');
    initNoticePane();
    initGalleryViewer();
    if (sessionStorage.getItem('welcomeShown') !== 'true') {
        sessionStorage.setItem('welcomeShown', 'true');
        const welcomeOverlay = document.createElement('div');
        welcomeOverlay.className = 'welcome-overlay';
        welcomeOverlay.setAttribute('role', 'status');

        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.textContent = 'Welcome to ASPI !';
        welcomeOverlay.append(welcomeMessage);
        document.body.append(welcomeOverlay);
        window.setTimeout(() => welcomeOverlay.remove(), 5000);
    }

    const datetimeBox = document.getElementById('datetime-display');
    let weatherDisplay;
    if (datetimeBox) {
        const datetimeText = document.createElement('span');
        datetimeText.id = 'datetime-text';
        datetimeBox.replaceChildren(datetimeText);

        weatherDisplay = document.createElement('span');
        weatherDisplay.className = 'weather-display';
        datetimeBox.append(weatherDisplay);
    }

    updateDateTime();
    window.setInterval(updateDateTime, 1000);
    if (weatherDisplay) {
        updateWeather(weatherDisplay);
        window.setInterval(() => updateWeather(weatherDisplay), 600000);
    }

    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    if (themeToggle) {
        themeToggle.checked = localStorage.getItem('theme') === 'dark';
        document.body.classList.toggle('dark-mode', themeToggle.checked);
        if (themeLabel) {
            themeLabel.textContent = themeToggle.checked ? 'Dark Mode' : 'Light Mode';
        }

        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', themeToggle.checked);
            localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
            if (themeLabel) {
                themeLabel.textContent = themeToggle.checked ? 'Dark Mode' : 'Light Mode';
            }
        });
    }
});

function initNoticePane() {
    if (document.querySelector('.site-notice-pane')) {
        return;
    }

    const navigationBars = document.querySelectorAll('.navbar');
    const navigation = navigationBars[navigationBars.length - 1];
    if (!navigation) {
        return;
    }

    const notices = [
        { title: 'উপবৃত্তির জন্য আবেদন ও ফরম ডাউনলোড', id: 4 },
        { title: 'শ্রী শ্রী শ্যামাপূজার ছুটি', id: 3 },
        { title: 'আবাসিক আবেদন ফরম সংগ্রহ', id: 2 },
        { title: 'শারদীয় দুর্গাপূজা ও শ্রী শ্রী লক্ষ্মীপূজার ছুটি', id: 1 }
    ];

    const pane = document.createElement('aside');
    pane.className = 'notice-strip site-notice-pane';
    pane.setAttribute('aria-label', 'Latest ASPI notices');

    const label = document.createElement('strong');
    label.className = 'notice-label';
    label.textContent = 'Latest Notices';

    const windowElement = document.createElement('div');
    windowElement.className = 'notice-window';
    windowElement.setAttribute('aria-label', 'Scrolling notice headlines');

    const track = document.createElement('div');
    track.className = 'notice-track';
    for (const notice of notices) {
        const item = document.createElement('span');
        const link = document.createElement('a');
        link.href = `https://www.aspi.edu.bd/live/notice.php?id=${notice.id}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = notice.title;
        item.append(link);
        track.append(item);
    }
    windowElement.append(track);

    const allNotices = document.createElement('a');
    allNotices.className = 'notice-link';
    allNotices.href = 'https://www.aspi.edu.bd/live/notices.php';
    allNotices.target = '_blank';
    allNotices.rel = 'noopener noreferrer';
    allNotices.textContent = 'All notices ↗';

    pane.append(label, windowElement, allNotices);
    navigation.insertAdjacentElement('afterend', pane);
}

function initGalleryViewer() {
    const galleryCards = Array.from(document.querySelectorAll('.gallery-card'));
    if (galleryCards.length === 0) {
        return;
    }

    const images = galleryCards.map(card => ({
        src: card.querySelector('img').src,
        alt: card.querySelector('img').alt,
        caption: card.querySelector('span') ? card.querySelector('span').textContent : ''
    }));

    const dialog = document.createElement('div');
    dialog.className = 'gallery-viewer';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Photo viewer');
    dialog.hidden = true;

    const toolbar = document.createElement('div');
    toolbar.className = 'gallery-viewer-toolbar';

    const counter = document.createElement('span');
    counter.className = 'gallery-viewer-counter';
    counter.setAttribute('aria-live', 'polite');

    const exitButton = document.createElement('button');
    exitButton.className = 'gallery-viewer-exit';
    exitButton.type = 'button';
    exitButton.textContent = 'Exit to Gallery';
    exitButton.addEventListener('click', closeViewer);

    const image = document.createElement('img');
    image.className = 'gallery-viewer-image';

    const caption = document.createElement('p');
    caption.className = 'gallery-viewer-caption';

    const controls = document.createElement('div');
    controls.className = 'gallery-viewer-controls';

    const previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.textContent = '← Previous';
    previousButton.setAttribute('aria-label', 'Show previous photo');

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.textContent = 'Next →';
    nextButton.setAttribute('aria-label', 'Show next photo');

    let activeIndex = 0;
    let previouslyFocusedElement;

    function showImage(index) {
        activeIndex = (index + images.length) % images.length;
        const current = images[activeIndex];
        image.src = current.src;
        image.alt = current.alt;
        caption.textContent = current.caption;
        counter.textContent = `${activeIndex + 1} / ${images.length}`;
    }

    function openViewer(index) {
        previouslyFocusedElement = document.activeElement;
        showImage(index);
        dialog.hidden = false;
        document.body.classList.add('gallery-viewer-open');
        exitButton.focus();
    }

    function closeViewer() {
        dialog.hidden = true;
        document.body.classList.remove('gallery-viewer-open');
        if (previouslyFocusedElement instanceof HTMLElement) {
            previouslyFocusedElement.focus();
        }
    }

    previousButton.addEventListener('click', () => showImage(activeIndex - 1));
    nextButton.addEventListener('click', () => showImage(activeIndex + 1));
    controls.append(previousButton, nextButton);
    toolbar.append(counter, exitButton);
    dialog.append(toolbar, image, caption, controls);
    document.body.append(dialog);

    galleryCards.forEach((card, index) => {
        card.addEventListener('click', event => {
            event.preventDefault();
            openViewer(index);
        });
    });

    dialog.addEventListener('click', event => {
        if (event.target === dialog) {
            closeViewer();
        }
    });

    document.addEventListener('keydown', event => {
        if (dialog.hidden) {
            return;
        }
        if (event.key === 'Escape') {
            closeViewer();
        } else if (event.key === 'ArrowLeft') {
            showImage(activeIndex - 1);
        } else if (event.key === 'ArrowRight') {
            showImage(activeIndex + 1);
        }
    });
}

const fallbackCoordinates = { latitude: 22.2106, longitude: 92.0113 };

function changeBackgroundColor() {
    const randomColor = `#${Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0')}`;
    document.body.style.backgroundColor = randomColor;
}

function updateDateTime() {
    const now = new Date();
    const hour = now.getHours();
    const hours = String(hour % 12 || 12).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const period = hour < 12 ? 'AM' : 'PM';
    let greeting;
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning!';
    } else if (hour >= 12 && hour < 15) {
        greeting = 'Good Noon!';
    } else if (hour >= 15 && hour < 18) {
        greeting = 'Good After Noon!';
    } else if (hour >= 18) {
        greeting = 'Good Evening!';
    } else {
        greeting = 'Good Night!';
    }
    const timeString = `${hours}:${minutes}:${seconds} ${period}`;
    const dayDate = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const fullDateString = `${greeting} | ${timeString} | ${dayDate}/${month}/${year} | ${dayName}`;

    const datetimeText = document.getElementById('datetime-text');
    if (datetimeText) {
        datetimeText.textContent = fullDateString;
    }
}

async function updateWeather(weatherDisplay) {
    try {
        let coordinates;
        try {
            const savedCoordinates = getSavedCoordinates();
            if (savedCoordinates) {
                coordinates = savedCoordinates;
            } else if (localStorage.getItem('locationPromptShown') === 'true') {
                throw new Error('Location permission was already requested.');
            } else {
                localStorage.setItem('locationPromptShown', 'true');
                coordinates = await getDeviceCoordinates();
                saveCoordinates(coordinates);
            }
        } catch (error) {
            console.warn('Device location unavailable; using Chandanaish, Chattogram.', error);
            coordinates = fallbackCoordinates;
        }

        const weatherUrl = new URL(
            ['https:', '', 'api.open-meteo.com', 'v1', 'forecast'].join('/')
        );
        weatherUrl.search = new URLSearchParams({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            current: 'temperature_2m,weather_code,wind_speed_10m',
            temperature_unit: 'celsius',
            wind_speed_unit: 'kmh',
            timezone: 'auto'
        });
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            throw new Error(`Weather request failed with status ${response.status}.`);
        }

        const data = await response.json();
        const current = data.current;
        if (!current || typeof current.temperature_2m !== 'number' ||
            typeof current.weather_code !== 'number' || typeof current.wind_speed_10m !== 'number') {
            throw new Error('Weather response is missing current conditions.');
        }

        const state = getWeatherState(current.weather_code, current.wind_speed_10m);
        const label = `${state.charAt(0).toUpperCase()}${state.slice(1)}`;
        const icon = document.createElement('img');
        icon.className = 'weather-icon';
        icon.src = `assets/weather-${state}.png`;
        icon.alt = `${label} weather`;

        weatherDisplay.replaceChildren(
            document.createTextNode(` | ${current.temperature_2m}°C `),
            icon,
            document.createTextNode(` ${label}`)
        );
    } catch (error) {
        console.error('Unable to load current weather.', error);
        weatherDisplay.textContent = ' | Weather unavailable';
    }
}

function getDeviceCoordinates() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not available in this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }),
            reject,
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
    });
}

function getSavedCoordinates() {
    const saved = localStorage.getItem('locationCoordinates');
    if (!saved) {
        return null;
    }

    try {
        const coordinates = JSON.parse(saved);
        if (typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
            return coordinates;
        }
    } catch (error) {
        console.warn('Saved location coordinates are invalid.', error);
    }

    localStorage.removeItem('locationCoordinates');
    return null;
}

function saveCoordinates(coordinates) {
    localStorage.setItem('locationCoordinates', JSON.stringify(coordinates));
    localStorage.setItem('locationPromptShown', 'true');
}

function getWeatherState(weatherCode, windSpeed) {
    const rainyCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
    if (rainyCodes.includes(weatherCode)) {
        return 'rainy';
    }
    if (windSpeed >= 30) {
        return 'windy';
    }
    if (weatherCode === 0) {
        return 'sunny';
    }
    return 'cloudy';
}