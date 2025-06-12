// app.js

const app = new Framework7({
  root: "#app",
  name: "MyWeatherApp",
  id: "com.yourcompany.weatherapp",
  theme: "auto",
  routes: routes,
});

const $$ = Dom7;
const BMKG_API_BASE_URL = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const DEFAULT_ADM4_CODE = "35.17.03.2007"; // Pulorejo, Ngoro, Jombang

let terjemahanHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
let terjemahanBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const formatTanggal = (datetimeString) => {
  if (!datetimeString) return "Tidak Tersedia";

  const date = new Date(datetimeString.replace(" ", "T"));
  const hari = terjemahanHari[date.getDay()];
  const tgl = date.getDate() <= 9 ? `0${date.getDate()}` : date.getDate();
  const bln = terjemahanBulan[date.getMonth()];
  const th = date.getFullYear();

  return `${hari}, ${tgl} ${bln} ${th}`;
};

const formatWaktu = (datetimeString) => {
  if (!datetimeString || typeof datetimeString !== "string") {
    return "Waktu Tidak Tersedia";
  }
  const date = new Date(datetimeString.replace(" ", "T"));
  return isNaN(date.getTime()) ? "Waktu Tidak Tersedia" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) + " WIB";
};

const encodeUrlGambar = (url) => (url ? url.replace(/ /g, "%20") : "");

const ambilDataCuaca = (adm4Code) => {
  const apiUrl = `${BMKG_API_BASE_URL}?adm4=${adm4Code}`;
  $$("#weather-forecasts-container").html("");

  return new Promise((resolve, reject) => {
    $.ajax({
      url: apiUrl,
      method: "GET",
      dataType: "json",
      success: (data) => {
        if (data.error || !data.lokasi || !data.data[0]?.cuaca) {
          reject(data.error_message || "Struktur data API tidak sesuai.");
        } else {
          resolve(data);
        }
      },
      error: (jqXHR, textStatus, errorThrown) => {
        app.dialog.alert(errorThrown, "Gagal Memuat Cuaca");
        reject(errorThrown);
      },
      complete: () => {
        $$(".initial-loading-preloader").addClass("hidden");
      },
    });
  });
};

const tampilkanInfoLokasi = (lokasi) => {
  const defaultText = "Tidak Tersedia";
  $$("#location-desa").text(lokasi?.desa || defaultText);
  $$("#location-kecamatan").text(lokasi?.kecamatan || defaultText);
  $$("#location-kotkab").text(lokasi?.kotkab || defaultText);
  $$("#location-provinsi").text(lokasi?.provinsi || defaultText);
  $$("#location-coords").text(`Lat: ${lokasi?.lat || defaultText}, Lon: ${lokasi?.lon || defaultText}`);
  $$("#location-timezone").text(lokasi?.timezone || defaultText);
};

const tampilkanPrakiraanCuaca = (prakiraanHarian, tanggalAnalisis) => {
  const container = $$("#weather-forecasts-container").html("");

  if (!prakiraanHarian.length) {
    container.html('<div class="block"><p class="text-align-center text-color-gray">Tidak ada data prakiraan cuaca yang tersedia.</p></div>');
    return;
  }

  prakiraanHarian.forEach((prakiraanHari) => {
    const formattedDate = formatTanggal(prakiraanHari[0]?.local_datetime);
    const updateTime = formatWaktu(tanggalAnalisis);

    let dailyCardHtml = `
      <div class="col">
        <div class="card margin-bottom-half"> <div class="card-header no-border">
            <div class="display-flex justify-content-space-between">
              <span class="text-color-black font-weight-bold">${formattedDate}</span>
            </div>
          </div>
          <div class="card-content card-content-padding">
            <div class="list media-list no-hairlines"> <ul>
    `;

    prakiraanHari.forEach((prakiraanJam, index) => {
      const localTime = formatWaktu(prakiraanJam.local_datetime);
      const weatherDesc = prakiraanJam.weather_desc || "N/A";
      const temperature = prakiraanJam.t ? `${prakiraanJam.t}°C` : "N/A";
      const humidity = prakiraanJam.hu ? `${prakiraanJam.hu}%` : "N/A";
      const windSpeed = prakiraanJam.ws ? `${prakiraanJam.ws} km/j` : "N/A";
      const visibility = prakiraanJam.vs_text || "N/A";
      const imageUrl = encodeUrlGambar(prakiraanJam.image);
      const itemBorderStyle = index < prakiraanHari.length - 1 ? "border-bottom: 1px solid #f0f0f0;" : "";

      dailyCardHtml += `
        <li style="${itemBorderStyle} padding: 15px;">
          <div class="item-content">
            <div class="item-media">${imageUrl ? `<img src="${imageUrl}" alt="${weatherDesc}" class="weather-icon" style="width: 45px;" />` : ""}</div>
            <div class="item-inner">
              <div class="item-title-row">
                <div class="item-title">${localTime}</div>
                <div class="item-after">${temperature}</div>
              </div>
              <div class="item-subtitle">${weatherDesc}</div>
              <div class="item-text">Kelembapan: ${humidity} </div>
              <div class="item-text">Angin: ${windSpeed} </div>
              <div class="item-text">Jarak Pandang: ${visibility}</div>
            </div>
          </div>
        </li>
      `;
    });

    dailyCardHtml += `</ul></div></div></div>`;
    container.append(dailyCardHtml);
  });
};

const muatDanTampilkanDataCuaca = async () => {
  try {
    const weatherData = await ambilDataCuaca(DEFAULT_ADM4_CODE);
    tampilkanInfoLokasi(weatherData.lokasi);
    tampilkanPrakiraanCuaca(weatherData.data[0].cuaca, weatherData.data[0].lokasi.analysis_date);
  } catch (error) {
    console.error("Kesalahan saat memuat data cuaca:", error);
  }
};

app.on("pageInit", async (page) => {
  if (page.name === "home") {
    await muatDanTampilkanDataCuaca();
    page.$el.find(".ptr-content").on("ptr:refresh", async () => {
      await muatDanTampilkanDataCuaca();
      app.ptr.done();
    });
  }
});

function sekarang() {
  let saatIni = new Date();
  let hr = terjemahanHari[saatIni.getDay()];
  let tgl = saatIni.getDate() <= 9 ? `0${saatIni.getDate()}` : saatIni.getDate();
  let bln = terjemahanBulan[saatIni.getMonth() + 1];
  let th = saatIni.getFullYear();
  let jm = saatIni.getHours() <= 9 ? `0${saatIni.getHours()}` : saatIni.getHours();
  let mn = saatIni.getMinutes() <= 9 ? `0${saatIni.getMinutes()}` : saatIni.getMinutes();
  let dt = saatIni.getSeconds() <= 9 ? `0${saatIni.getSeconds()}` : saatIni.getSeconds();
  return `${hr}, ${tgl} ${bln} ${th} <br> ${jm}:${mn}:${dt}`;
}
setInterval(function () {
  $("#bloktglskr").html(sekarang());
}, 1000);
