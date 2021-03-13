function disableButton(button) {
    button.classList.add("disabled");
    button.onclick = e => e.preventDefault();
} 

function enableButton(button) {
    button.classList.remove("disabled");
    button.onclick = e => {
        e.preventDefault();
        disableButton(button);
        fetch("/scan", {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
              scanner: e.srcElement.parentNode.id, 
              configuration: document.getElementById("configuration").value
            })
         }).then(res => enableButton(button));
    };
}

const socket = new WebSocket("ws://localhost:14444");

socket.onopen = function(e) {
  console.log("[open] Connection established", e);
};

socket.onmessage = function(event) {
  console.log(`[message] Data received from server: ${event.data}`);
  const data = JSON.parse(event.data);
  const footer = document.getElementById("footer");
  footer.innerHTML += `${data.severity}: ${data.message}<br>`;
  footer.scrollTop = footer.scrollHeight;
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    console.log('[close] Connection died');
  }
};

socket.onerror = function(error) {
  console.log(`[error] ${error.message}`);
};

window.onload = () => Array.from(document.getElementsByClassName("scanner")).map(enableButton)

