let chart; // Global variabel for å lagre diagrammet

// Hent strømpriser fra API
async function fetchPrices(zone) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Legger til ledende null
  const day = String(today.getDate()).padStart(2, "0");
  const apiUrl = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${zone}.json`;

  try {
    const response = await fetch(apiUrl); // Hent data fra API
    const data = await response.json(); // Konverter til JSON

    // Ekstraher priser (øre/kWh) og timer
    const prices = data.map((entry) => Math.round(entry.NOK_per_kWh * 100));
    const hours = data.map((entry) => entry.time_start.split("T")[1].slice(0, 5)); // Henter timer (HH:MM)

    return { prices, hours }; // Returnerer data
  } catch (error) {
    console.error("Feil ved henting av priser:", error);
    throw error; // Kaster feil for håndtering
  }
}

// Tegn linjediagram
function drawLineChart(div_id, labels, data) {
  const ctx = document.getElementById(div_id).getContext("2d");

  // Lag gradient for linjen
  const gradientStroke = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
  gradientStroke.addColorStop(0, "#F44336"); // Rød start
  gradientStroke.addColorStop(1, "#FF5722"); // Oransje slutt

  // Slett gammelt diagram hvis det finnes
  if (chart) {
    chart.destroy();
  }

  // Opprett nytt diagram
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Strømpris (øre/kWh)",
          data,
          borderColor: gradientStroke,
          pointBackgroundColor: gradientStroke,
          pointBorderColor: gradientStroke,
          pointRadius: 4, // Synlige punkter
          borderWidth: 3,
          tension: 0.4, // Glatte kurver
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true, // Behold proporsjoner
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false, // Tillat hover langs hele linjen
      },
      plugins: {
        legend: {
          display: false, // Skjul forklaring
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => `Klokkeslett: ${tooltipItems[0].label}`,
            label: (tooltipItem) => `Pris: ${tooltipItem.raw} øre`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            color: "#E0E0E0", // Hovedtekstfarge
            callback: (value) => `${value} øre`,
          },
          grid: {
            color: "#2C2C2C", // Subtile rutenettlinjer
          },
        },
        x: {
          ticks: {
            color: "#B0B0B0", // Sekundærtekstfarge
          },
          grid: {
            display: false, // Skjul rutenettlinjer for x-aksen
          },
        },
      },
    },
  });
}

// Oppdater strømpris og diagram
async function updatePrice(zone) {
  const currentPriceEl = document.getElementById("current-price");
  const averagePriceEl = document.getElementById("average-price");
  const zoneNameEl = document.getElementById("zone-name");

  try {
    const { prices, hours } = await fetchPrices(zone);

    // Lagre valgt sone i localStorage
    localStorage.setItem("selectedZone", zone);

    // Oppdater sonenavn
    const zoneNames = {
      NO1: "Østlandet (NO1)",
      NO2: "Sørlandet (NO2)",
      NO3: "Midt-Norge (NO3)",
      NO4: "Nord-Norge (NO4)",
      NO5: "Vestlandet (NO5)",
    };
    zoneNameEl.textContent = `Valgt sone: ${zoneNames[zone] || "Ukjent"}`;

    // Beregn nåværende og gjennomsnittlig pris
    const currentPrice = prices[0];
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Oppdater tekst
    currentPriceEl.textContent = `Strømpris nå: ${currentPrice} øre/kWh`;
    averagePriceEl.textContent = `Gjennomsnittpris i dag: ${Math.round(averagePrice)} øre/kWh`;

    // Oppdater diagram
    drawLineChart("priceChart", hours, prices);
  } catch {
    // Feilhåndtering
    currentPriceEl.textContent = "Feil ved henting av strømpris.";
    averagePriceEl.textContent = "Feil ved henting av gjennomsnittpris.";
    zoneNameEl.textContent = "Feil ved henting av sone.";
  }
}

// Event listeners for å håndtere modal og sonevalg
document.getElementById("zone-button").addEventListener("click", () => {
  document.getElementById("zone-modal").classList.remove("hidden");
});

document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("zone-modal").classList.add("hidden");
});

document.getElementById("zone-list").addEventListener("click", (event) => {
  const zone = event.target.dataset.zone;
  if (zone) {
    document.getElementById("zone-modal").classList.add("hidden");
    updatePrice(zone); // Oppdater priser og diagram
  }
});

// Initialiser: Bruk lagret sone eller standard NO1
const savedZone = localStorage.getItem("selectedZone") || "NO1";
updatePrice(savedZone);
