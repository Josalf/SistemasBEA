document.addEventListener("DOMContentLoaded", () => {
  fetch("data.json")
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
      return response.json();
    })
    .then((data) => {
      // === TRANSACTIONS BY TYPE ===
      const typeData = data.transactionsByType;
      const routeNames = Object.keys(typeData);
      const entradaData = routeNames.map(route => typeData[route].entrada);
      const salidaData = routeNames.map(route => typeData[route].salida);
      const recargaData = routeNames.map(route => typeData[route].recarga);
      const ventaData = routeNames.map(route => typeData[route].venta);
 
      const ctxStacked = document.getElementById("stackedBarChart").getContext("2d");
 
      new Chart(ctxStacked, {
        type: "bar",
        data: {
          labels: routeNames,
          datasets: [
            { label: "Entrada", data: entradaData, backgroundColor: "#0077b6" },
            { label: "Salida", data: salidaData, backgroundColor: "#00b4d8" },
            { label: "Recarga", data: recargaData, backgroundColor: "#90e0ef" },
            { label: "Venta Tarjeta", data: ventaData, backgroundColor: "#f77f00" }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false }
          },
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              beginAtZero: true,
              title: { display: true, text: "Cantidad" }
            }
          }
        }
      });
 
      // === ENTRIES VS RECHARGES (RESUMEN GLOBAL) ===
      const lineData = data.entriesVsRecharges;
      const labelsLine = lineData.labels;
      const entriesTotal = lineData.stations.entries.map((v, i) => v + lineData.buses.entries[i]);
      const rechargesTotal = lineData.stations.recharges.map((v, i) => v + lineData.buses.recharges[i]);
 
      const ctxLine = document.getElementById("lineChart").getContext("2d");
 
      new Chart(ctxLine, {
        type: "line",
        data: {
          labels: labelsLine,
          datasets: [
            {
              label: "Stations+Buses Entries",
              data: entriesTotal,
              borderColor: "#0077b6",
              backgroundColor: "#0077b6",
              tension: 0.3,
              fill: false,
              borderWidth: 3
            },
            {
              label: "Stations+Buses Recharges",
              data: rechargesTotal,
              borderColor: "#90e0ef",
              backgroundColor: "#90e0ef",
              tension: 0.3,
              fill: false,
              borderWidth: 3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Cantidad" }
            }
          }
        }
      });
 
      document.getElementById("totalEntries").textContent = entriesTotal.reduce((a, b) => a + b, 0).toLocaleString("en-US");
      document.getElementById("totalRecharges").textContent = rechargesTotal.reduce((a, b) => a + b, 0).toLocaleString("en-US");
 
      // === TOTAL STATION TRANSACTIONS ===
      document.getElementById("transactionCount").textContent = data.totalTransactions.toLocaleString("en-US");
 
      // === FEEDER BUS ROUTES (PASTEL) ===
      const routeData = data.feederBusRoutes;
      const labels = Object.keys(routeData);
      const values = Object.values(routeData);
      const totalRoutes = values.reduce((a, b) => a + b, 0);
      document.getElementById("feederTotal").textContent = totalRoutes;
 
      const ctx = document.getElementById("feederChart").getContext("2d");
 
      new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              data: values,
              backgroundColor: ["#005288", "#0077b6", "#00b4d8", "#48cae4", "#90e0ef"],
              borderColor: "#ffffff",
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.label}: ${context.parsed} transacciones`
              }
            }
          }
        }
      });
 
      // === ENTRADAS Y RECARGAS POR ESTACIÓN (NUEVO) ===
      const stationData = data.entriesRecargasPerStationPerDay;
      const dateLabels = stationData.dates;
      const stationNames = Object.keys(stationData.stations);
 
      const stationSelect = document.getElementById("stationSelector");
      const chartCtx = document.getElementById("stationLineChart").getContext("2d");
 
      stationNames.forEach(station => {
        const option = document.createElement("option");
        option.value = station;
        option.textContent = station;
        stationSelect.appendChild(option);
      });
 
      let stationLineChart = new Chart(chartCtx, {
        type: "line",
        data: {
          labels: dateLabels,
          datasets: [
            {
              label: "Entradas",
              data: [],
              borderColor: "#0077b6",
              backgroundColor: "#0077b6",
              tension: 0.3,
              fill: false,
              borderWidth: 2
            },
            {
              label: "Recargas",
              data: [],
              borderColor: "#90e0ef",
              backgroundColor: "#90e0ef",
              tension: 0.3,
              fill: false,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top" }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
 
      function updateStationChart(stationName) {
        const dataStation = stationData.stations[stationName];
        stationLineChart.data.datasets[0].data = dataStation.entries;
        stationLineChart.data.datasets[1].data = dataStation.recharges;
        stationLineChart.data.datasets[0].label = stationName + " Entradas";
        stationLineChart.data.datasets[1].label = stationName + " Recargas";
        stationLineChart.update();
      }
 
      updateStationChart(stationNames[0]);
 
      stationSelect.addEventListener("change", (e) => {
        updateStationChart(e.target.value);
      });
 
      // === DEVICE TRANSACTIONS (VISUAL TABLE) ===
      const deviceData = data.deviceTransactions;
      const maxValue = Math.max(...Object.values(deviceData));
      const deviceList = document.getElementById("deviceList");
 
      const icons = {
        "Entries": "🚪",
        "Exits": "🚶‍♂️",
        "Gates": "🛂",
        "Ticket Machines": "🎫"
      };
 
      Object.entries(deviceData).forEach(([name, value]) => {
        const percent = (value / maxValue) * 100;
 
        const row = document.createElement("div");
        row.className = "device-row";
 
        row.innerHTML = `
<div class="device-name">${icons[name] || "🔹"} ${name}</div>
<div class="device-bar-container">
<div class="device-bar" style="width: ${percent}%"></div>
</div>
<div class="device-value">${value.toLocaleString("en-US")}</div>
        `;
 
        deviceList.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error al cargar datos:", error);
    });
});