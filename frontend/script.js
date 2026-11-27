const gomb = document.getElementById("gomb");
const p = document.getElementById("p");

gomb.addEventListener("click", async () => {
    console.log("clicke log")
    const response = await fetch('/api/response', {
        method: 'GET',
    });
    const data = await response.json();
    console.log(data.message)
    p.innerText = data.message;
});