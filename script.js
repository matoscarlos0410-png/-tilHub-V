const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "utilhubV";

const state = JSON.parse(
  localStorage.getItem(STORAGE_KEY) ||
  `{
    "favorites":[],
    "history":[],
    "notes":"",
    "tasks":[],
    "shopping":[],
    "theme":"dark",
    "reduceMotion":false,
    "currency":null,
    "budget":[]
  }`
);

function save(){
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

  renderSaved();
}

function esc(text){
  return String(text ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[char])
  );
}

function result(content){
  return `
    <div class="result">
      ${content}
    </div>
  `;
}


/* =========================================
   MODAL
========================================= */

function openModal(title, body){

  $("#modalTitle").textContent = title;

  $("#modalBody").innerHTML = body;

  $("#modal").classList.add("show");
}

function closeModal(){

  $("#modal").classList.remove("show");

}

$("#modalClose").onclick = closeModal;

$("#modal").onclick = event => {

  if(event.target === $("#modal")){
    closeModal();
  }

};


/* =========================================
   HISTORIAL
========================================= */

function remember(query){

  query = query.trim();

  if(!query) return;

  state.history = [
    query,
    ...state.history.filter(
      item =>
        item.toLowerCase() !==
        query.toLowerCase()
    )
  ].slice(0,12);

  save();
}


/* =========================================
   BUSCADORES
========================================= */

function googleMaps(query){

  remember(query);

  window.open(
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query),
    "_blank"
  );

}

function webSearch(query){

  remember(query);

  window.open(
    "https://www.google.com/search?q=" +
    encodeURIComponent(query),
    "_blank"
  );

}


/* =========================================
   BUSCADOR GENERAL
========================================= */

function searchTools(query){

  query = query.trim().toLowerCase();

  let visible = 0;

  $$(".tool-card").forEach(card => {

    const text =
      card.dataset.name +
      " " +
      card.dataset.category;

    const match =
      !query ||
      text.includes(query);

    card.style.display =
      match
        ? "block"
        : "none";

    if(match){
      visible++;
    }

  });

  $("#noResults").style.display =
    visible
      ? "none"
      : "block";
}

$("#globalSearch").addEventListener(
  "input",
  event => {
    searchTools(event.target.value);
  }
);

$("#searchBtn").onclick = () => {

  const query =
    $("#globalSearch").value;

  if(!query) return;

  searchTools(query);

  $("#herramientas")
    .scrollIntoView({
      behavior:"smooth"
    });

  remember(query);
};


/* =========================================
   FILTROS
========================================= */

$("#categoryFilter").onchange = event => {

  const category =
    event.target.value;

  $$(".tool-card").forEach(card => {

    card.style.display =
      category === "all" ||
      card.dataset.category === category
        ? "block"
        : "none";

  });

};


/* =========================================
   MENÚ
========================================= */

$("#menuBtn").onclick = () => {

  $("#nav").classList.toggle("show");

};

$$(".nav a").forEach(link => {

  link.onclick = () => {

    $("#nav").classList.remove("show");

  };

});


/* =========================================
   CALCULADORA SEGURA
========================================= */

function safeCalc(expression){

  expression =
    expression
      .replace(/,/g,".")
      .replace(/\s+/g,"");

  if(
    !/^[0-9.+\-*/%()]+$/.test(
      expression
    )
  ){
    throw Error(
      "Solo se permiten números y operadores."
    );
  }

  const tokens =
    expression.match(
      /\d*\.?\d+|[()+\-*/%]/g
    ) || [];

  let index = 0;

  const peek = () =>
    tokens[index];

  function primary(){

    if(peek() === "-"){

      index++;

      return -primary();

    }

    if(peek() === "("){

      index++;

      const value = add();

      if(peek() !== ")"){
        throw Error(
          "Falta un paréntesis."
        );
      }

      index++;

      return value;
    }

    const number =
      Number(tokens[index++]);

    if(!Number.isFinite(number)){
      throw Error(
        "Número inválido."
      );
    }

    return number;
  }

  function multiply(){

    let value =
      primary();

    while(
      ["*","/","%"]
      .includes(peek())
    ){

      const operator =
        tokens[index++];

      const second =
        primary();

      if(operator === "*"){
        value *= second;
      }

      else if(operator === "/"){

        if(second === 0){
          throw Error(
            "No se puede dividir entre cero."
          );
        }

        value /= second;

      }

      else{

        value %= second;

      }

    }

    return value;
  }

  function add(){

    let value =
      multiply();

    while(
      ["+","-"]
      .includes(peek())
    ){

      const operator =
        tokens[index++];

      const second =
        multiply();

      value =
        operator === "+"
          ? value + second
          : value - second;

    }

    return value;
  }

  const value = add();

  if(index !== tokens.length){

    throw Error(
      "Expresión inválida."
    );

  }

  return value;
}


/* =========================================
   HERRAMIENTAS
========================================= */

const toolBuilders = {

  calc: () => {

    openModal(
      "🧮 Calculadora",

      `
        <div class="form">

          <label>
            Operación

            <input
              id="f1"
              placeholder="Ej.: (25+15)*2"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="calcGo()"
            >
              Calcular
            </button>

          </div>

        </div>
      `
    );

  },


  percent: () => {

    openModal(
      "％ Porcentaje",

      `
        <div class="form">

          <label>
            Porcentaje

            <input
              id="f1"
              type="number"
            >

          </label>

          <label>
            De

            <input
              id="f2"
              type="number"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="percentGo()"
            >
              Calcular
            </button>

          </div>

        </div>
      `
    );

  },


  discount: () => {

    openModal(
      "🏷️ Descuento",

      `
        <div class="form">

          <label>
            Precio

            <input
              id="f1"
              type="number"
            >

          </label>

          <label>
            Descuento %

            <input
              id="f2"
              type="number"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="discountGo()"
            >
              Calcular
            </button>

          </div>

        </div>
      `
    );

  },


  rule3: () => {

    openModal(
      "📐 Regla de 3",

      `
        <div class="form">

          <label>
            A
            <input id="f1" type="number">
          </label>

          <label>
            B
            <input id="f2" type="number">
          </label>

          <label>
            C
            <input id="f3" type="number">
          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="ruleGo()"
            >
              Calcular X
            </button>

          </div>

        </div>
      `
    );

  },


  temp: () => {

    openModal(
      "🌡️ Temperatura",

      `
        <div class="form">

          <label>
            Valor
            <input
              id="f1"
              type="number"
            >
          </label>

          <label>
            Desde

            <select id="f2">
              <option>C</option>
              <option>F</option>
              <option>K</option>
            </select>

          </label>

          <label>
            Hasta

            <select id="f3">
              <option>C</option>
              <option>F</option>
              <option>K</option>
            </select>

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="tempGo()"
            >
              Convertir
            </button>

          </div>

        </div>
      `
    );

  },


  age: () => {

    openModal(
      "🎂 Edad",

      `
        <div class="form">

          <label>
            Fecha de nacimiento

            <input
              id="f1"
              type="date"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="ageGo()"
            >
              Calcular edad
            </button>

          </div>

        </div>
      `
    );

  },


  datediff: () => {

    openModal(
      "📅 Entre fechas",

      `
        <div class="form">

          <label>
            Inicio
            <input
              id="f1"
              type="date"
            >
          </label>

          <label>
            Fin
            <input
              id="f2"
              type="date"
            >
          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="dateGo()"
            >
              Calcular días
            </button>

          </div>

        </div>
      `
    );

  },


  tip: () => {

    openModal(
      "💵 Propina y cuenta",

      `
        <div class="form">

          <label>
            Cuenta
            <input
              id="f1"
              type="number"
            >
          </label>

          <label>
            Propina %
            <input
              id="f2"
              type="number"
              value="10"
            >
          </label>

          <label>
            Personas
            <input
              id="f3"
              type="number"
              value="1"
              min="1"
            >
          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="tipGo()"
            >
              Calcular
            </button>

          </div>

        </div>
      `
    );

  },


  timer: () => {

    openModal(
      "⏱️ Temporizador",

      `
        <div class="form">

          <label>
            Segundos

            <input
              id="f1"
              type="number"
              value="60"
              min="1"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="timerGo()"
            >
              Iniciar
            </button>

          </div>

        </div>

        <div
          id="timerOut"
          class="result big-result"
        >
          00:00
        </div>
      `
    );

  },


  stopwatch: () => {

    openModal(
      "⏲️ Cronómetro",

      `
        <div
          id="swOut"
          class="big-result"
        >
          00:00.0
        </div>

        <div class="actions">

          <button
            class="primary"
            onclick="swStart()"
          >
            Iniciar
          </button>

          <button onclick="swStop()">
            Pausar
          </button>

          <button onclick="swReset()">
            Reiniciar
          </button>

        </div>
      `
    );

  },


  notes: () => {

    openModal(
      "📝 Notas",

      `
        <textarea
          id="noteText"
          style="
            width:100%;
            min-height:220px;
            padding:14px;
            border-radius:12px;
            background:rgba(0,0,0,.25);
            color:white;
            border:1px solid var(--line);
          "
        >${esc(state.notes)}</textarea>

        <div class="actions">

          <button
            class="primary"
            onclick="saveNotes()"
          >
            Guardar
          </button>

        </div>
      `
    );

  },


  tasks: () => {

    openModal(
      "✅ Tareas",

      `
        <div class="actions">

          <input
            id="taskInput"
            placeholder="Nueva tarea"
            style="flex:1;padding:12px"
          >

          <button
            class="primary"
            onclick="addTask()"
          >
            Agregar
          </button>

        </div>

        <div
          class="list"
          id="taskList"
        ></div>
      `
    );

    renderTasks();

  },


  shoppinglist: () => {

    openModal(
      "🛒 Lista de compras",

      `
        <div class="actions">

          <input
            id="shopItem"
            placeholder="Producto"
            style="flex:1;padding:12px"
          >

          <button
            class="primary"
            onclick="addShop()"
          >
            Agregar
          </button>

        </div>

        <div
          class="list"
          id="shopList"
        ></div>
      `
    );

    renderShopping();

  },


  password: () => {

    openModal(
      "🔐 Generador de contraseña",

      `
        <div class="form">

          <label>
            Longitud

            <input
              id="f1"
              type="number"
              value="16"
              min="6"
              max="64"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="passwordGo()"
            >
              Generar
            </button>

          </div>

        </div>
      `
    );

  },


  random: () => {

    openModal(
      "🎲 Número aleatorio",

      `
        <div class="form">

          <label>
            Mínimo
            <input
              id="f1"
              type="number"
              value="1"
            >
          </label>

          <label>
            Máximo
            <input
              id="f2"
              type="number"
              value="100"
            >
          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="randomGo()"
            >
              Generar
            </button>

          </div>

        </div>
      `
    );

  },


  dice: () => {

    openModal(
      "🎲 Dados",

      `
        <div class="form">

          <label>
            Cantidad

            <input
              id="f1"
              type="number"
              value="1"
              min="1"
              max="20"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="diceGo()"
            >
              Lanzar
            </button>

          </div>

        </div>
      `
    );

  },


  dictionary: () => {

    openModal(
      "📖 Diccionario",

      `
        <div class="form">

          <label>
            Palabra

            <input
              id="f1"
              placeholder="Ej.: perseverancia"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="dictGo()"
            >
              Buscar
            </button>

          </div>

        </div>

        ${result(
          "Se usa una API pública cuando hay conexión."
        )}
      `
    );

  },


  textcount: () => {

    openModal(
      "🔢 Contador de texto",

      `
        <textarea
          id="f1"
          style="
            width:100%;
            min-height:200px;
            padding:14px;
            background:rgba(0,0,0,.25);
            color:white;
            border:1px solid var(--line);
            border-radius:12px;
          "
          placeholder="Escribe o pega texto..."
        ></textarea>

        <div
          id="tc"
          class="result"
        >
          0 caracteres ·
          0 palabras ·
          0 líneas
        </div>
      `
    );

    const input = $("#f1");

    input.addEventListener(
      "input",
      updateTextCounter
    );

  },


  case: () => {

    openModal(
      "Aa Mayúsculas / minúsculas",

      `
        <textarea
          id="f1"
          style="
            width:100%;
            min-height:160px;
            padding:14px;
            background:rgba(0,0,0,.25);
            color:white;
            border:1px solid var(--line);
            border-radius:12px;
          "
        ></textarea>

        <div class="actions">

          <button onclick="caseGo('upper')">
            MAYÚSCULAS
          </button>

          <button onclick="caseGo('lower')">
            minúsculas
          </button>

          <button onclick="caseGo('title')">
            Tipo Título
          </button>

        </div>
      `
    );

  },


  study: () => {

    openModal(
      "📚 Organizador de estudio",

      `
        <div class="form">

          <label>
            Objetivo

            <input
              id="f1"
              placeholder="Ej.: terminar una sesión"
            >

          </label>

          <label>
            Minutos

            <input
              id="f2"
              type="number"
              value="25"
            >

          </label>

          <div class="actions">

            <button
              class="primary"
              onclick="studyGo()"
            >
              Crear sesión
            </button>

          </div>

        </div>
      `
    );

  }

};


/* =========================================
   FAVORITOS
========================================= */

$$(".tool-card").forEach(card => {

  const favorite =
    document.createElement("button");

  favorite.className = "fav";

  favorite.textContent =
    state.favorites.includes(
      card.dataset.tool
    )
      ? "★"
      : "☆";

  favorite.title = "Favorito";

  favorite.style.cssText = `
    position:absolute;
    right:15px;
    top:13px;
    border:0;
    background:transparent;
    color:#ffd65a;
    font-size:22px;
    cursor:pointer;
  `;

  favorite.onclick = event => {

    event.stopPropagation();

    toggleFavorite(
      card.dataset.tool,
      card.querySelector("h3").textContent,
      favorite
    );

  };

  card.appendChild(favorite);

  card.querySelector(
    "button:not(.fav)"
  ).onclick = () => {

    if(toolBuilders[card.dataset.tool]){
      toolBuilders[card.dataset.tool]();
    }

  };

});


function toggleFavorite(
  id,
  name,
  button
){

  if(state.favorites.includes(id)){

    state.favorites =
      state.favorites.filter(
        item => item !== id
      );

  }

  else{

    state.favorites.push(id);

  }

  button.textContent =
    state.favorites.includes(id)
      ? "★"
      : "☆";

  save();

}


/* =========================================
   GUARDAR FAVORITOS E HISTORIAL
========================================= */

function renderSaved(){

  $("#favoritesList").innerHTML =
    state.favorites.length

      ? state.favorites
          .map(id => {

            const card =
              document.querySelector(
                `[data-tool="${id}"]`
              );

            if(!card) return "";

            return `
              <button
                class="saved-item"
                onclick="toolBuilders['${id}']()"
              >
                ⭐
                ${esc(
                  card.querySelector("h3")
                    .textContent
                )}
              </button>
            `;

          })
          .join("")

      : `
        <span class="saved-item">
          Aún no tienes favoritos.
        </span>
      `;


  $("#historyList").innerHTML =
    state.history.length

      ? state.history
          .map(query => `
            <button
              class="saved-item"
              onclick="webSearch('${esc(query).replace(/'/g,"\\'")}')"
            >
              🕘
              ${esc(query)}
            </button>
          `)
          .join("")

      : `
        <span class="saved-item">
          Aún no hay búsquedas.
        </span>
      `;

}


/* =========================================
   CALCULADORA
========================================= */

function calcGo(){

  try{

    const value =
      safeCalc(
        $("#f1").value
      );

    openModal(
      "🧮 Resultado",

      result(`
        <div class="big-result">
          ${value}
        </div>
      `)
    );

  }

  catch(error){

    alert(error.message);

  }

}


/* =========================================
   PORCENTAJE
========================================= */

function percentGo(){

  const percentage =
    Number($("#f1").value);

  const total =
    Number($("#f2").value);

  const answer =
    percentage *
    total /
    100;

  openModal(
    "％ Resultado",

    result(`
      <div class="big-result">
        ${answer.toFixed(2)}
      </div>
    `)
  );

}


/* =========================================
   DESCUENTO
========================================= */

function discountGo(){

  const price =
    Number($("#f1").value);

  const discount =
    Number($("#f2").value);

  const finalPrice =
    price *
    (1 - discount / 100);

  const saving =
    price *
    discount /
    100;

  openModal(
    "🏷️ Resultado",

    result(`
      <b>Precio final:</b>

      <div class="big-result">
        ${finalPrice.toFixed(2)}
      </div>

      Ahorro:
      ${saving.toFixed(2)}
    `)
  );

}


/* =========================================
   REGLA DE 3
========================================= */

function ruleGo(){

  const A =
    Number($("#f1").value);

  const B =
    Number($("#f2").value);

  const C =
    Number($("#f3").value);

  if(A === 0){

    alert("A no puede ser 0.");

    return;

  }

  const X =
    B * C / A;

  openModal(
    "📐 Resultado",

    result(`
      <div class="big-result">
        ${X.toFixed(2)}
      </div>
    `)
  );

}


/* =========================================
   TEMPERATURA
========================================= */

function tempGo(){

  const value =
    Number($("#f1").value);

  const from =
    $("#f2").value;

  const to =
    $("#f3").value;

  let celsius;

  if(from === "C"){
    celsius = value;
  }

  else if(from === "F"){
    celsius =
      (value - 32) *
      5 / 9;
  }

  else{
    celsius =
      value - 273.15;
  }

  let answer;

  if(to === "C"){
    answer = celsius;
  }

  else if(to === "F"){
    answer =
      celsius *
      9 / 5 +
      32;
  }

  else{
    answer =
      celsius +
      273.15;
  }

  openModal(
    "🌡️ Resultado",

    result(`
      <div class="big-result">
        ${answer.toFixed(2)}
        °${to}
      </div>
    `)
  );

}


/* =========================================
   EDAD
========================================= */

function ageGo(){

  const birth =
    new Date(
      $("#f1").value
    );

  if(isNaN(birth)){
    return;
  }

  const now =
    new Date();

  let age =
    now.getFullYear() -
    birth.getFullYear();

  const birthday =
    new Date(
      now.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

  if(birthday > now){
    age--;
  }

  openModal(
    "🎂 Resultado",

    result(`
      <div class="big-result">
        ${age} años
      </div>
    `)
  );

}


/* =========================================
   FECHAS
========================================= */

function dateGo(){

  const first =
    new Date(
      $("#f1").value
    );

  const second =
    new Date(
      $("#f2").value
    );

  const days =
    Math.abs(
      Math.round(
        (second - first) /
        86400000
      )
    );

  openModal(
    "📅 Resultado",

    result(`
      <div class="big-result">
        ${days} días
      </div>
    `)
  );

}


/* =========================================
   PROPINA
========================================= */

function tipGo(){

  const account =
    Number($("#f1").value);

  const percentage =
    Number($("#f2").value);

  const people =
    Math.max(
      1,
      Number($("#f3").value)
    );

  const tip =
    account *
    percentage /
    100;

  const total =
    account + tip;

  const perPerson =
    total /
    people;

  openModal(
    "💵 Resultado",

    result(`
      Propina:
      <b>${tip.toFixed(2)}</b>

      <br><br>

      Total:
      <b>${total.toFixed(2)}</b>

      <br><br>

      Por persona:

      <div class="big-result">
        ${perPerson.toFixed(2)}
      </div>
    `)
  );

}


/* =========================================
   TEMPORIZADOR
========================================= */

let timerId = null;

function timerGo(){

  clearInterval(timerId);

  const seconds =
    Math.max(
      1,
      Number($("#f1").value)
    );

  const end =
    Date.now() +
    seconds * 1000;

  timerId =
    setInterval(() => {

      const remaining =
        Math.max(
          0,
          end - Date.now()
        );

      const totalSeconds =
        Math.ceil(
          remaining / 1000
        );

      const minutes =
        String(
          Math.floor(
            totalSeconds / 60
          )
        ).padStart(2,"0");

      const secs =
        String(
          totalSeconds % 60
        ).padStart(2,"0");

      if($("#timerOut")){

        $("#timerOut")
          .textContent =
          `${minutes}:${secs}`;

      }

      if(remaining <= 0){

        clearInterval(timerId);

        alert(
          "⏰ Tiempo terminado."
        );

      }

    },50);

}


/* =========================================
   CRONÓMETRO
========================================= */

let stopwatchId = null;
let stopwatchStart = 0;
let stopwatchElapsed = 0;

function swStart(){

  if(stopwatchId){
    return;
  }

  stopwatchStart =
    Date.now() -
    stopwatchElapsed;

  stopwatchId =
    setInterval(() => {

      const elapsed =
        Date.now() -
        stopwatchStart;

      if($("#swOut")){

        $("#swOut")
          .textContent =
          (
            elapsed / 1000
          ).toFixed(1);

      }

    },50);

}

function swStop(){

  clearInterval(
    stopwatchId
  );

  stopwatchId = null;

  stopwatchElapsed =
    Date.now() -
    stopwatchStart;

}

function swReset(){

  swStop();

  stopwatchElapsed = 0;

  if($("#swOut")){

    $("#swOut")
      .textContent =
      "00:00.0";

  }

}


/* =========================================
   NOTAS
========================================= */

function saveNotes(){

  state.notes =
    $("#noteText").value;

  save();

  alert(
    "Nota guardada."
  );

}


/* =========================================
   TAREAS
========================================= */

function renderTasks(){

  const list =
    $("#taskList");

  if(!list) return;

  list.innerHTML =
    state.tasks
      .map(
        (task,index) => `
          <div
            class="list-row
            ${task.done ? "done" : ""}"
          >

            <span>
              ${esc(task.text)}
            </span>

            <button
              onclick="toggleTask(${index})"
            >
              ${task.done ? "↩️" : "✅"}
            </button>

          </div>
        `
      )
      .join("");

}

function addTask(){

  const input =
    $("#taskInput");

  const text =
    input.value.trim();

  if(!text) return;

  state.tasks.push({
    text,
    done:false
  });

  save();

  input.value = "";

  renderTasks();

}

function toggleTask(index){

  state.tasks[index].done =
    !state.tasks[index].done;

  save();

  renderTasks();

}


/* =========================================
   LISTA DE COMPRAS
========================================= */

function renderShopping(){

  const list =
    $("#shopList");

  if(!list) return;

  list.innerHTML =
    state.shopping
      .map(
        (item,index) => `
          <div
            class="list-row
            ${item.done ? "done" : ""}"
          >

            <span>
              ${esc(item.text)}
            </span>

            <button
              onclick="toggleShop(${index})"
            >
              ${item.done ? "↩️" : "☑️"}
            </button>

          </div>
        `
      )
      .join("");

}

function addShop(){

  const input =
    $("#shopItem");

  const text =
    input.value.trim();

  if(!text) return;

  state.shopping.push({
    text,
    done:false
  });

  save();

  input.value = "";

  renderShopping();

}

function toggleShop(index){

  state.shopping[index].done =
    !state.shopping[index].done;

  save();

  renderShopping();

}


/* =========================================
   CONTRASEÑA
========================================= */

function passwordGo(){

  const length =
    Math.min(
      64,
      Math.max(
        6,
        Number($("#f1").value)
      )
    );

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ" +
    "abcdefghijkmnopqrstuvwxyz" +
    "23456789!@#$%";

  const randomValues =
    new Uint32Array(length);

  crypto.getRandomValues(
    randomValues
  );

  const password =
    [...randomValues]
      .map(
        value =>
          chars[
            value %
            chars.length
          ]
      )
      .join("");

  openModal(
    "🔐 Contraseña",

    result(`
      <div class="big-result">
        ${esc(password)}
      </div>

      <div class="actions">

        <button
          onclick="navigator.clipboard.writeText('${password}')"
        >
          Copiar
        </button>

      </div>
    `)
  );

}


/* =========================================
   NÚMERO ALEATORIO
========================================= */

function randomGo(){

  const min =
    Number($("#f1").value);

  const max =
    Number($("#f2").value);

  if(min > max){

    alert(
      "El mínimo debe ser menor o igual al máximo."
    );

    return;

  }

  const value =
    Math.floor(
      Math.random() *
      (max - min + 1)
    ) + min;

  openModal(
    "🎲 Resultado",

    result(`
      <div class="big-result">
        ${value}
      </div>
    `)
  );

}


/* =========================================
   DADOS
========================================= */

function diceGo(){

  const amount =
    Math.min(
      20,
      Math.max(
        1,
        Number($("#f1").value)
      )
    );

  const rolls =
    Array.from(
      {length:amount},
      () =>
        1 +
        Math.floor(
          Math.random() * 6
        )
    );

  const total =
    rolls.reduce(
      (a,b) => a + b,
      0
    );

  openModal(
    "🎲 Resultado",

    result(`
      <div class="big-result">
        ${rolls.join(" · ")}
      </div>

      <p>
        Suma: ${total}
      </p>
    `)
  );

}


/* =========================================
   DICCIONARIO
========================================= */

async function dictGo(){

  const word =
    $("#f1").value.trim();

  if(!word) return;

  remember(
    "diccionario " +
    word
  );

  try{

    const response =
      await fetch(
        "https://api.dictionaryapi.dev/api/v2/entries/en/" +
        encodeURIComponent(word)
      );

    if(!response.ok){
      throw Error();
    }

    const data =
      await response.json();

    const meaning =
      data[0]
        ?.meanings?.[0];

    const definition =
      meaning
        ?.definitions?.[0]
        ?.definition ||
      "Sin definición.";

    openModal(
      "📖 Diccionario",

      result(`
        <b>
          ${esc(data[0].word)}
        </b>

        <br><br>

        ${esc(definition)}
      `)
    );

  }

  catch{

    openModal(
      "📖 Diccionario",

      result(`
        No se pudo consultar ahora.
        Comprueba tu conexión.
      `)
    );

  }

}


/* =========================================
   CONTADOR DE TEXTO
========================================= */

function updateTextCounter(){

  const text =
    $("#f1").value;

  const characters =
    text.length;

  const words =
    text.trim()
      ? text.trim().split(/\s+/).length
      : 0;

  const lines =
    text
      ? text.split(/\n/).length
      : 0;

  $("#tc").textContent =
    `${characters} caracteres · ` +
    `${words} palabras · ` +
    `${lines} líneas`;

}


/* =========================================
   CAMBIO DE TEXTO
========================================= */

function caseGo(mode){

  const input =
    $("#f1");

  if(mode === "upper"){

    input.value =
      input.value.toUpperCase();

  }

  else if(mode === "lower"){

    input.value =
      input.value.toLowerCase();

  }

  else{

    input.value =
      input.value
        .toLowerCase()
        .replace(
          /\b\w/g,
          char =>
            char.toUpperCase()
        );

  }

}


/* =========================================
   ESTUDIO
========================================= */

function studyGo(){

  const objective =
    $("#f1").value;

  const minutes =
    Number($("#f2").value);

  openModal(
    "📚 Sesión creada",

    result(`
      <b>
        ${esc(objective)}
      </b>

      <br><br>

      Bloque recomendado:

      <div class="big-result">
        ${minutes} min
      </div>
    `)
  );

}


/* =========================================
   COMIDA
========================================= */

$("#foodSearch").onclick = () => {

  googleMaps(
    $("#foodInput").value.trim() ||
    "restaurantes cerca de mí"
  );

};

$$("[data-food]").forEach(
  button => {

    button.onclick = () => {

      googleMaps(
        button.dataset.food +
        " cerca de mí"
      );

    };

  }
);


/* =========================================
   COMPRAS
========================================= */

$("#shopSearch").onclick = () => {

  webSearch(
    $("#shopInput").value.trim() ||
    "tiendas productos"
  );

};

$$("[data-shop]").forEach(
  button => {

    button.onclick = () => {

      webSearch(
        button.dataset.shop +
        " Perú"
      );

    };

  }
);


/* =========================================
   CERCA DE MÍ
========================================= */

$$("[data-near]").forEach(
  button => {

    button.onclick = () => {

      googleMaps(
        button.dataset.near +
        " cerca de mí"
      );

    };

  }
);


$("#locationBtn").onclick = () => {

  if(!navigator.geolocation){

    $("#locationStatus")
      .textContent =
      "Tu navegador no permite geolocalización.";

    return;

  }

  $("#locationStatus")
    .textContent =
    "Solicitando ubicación...";

  navigator.geolocation.getCurrentPosition(

    position => {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      $("#locationStatus")
        .textContent =
        "Ubicación obtenida.";

      googleMaps(
        "lugares cerca de " +
        latitude +
        "," +
        longitude
      );

    },

    () => {

      $("#locationStatus")
        .textContent =
        "No se pudo obtener la ubicación. Puedes escribir una zona manualmente.";

    }

  );

};


$("#manualLocation")
  .addEventListener(
    "change",
    event => {

      const value =
        event.target.value.trim();

      if(value){

        $("#locationStatus")
          .textContent =
          "Zona manual: " +
          value;

      }

    }
  );


/* =========================================
   TEMA
========================================= */

$("#themeBtn").onclick = () => {

  state.theme =
    state.theme === "dark"
      ? "light"
      : "dark";

  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );

  save();

};


/* =========================================
   ANIMACIONES
========================================= */

$("#animationBtn").onclick = () => {

  state.reduceMotion =
    !state.reduceMotion;

  document.body.classList.toggle(
    "reduce-motion",
    state.reduceMotion
  );

  $("#animationBtn")
    .textContent =
      state.reduceMotion
        ? "✨ Activar animaciones"
        : "✨ Reducir animaciones";

  save();

};


/* =========================================
   EXPORTAR
========================================= */

$("#exportBtn").onclick = () => {

  const blob =
    new Blob(
      [
        JSON.stringify(
          state,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

  const link =
    document.createElement("a");

  link.href =
    URL.createObjectURL(blob);

  link.download =
    "utilhub-v-respaldo.json";

  link.click();

  URL.revokeObjectURL(
    link.href
  );

};


/* =========================================
   IMPORTAR
========================================= */

$("#importBtn").onclick = () => {

  $("#importFile").click();

};


$("#importFile").onchange = event => {

  const file =
    event.target.files[0];

  if(!file) return;

  const reader =
    new FileReader();

  reader.onload = () => {

    try{

      Object.assign(
        state,
        JSON.parse(
          reader.result
        )
      );

      save();

      location.reload();

    }

    catch{

      alert(
        "Archivo de respaldo inválido."
      );

    }

  };

  reader.readAsText(file);

};


/* =========================================
   BORRAR DATOS
========================================= */

$("#clearBtn").onclick = () => {

  if(
    confirm(
      "¿Borrar todas las notas, tareas, listas, favoritos e historial locales?"
    )
  ){

    localStorage.removeItem(
      STORAGE_KEY
    );

    location.reload();

  }

};


/* =========================================
   CONEXIÓN
========================================= */

function updateConnection(){

  const connection =
    document.querySelector(
      ".connection"
    );

  const online =
    navigator.onLine;

  connection.classList.toggle(
    "online",
    online
  );

  connection.classList.toggle(
    "offline",
    !online
  );

  $("#connectionText")
    .textContent =
      online
        ? "Conectado"
        : "Sin conexión · herramientas locales disponibles";

}

window.addEventListener(
  "online",
  updateConnection
);

window.addEventListener(
  "offline",
  updateConnection
);


/* =========================================
   INICIO
========================================= */

document.body.classList.toggle(
  "light",
  state.theme === "light"
);

document.body.classList.toggle(
  "reduce-motion",
  state.reduceMotion
);

$("#animationBtn")
  .textContent =
    state.reduceMotion
      ? "✨ Activar animaciones"
      : "✨ Reducir animaciones";

renderSaved();

updateConnection();
