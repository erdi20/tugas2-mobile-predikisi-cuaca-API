// app.js

var app = new Framework7({
  root: "#app",
  name: "MyWeatherApp",
  id: "com.yourcompany.weatherapp",
  theme: "auto",
  routes: routes,
});

var $$ = Dom7;

const BMKG_API_BASE_URL = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const DEFAULT_ADM4_CODE = "35.17.03.2007"; // Pulorejo, Ngoro, Jombang

function formatDate(datetimeString) {
    if (!datetimeString || typeof datetimeString !== 'string') {
        return 'Tanggal Tidak Tersedia';
    }
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(datetimeString.replace(' ', 'T')).toLocaleDateString('id-ID', options);
}

function formatTime(datetimeString) {
    if (!datetimeString || typeof datetimeString !== 'string') {
        return 'Waktu Tidak Tersedia';
    }
    const date = new Date(datetimeString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
        return 'Waktu Invalid';
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} WIB`;
}

function encodeImageUrl(url) {
    return url ? url.replace(/ /g, '%20') : '';
}

async function fetchWeatherData(adm4Code) {
    const apiUrl = `${BMKG_API_BASE_URL}?adm4=${adm4Code}`;

    $$('.initial-loading-preloader').removeClass('hidden');
    $$('#location-info-list .item-after, #location-info-list .item-subtitle span, #location-info-list .item-text span').text('Memuat...');
    $$('#weather-forecasts-container').html('');

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Gagal mengambil data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error || !data.lokasi || !data.data || !data.data[0] || !data.data[0].cuaca) {
            throw new Error(data.error_message || "Struktur data API tidak sesuai.");
        }
        return data;
    } catch (error) {
        console.error("Error fetching weather data:", error.message);
        app.dialog.alert(error.message, 'Gagal Memuat Cuaca');
        return null;
    } finally {
        $$('.initial-loading-preloader').addClass('hidden');
    }
}

function renderLocationInfo(location) {
    if (!location) {
        $$('#location-desa').text('Tidak Tersedia');
        $$('#location-kecamatan').text('Tidak Tersedia');
        $$('#location-kotkab').text('Tidak Tersedia');
        $$('#location-provinsi').text('Tidak Tersedia');
        $$('#location-coords').text('Tidak Tersedia');
        $$('#location-timezone').text('Tidak Tersedia');
        return;
    }
    $$('#location-desa').text(location.desa || 'N/A');
    $$('#location-kecamatan').text(location.kecamatan || 'N/A');
    $$('#location-kotkab').text(location.kotkab || 'N/A');
    $$('#location-provinsi').text(location.provinsi || 'N/A');
    $$('#location-coords').text(`Lat: ${location.lat || 'N/A'}, Lon: ${location.lon || 'N/A'}`);
    $$('#location-timezone').text(location.timezone || 'N/A');
}

function renderWeatherForecasts(dailyForecasts, analysisDate) {
    const container = $$('#weather-forecasts-container');
    container.html('');

    if (!dailyForecasts || dailyForecasts.length === 0) {
        container.html('<div class="block"><p class="text-align-center text-color-gray">Tidak ada data prakiraan cuaca yang tersedia.</p></div>');
        return;
    }

    dailyForecasts.forEach((dayForecast, dayIndex) => {
        if (!dayForecast || dayForecast.length === 0) return;

        const currentDayLocalDatetime = dayForecast[0].local_datetime;
        const formattedDate = formatDate(currentDayLocalDatetime);

        let dailyCardHtml = `
            <div class="card margin-horizontal margin-bottom-half">
                <div class="card-header no-border">
                    <div class="display-flex justify-content-space-between width-100">
                        <span class="text-color-black font-weight-bold">${formattedDate}</span>
                        <span class="text-color-gray small-text">Update: ${formatTime(analysisDate)}</span>
                    </div>
                </div>
                <div class="card-content card-content-padding">
                    <div class="list media-list no-hairlines">
                        <ul>
        `;

        dayForecast.forEach(hourForecast => {
            const localTime = formatTime(hourForecast.local_datetime);
            const weatherDesc = hourForecast.weather_desc || 'N/A';
            const temperature = hourForecast.t ? `${hourForecast.t}°C` : 'N/A';
            const humidity = hourForecast.hu ? `${hourForecast.hu}%` : 'N/A';
            const windSpeed = hourForecast.ws ? `${hourForecast.ws} km/j` : 'N/A';
            const windDirection = hourForecast.wd || 'N/A';
            const visibility = hourForecast.vs_text || 'N/A';
            const imageUrl = encodeImageUrl(hourForecast.image);
            const altText = hourForecast.weather_desc_en || 'Weather icon';

            dailyCardHtml += `
                <li>
                    <div class="item-content">
                        <div class="item-media">
                            ${imageUrl ? `<img src="${imageUrl}" alt="${altText}" class="weather-icon" />` : ''}
                        </div>
                        <div class="item-inner">
                            <div class="item-title-row">
                                <div class="item-title">${localTime}</div>
                                <div class="item-after"><strong>${temperature}</strong></div>
                            </div>
                            <div class="item-subtitle">${weatherDesc}</div>
                            <div class="item-text">
                                Kelembapan: ${humidity} | Angin: ${windSpeed} (${windDirection}) | Jarak Pandang: ${visibility}
                            </div>
                        </div>
                    </div>
                </li>
            `;
        });

        dailyCardHtml += `
                        </ul>
                    </div>
                </div>
            </div>
        `;
        container.append(dailyCardHtml);
    });
}

async function loadAndRenderWeatherData() {
    const weatherData = await fetchWeatherData(DEFAULT_ADM4_CODE);
    if (weatherData) {
        renderLocationInfo(weatherData.lokasi);
        renderWeatherForecasts(weatherData.data[0].cuaca, weatherData.data[0].lokasi.analysis_date);
    }
}

app.on('pageInit', async function (page) {
    if (page.name === 'home') {
        await loadAndRenderWeatherData();

        page.$el.find('.ptr-content').on('ptr:refresh', async function () {
            await loadAndRenderWeatherData();
            app.ptr.done();
        });
    }
});

$$(document).on('deviceready', function() {
    // Cordova device ready
});