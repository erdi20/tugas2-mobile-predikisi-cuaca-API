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
  const defaultText = "Tidak Tersedia";
  $$("#lokasi-desa").text(lokasi?.desa || defaultText);
  $$("#lokasi-kecamatan").text(lokasi?.kecamatan || defaultText);
  $$("#lokasi-kotkab").text(lokasi?.kotkab || defaultText);
  $$("#lokasi-provinsi").text(lokasi?.provinsi || defaultText);
  $$("#lokasi-coords").text(`Lat: ${lokasi?.lat || defaultText}, Lon: ${lokasi?.lon || defaultText}`);
  $$("#lokasi-timezone").text(lokasi?.timezone || defaultText);
}

function tampilkanPrakiraanCuaca(prakiraanHarian) {
  const container = $$("#weather-forecasts-container").html(prakiraanHarian.length ? "" : 
    '<div class="block"><p class="text-align-center text-color-gray">Tidak ada data prakiraan cuaca yang tersedia.</p></div>'
  );

  prakiraanHarian.forEach(prakiraanHari => {
    let html = `
      <div class="col">
        <div class="card margin-bottom-half">
          <div class="card-header no-border">
            <div class="display-flex justify-content-space-between">
              <span class="text-color-black font-weight-bold">${formatTanggal(prakiraanHari[0]?.local_datetime)}</span>
            </div>
          </div>
          <div class="card-content card-content-padding">
            <div class="list media-list no-hairlines"><ul>
    `;

    prakiraanHari.forEach((jam, i) => {
      // Ambil jam saja dari local_datetime (format: "YYYY-MM-DD HH:MM:SS")
      const waktu = jam.local_datetime ? jam.local_datetime.split(' ')[1].substring(0,5) : '--:--';
      
      html += `
        <li style="${i < prakiraanHari.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : ''}padding:15px;">
          <div class="item-content">
            ${jam.image ? `<div class="item-media"><img src="${jam.image}" alt="${jam.weather_desc||'N/A'}" style="width:45px"></div>` : ''}
            <div class="item-inner">
              <div class="item-title-row">
                <div class="item-title">${waktu} WIB</div>
                <div class="item-after">${jam.t ? jam.t+'°C' : 'N/A'}</div>
              </div>
              <div class="item-subtitle">${jam.weather_desc || 'N/A'}</div>
              <div class="item-text">Kelembapan: ${jam.hu ? jam.hu+'%' : 'N/A'}</div>
              <div class="item-text">Angin: ${jam.ws ? jam.ws+' km/j' : 'N/A'}</div>
              <div class="item-text">Jarak Pandang: ${jam.vs_text || 'N/A'}</div>
            </div>
          </div>
        </li>
      `;
    });

    container.append(html + `</ul></div></div></div>`);
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
