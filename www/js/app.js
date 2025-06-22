var $$ = Dom7;

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

function tampilCuaca() {
  $.ajax({
    url: "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=35.17.03.2007",
    method: "GET",
    dataType: "json",
    success: function (response) {
      const dataCuaca = response;
      let hasilHtml = "";
      const lokasi = dataCuaca.lokasi;
      let tanggalTerakhir = "";

      $("#lokasi-desa").text(lokasi?.desa || "Tidak Tersedia");
      $("#lokasi-kecamatan").text(lokasi?.kecamatan || "Tidak Tersedia");
      $("#lokasi-kotkab").text(lokasi?.kotkab || "N/A");
      $("#lokasi-provinsi").text(lokasi?.provinsi || "N/A");
      $("#lokasi-coords").text(`Lat: ${lokasi?.lat || "N/A"}, Lon: ${lokasi?.lon || "N/A"}`);
      $("#lokasi-timezone").text(lokasi?.timezone || "N/A");

      dataCuaca.data.forEach((dataPrakiraan) => {
        dataPrakiraan.cuaca.forEach((cuacaGroup) => {
          cuacaGroup.forEach((cuacaItem) => {
            const localDatetime = new Date(cuacaItem.local_datetime);
            const tanggal = localDatetime.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const waktu = localDatetime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const tanggalPrakiraan = tanggal !== tanggalTerakhir ? `<h2 style="margin: 20px 0 10px 0; font-size: 18px; font-weight: 600; color: #333">${tanggal}</h2>` : "";

            tanggalTerakhir = tanggal;

            hasilHtml += `
              ${tanggalPrakiraan}
              <div style="border: 1px solid #ddd; border-top: none; padding: 15px; background-color: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
                  <span style="font-weight: 500; font-size: 15px">${waktu} WIB</span>
                  <span style="font-weight: 600; font-size: 16px; color: #007aff">${cuacaItem.t || "--"}°C</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px">
                  <img src="${cuacaItem.image}" alt="${cuacaItem.weather_desc}" style="width: 24px; height: 24px; margin-right: 8px">
                  <span style="font-weight: 500; font-size: 15px">${cuacaItem.weather_desc || "N/A"}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666">
                  <p>Kelembapan:<br> ${cuacaItem.hu || "--"}%</p>
                  <p>Angin:<br> ${cuacaItem.ws || "--"} km/j</p>
                  <p> Jarak pandang:<br> ${cuacaItem.vs_text || "--"}</p>
                </div>
              </div>
            `;
          });
        });
      });

      $("#blokcuaca").html(hasilHtml);
    },
    error: function (status, error) {
      console.error("Terjadi kesalahan saat mengambil data cuaca:", status, error);
      $("#blokcuaca").html("<p style='padding: 20px; text-align: center; color: #666'>Maaf, data cuaca tidak dapat dimuat saat ini. Silakan coba lagi nanti.</p>");
    },
  });
}
