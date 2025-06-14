// Dom7
var $$ = Dom7;

// Init App
var app = new Framework7({
  el: "#app",
  theme: "auto",
  routes: routes,
  popup: {
    closeOnEscape: true,
  },
  sheet: {
    closeOnEscape: true,
  },
  popover: {
    closeOnEscape: true,
  },
  actions: {
    closeOnEscape: true,
  },
  navbar: {
    mdCenterTitle: true,
    hideOnPageScroll: true,
    showOnPageScrollTop: true,
    showOnPageScrollEnd: false,
  },
});

const apiLink = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const kode = "35.17.03.2007";

let terjemahanHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
let terjemahanBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggal(tanggalWaktu) {
  if (!tanggalWaktu) return "Tidak Tersedia";
  const date = new Date(tanggalWaktu.replace(" ", "T"));
  const hari = terjemahanHari[date.getDay()];
  const tgl = date.getDate() <= 9 ? `0${date.getDate()}` : date.getDate();
  const bln = terjemahanBulan[date.getMonth()];
  const th = date.getFullYear();

  return `${hari}, ${tgl} ${bln} ${th}`;
}

function ambilDataCuaca(kodeWilayah) {
  const apiUrl = `${apiLink}?adm4=${kodeWilayah}`;
  $$("#weather-forecasts-container").html("");

  return new Promise(function (resolve, reject) {
    $.ajax({
      url: apiUrl,
      method: "GET",
      dataType: "json",
      success: function (data) {
        if (data.error || !data.lokasi || !data.data[0]?.cuaca) {
          reject(data.error_message || "Struktur data API tidak sesuai.");
        } else {
          resolve(data);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        app.dialog.alert(errorThrown, "Gagal Memuat Cuaca");
        reject(errorThrown);
      },
      complete: function () {
        $$(".initial-loading-preloader").addClass("hidden");
      },
    });
  });
}

function tampilkanInfoLokasi(lokasi) {
  $$("#lokasi-desa").text(lokasi?.desa || "Tidak Tersedia");
  $$("#lokasi-kecamatan").text(lokasi?.kecamatan || "Tidak Tersedia");
  $$("#lokasi-kotkab-provinsi").text(`${lokasi?.kotkab || "N/A"}, ${lokasi?.provinsi || "N/A"}`);
  $$("#lokasi-coords").text(`Lat: ${lokasi?.lat || "N/A"}, Lon: ${lokasi?.lon || "N/A"}`);
  $$("#lokasi-timezone").text(lokasi?.timezone || "N/A");
}

function tampilkanPrakiraanCuaca(prakiraanHarian) {
  const container = $$("#weather-forecasts-container").html("");
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  if (!prakiraanHarian.length) {
    container.html('<div class="block"><p class="text-align-center text-color-gray">Tidak ada data cuaca</p></div>');
    return;
  }

  prakiraanHarian.forEach((hariCuaca) => {
    if (!hariCuaca[0]?.local_datetime) return;

    const [tanggal] = hariCuaca[0].local_datetime.split(" ");
    const [tahun, bulanIdx, tgl] = tanggal.split("-");
    const namaHari = hari[new Date(tahun, bulanIdx - 1, tgl).getDay()];
    const namaBulan = bulan[parseInt(bulanIdx) - 1];

    let html = `
      <div class="card" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05)">
        <div class="card-header" style="font-weight: 600; font-size: 16px; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.05)">
          ${namaHari}, ${tgl} ${namaBulan} ${tahun}
        </div>
        <div class="card-content card-content-padding" style="padding: 0">
    `;

    hariCuaca.forEach((item, index) => {
      const waktu = item.local_datetime ? item.local_datetime.split(" ")[1].substring(0, 5) : "--:--";

      html += `
        <div style="padding: 12px 16px; ${index < hariCuaca.length - 1 ? "border-bottom: 1px solid rgba(0,0,0,0.05)" : ""}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
            <span style="font-weight: 500; font-size: 15px">${waktu} WIB</span>
            <span style="font-weight: 600; font-size: 16px; color: #007aff">${item.t || "--"}°C</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 6px">
            ${item.image ? `<img src="${item.image}" alt="${item.weather_desc}" style="width: 24px; height: 24px; margin-right: 8px">` : ""}
            <span style="font-weight: 500; font-size: 15px">${item.weather_desc || "N/A"}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666">
            <p>Kelembapan:<br> ${item.hu || "--"}%</p>
            <p>Angin:<br> ${item.ws || "--"} km/j</p>
            <p> Jarak pandang:<br> ${item.vs_text || "--"}</p>
          </div>
        </div>
      `;
    });

    container.append(html + `</div></div>`);
  });
}

async function muatDanTampilkanDataCuaca() {
  try {
    const weatherData = await ambilDataCuaca(kode);
    tampilkanInfoLokasi(weatherData.lokasi);
    tampilkanPrakiraanCuaca(weatherData.data[0].cuaca, weatherData.data[0].lokasi.analysis_date);
  } catch (error) {
    console.error("Kesalahan saat memuat data cuaca:", error);
  }
}

app.on("pageInit", async function (page) {
  if (page.name === "home") {
    await muatDanTampilkanDataCuaca();
    page.$el.find(".ptr-content").on("ptr:refresh", async function () {
      await muatDanTampilkanDataCuaca();
      app.ptr.done();
    });
  }
});

function sekarang() {
  let saatIni = new Date();
  let hr = terjemahanHari[saatIni.getDay()];
  let tgl = saatIni.getDate() <= 9 ? `0${saatIni.getDate()}` : saatIni.getDate();
  let bln = terjemahanBulan[saatIni.getMonth()];
  let th = saatIni.getFullYear();
  let jm = saatIni.getHours() <= 9 ? `0${saatIni.getHours()}` : saatIni.getHours();
  let mn = saatIni.getMinutes() <= 9 ? `0${saatIni.getMinutes()}` : saatIni.getMinutes();
  let dt = saatIni.getSeconds() <= 9 ? `0${saatIni.getSeconds()}` : saatIni.getSeconds();
  return `${hr}, ${tgl} ${bln} ${th} <br> ${jm}:${mn}:${dt}`;
}

setInterval(function () {
  $$("#bloktglskr").html(sekarang());
}, 1000);
