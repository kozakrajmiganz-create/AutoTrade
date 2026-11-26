const gomb = document.getElementById("gomb");
const p = document.getElementById("p");

gomb.addEventListener("click", async () => {

    const response = await fetch('http://localhost:3000/api/response', {
        method: 'GET',
        credentials: 'include'

    });
    const data = await response.json();
    p.innerText = data.message;
});