let chart;

async function fetchPrices(zone, dayType) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const tomorrow = String(today.getDate() + 1).padStart(2, "0");

  const targetDay = dayType === "Tomorrow" ? tomorrow : day;
  const apiUrl = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${targetDay}_${zone}.json`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const prices = data.map((entry) => Math.round(entry.NOK_per_kWh * 100));
    const hours = data.map((entry) => entry.time_start.split("T")[1].slice(0, 5)); // Extract hour (HH:MM)

    return { prices, hours };
  } catch (error) {
    console.error("Error fetching prices:", error);
    return { prices: [], hours: [] };
  }
}

function createChart(hours, prices) {
  const ctx = document.getElementById("priceChart").getContext("2d");

  // Destroy previous chart if it exists
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [
        {
          label: "Energy Price (øre/kWh)",
          data: prices,
          borderColor: "lightgray",
          backgroundColor: "lightgray",
          borderWidth: 2,
          pointRadius: 3, // Smaller, solid points
          pointBackgroundColor: "lightgray", // Solid color for points
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "white", // Change legend text color
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "white", // Change x-axis tick color
          },
        },
        y: {
          ticks: {
            color: "white", // Change y-axis tick color
            callback: (value) => `${value} øre`, // Add "øre" to y-axis labels
          },
        },
      },
      elements: {
        line: {
          tension: 0.3, // Slight smoothing of line
        },
        point: {
          hoverRadius: 0, // Remove hover bubbles
        },
      },
    },
  });
}

async function updateChart(zone, dayType) {
  const { prices, hours } = await fetchPrices(zone, dayType);
  createChart(hours, prices);
}

// Update the price display
async function updatePrice(zone) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const apiUrl = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${zone}.json`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const currentHourPrice = Math.round(data[0]?.NOK_per_kWh * 100) || "N/A";
    document.getElementById("price").textContent = `Current price: ${currentHourPrice} øre/kWh`;
  } catch (error) {
    console.error("Error fetching price:", error);
    document.getElementById("price").textContent = "Error fetching price.";
  }
}

// Initialize the chart with the default zone and "Today"
const zoneSelect = document.getElementById("zones");
const toggleButton = document.getElementById("toggle-button");

let dayType = "Today"; // Default day type

// Update chart and price on zone change
zoneSelect.addEventListener("change", (event) => {
  updateChart(event.target.value, dayType);
  updatePrice(event.target.value);
});

// Toggle between "Today" and "Tomorrow"
toggleButton.addEventListener("click", () => {
  dayType = dayType === "Today" ? "Tomorrow" : "Today";
  toggleButton.textContent = `Switch to ${dayType === "Today" ? "Tomorrow" : "Today"}`;
  updateChart(zoneSelect.value, dayType);
});

// Initial load
updateChart(zoneSelect.value, dayType);
updatePrice(zoneSelect.value);
