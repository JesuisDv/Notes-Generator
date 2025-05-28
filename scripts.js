// Funcion para detectar automaticamente las columnas correctas
function detectarColumnas(objeto){
    const claves = Object.keys(objeto); //Tomas nombres de columnas
    const buscar = (regex) => claves.find(k => regex.test(k.toLowerCase())) //Se busca por patron

    return{ //Regresa las claves correspondiente a cada campo
        campaignKey: buscar(/camp|campaign|campaña/),
        pagoKey: buscar(/ref|pago|reference|payment/),
        telefonoKey: buscar(/phone|number|numero|número/)
    };
}

// Limpiar área de texto
function limpiarTexto(){
    document.getElementById("textoManual").value = "";
};

//Funcion principal
async function procesarDatos() {
  const textoManual = document.getElementById("textoManual").value.trim();
  const salidaDatos = document.getElementById("salidaNotas");
  salidaDatos.textContent = "";

  let filasManuales = []; //Array para almacenar los datos ingresados de forma manual

  if (textoManual) {
  const lineas = textoManual.split(/\r?\n/).filter(l => l.trim() !== '');

  // Usamos tabulador para separar columnas
  const encabezado = lineas[0].split('\t');
  const clavesLower = encabezado.map(k => k.toLowerCase());

  const buscar = (preferencias) => {
    for (const pref of preferencias) {
      const idx = clavesLower.findIndex(k => k === pref);
      if (idx !== -1) return idx;
    }
    for (const pref of preferencias) {
      const idx = clavesLower.findIndex(k => k.includes(pref));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const iCamp = buscar(["campaign", "campaña", "camp"]);
  const iPago = buscar(["payment_ref", "ref", "pago", "reference"]);
  const iTel = buscar(["phone_number", "phone", "telefono", "número"]);

  if (iCamp === -1 || iPago === -1 || iTel === -1) {
    alert("No se detectaron las columnas necesarias en el texto manual.");
    return;
  }

  // Procesamos el resto de líneas como filas de datos
  for (let i = 1; i < lineas.length; i++) {
    const partes = lineas[i].split('\t');
    filasManuales.push({
      campaign: partes[iCamp] || '',
      pago_ref: partes[iPago] || '',
      telefono: partes[iTel] || ''
    });
  }
}


  // Lee el archivo Excel si es que se cargó
  const input = document.getElementById("archivoExcel");
  let filasExcel = [];

  if (input.files.length){
      const archivo = input.files[0];
      const data = await archivo.arrayBuffer(); // Se lee el archivo como buffer
      const workbook = XLSX.read(data, {type: "array"}); // Interpretamos el archivo excel
      const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Tomamos la primera hoja del archivo
      const rawRows = XLSX.utils.sheet_to_json(sheet); // Convertimos la hoja a objetos

      // Si hay datos, buscamos las columnas correctas
      if (rawRows.length > 0){
          const columnas = detectarColumnas(rawRows[0]); // Detectamos qué columnas usar
          // Se muestra error si no se encuentran las columnas
          if (!columnas.campaignKey || !columnas.pagoKey || !columnas.telefonoKey){
              alert("No se detectaron las columnas necesarias, esfuerzate más.");
              return;
          }

          // Extraemos solo las columnas necesarias
          filasExcel = rawRows.map(row => ({
              campaign: row[columnas.campaignKey] || '',
              pago_ref: row[columnas.pagoKey] || '',
              telefono: row[columnas.telefonoKey] || ''
          }));
      };
  }

  // Se unen los datos manuales y los del Excel
  const allFilas = filasManuales.concat(filasExcel);

  if (allFilas.length == 0){
      salidaDatos.textContent = "No hay datos para mostrar.";
      return;
  }

  // Plantilla texto final formateado
  let contenido = "";
  allFilas.forEach(row => {
      contenido += `Sales Campaign: ${row.campaign || ''}\n`;
      contenido += `Outcome: Player made the Criptocurrency deposit as promised.\n`;
      contenido += `Payment ref: ${row.pago_ref || ''}\n`;
      contenido += `Phone Number: ${row.telefono || ''}\n\n`;
  });

  salidaDatos.textContent = contenido;
};
