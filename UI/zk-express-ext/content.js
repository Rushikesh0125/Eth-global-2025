// This content script is injected into the target page.

function injectZkExpressButton() {
  console.log("zk-express: Searching for injection point...");

  // --- Target Element ---
  // This selector is designed to work on Amazon, but can be adjusted.
  // It looks for the container that holds the 'Add to Cart' button.
  const targetContainer = document.getElementById("desktop_buybox");

  if (targetContainer && !document.getElementById("zk-express-btn")) {
    console.log("zk-express: Injection point found. Creating button.");

    // Create the button
    const zkButton = document.createElement("button");
    zkButton.id = "zk-express-btn";
    zkButton.innerText = "Buy with zk-express";

    // --- Styling ---cu
    // Hackathon-style dark, vibrant button
    Object.assign(zkButton.style, {
      width: "100%",
      padding: "16px",
      marginTop: "10px",
      marginBottom: "10px",
      fontSize: "16px",
      fontWeight: "bold",
      color: "#ffffff",
      backgroundImage: "linear-gradient(90deg, #8A2BE2, #4A00E0)",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      textAlign: "center",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
      transition: "transform 0.2s, box-shadow 0.2s",
    });

    // Hover effect
    zkButton.onmouseover = () => {
      zkButton.style.transform = "translateY(-2px)";
      zkButton.style.boxShadow = "0 0 20px rgba(138, 43, 226, 0.8)";
    };
    zkButton.onmouseout = () => {
      zkButton.style.transform = "translateY(0)";
      zkButton.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
    };

    // --- Functionality ---
    zkButton.addEventListener("click", () => {
      console.log("zk-express button clicked! Redirecting to checkout...");
      // This URL will eventually be your checkout page.
      // Using a placeholder for now.
      window.location.href = "https://google.com"; // Replace with your actual checkout URL
    });

    // Inject the button into the page
    targetContainer.prepend(zkButton);
    console.log("zk-express: Button successfully injected!");
  } else if (!targetContainer) {
    console.error(
      "zk-express: Could not find the target container ('#desktop_buybox') on this page."
    );
  } else {
    console.log("zk-express: Button already injected.");
  }
}

document.addEventListener("DOMContentLoaded", injectZkExpressButton);
