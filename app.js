// ==========================================
// 1. INICIALIZACIÓN Y BASE DE DATOS LOCAL
// ==========================================
const CLAVE_ALMACENAMIENTO = "muebleria-datos";

let productos = [];
let carrito = [];
let presupuestos = [];

function inicializarDatos() {
    const datosGuardados = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        productos = datos.productos || [];
        carrito = datos.carrito || [];
        presupuestos = datos.presupuestos || [];
    } else {
        productos = [
            { codigo: "LIV01", nombre: "Sillón 3 Cuerpos", categoria: "Living", material: "Tela antidesgarro", medidas: "200x90x85cm", precio: 350000, imagen: "imagenes/sillon.jpg" },
            { codigo: "LIV02", nombre: "Mesa Ratona", categoria: "Living", material: "Madera y Hierro", medidas: "100x60x45cm", precio: 85000, imagen: "imagenes/mesa-ratona.jpg" },
            { codigo: "COM01", nombre: "Mesa de Comedor", categoria: "Comedor", material: "Madera de roble", medidas: "160x90x75cm", precio: 220000, imagen: "imagenes/mesa-roble.jpg" },
            { codigo: "COM02", nombre: "Silla Tapizada", categoria: "Comedor", material: "Madera y Lino", medidas: "45x45x95cm", precio: 45000, imagen: "imagenes/silla.jpg" },
            { codigo: "DOR01", nombre: "Cama Queen Size", categoria: "Dormitorio", material: "Madera maciza", medidas: "160x200x40cm", precio: 280000, imagen: "imagenes/cama.jpg" },
            { codigo: "DOR02", nombre: "Mesa de Luz", categoria: "Dormitorio", material: "Melamina", medidas: "40x40x60cm", precio: 35000, imagen: "imagenes/mesa-luz.jpg" }
        ];
        carrito = [];
        presupuestos = [];
        guardarEnLocalStorage();
    }
}

function guardarEnLocalStorage() {
    const datos = { productos, carrito, presupuestos };
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(datos));
}

// ==========================================
// 2. CATÁLOGO Y FILTROS
// ==========================================
function mostrarCatalogo(listaMuebles = productos) {
    const contenedorGrilla = document.getElementById("grilla-productos");
    if (!contenedorGrilla) return;

    contenedorGrilla.innerHTML = ""; 

    if (listaMuebles.length === 0) {
        contenedorGrilla.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; font-size: 1.2rem; font-weight: bold; color: var(--color-madera);'>No encontramos muebles con esos filtros.</p>";
        return;
    }

    const formateadorPesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    listaMuebles.forEach(producto => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-producto";
        tarjeta.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.outerHTML='<div style=\'height:200px; display:flex; align-items:center; justify-content:center; background:#eee; font-size:3rem;\'>📦</div>'">
            <div class="info-producto">
                <h3>${producto.nombre}</h3>
                <p><strong>Categoría:</strong> ${producto.categoria}</p>
                <p><strong>Material:</strong> ${producto.material}</p>
                <p><strong>Medidas:</strong> ${producto.medidas}</p>
                <p class="precio-destacado">${formateadorPesos.format(producto.precio)}</p>
                <button class="btn-comprar" onclick="agregarAlCarrito('${producto.codigo}')">🛒 Agregar al carrito</button>
            </div>
        `;
        contenedorGrilla.appendChild(tarjeta);
    });
}

const inputBusqueda = document.getElementById('filtro-busqueda');
const selectCategoria = document.getElementById('filtro-categoria');
const inputPrecioMax = document.getElementById('filtro-precio-max');
const selectOrden = document.getElementById('filtro-orden');

function filtrarYOrdenar() {
    const textoBuscado = inputBusqueda ? inputBusqueda.value.toLowerCase() : '';
    const categoriaElegida = selectCategoria ? selectCategoria.value.toLowerCase() : '';
    const precioMaximo = (inputPrecioMax && inputPrecioMax.value) ? parseFloat(inputPrecioMax.value) : Infinity; 
    const orden = selectOrden ? selectOrden.value : 'relevancia';

    let productosFiltrados = productos.filter(producto => {
        const coincideNombre = producto.nombre.toLowerCase().includes(textoBuscado);
        const coincideCategoria = categoriaElegida === "" || producto.categoria.toLowerCase() === categoriaElegida;
        const coincidePrecio = producto.precio <= precioMaximo;
        return coincideNombre && coincideCategoria && coincidePrecio;
    });

    if (orden === 'menor-mayor') {
        productosFiltrados.sort((a, b) => a.precio - b.precio); 
    } else if (orden === 'mayor-menor') {
        productosFiltrados.sort((a, b) => b.precio - a.precio);
    }

    mostrarCatalogo(productosFiltrados);
}

if (inputBusqueda) inputBusqueda.addEventListener('input', filtrarYOrdenar);
if (selectCategoria) selectCategoria.addEventListener('change', filtrarYOrdenar);
if (inputPrecioMax) inputPrecioMax.addEventListener('input', filtrarYOrdenar);
if (selectOrden) selectOrden.addEventListener('change', filtrarYOrdenar);

// ==========================================
// 3. ADMINISTRACIÓN DE PRODUCTOS (CRUD)
// ==========================================
let codigoEnEdicion = null;
const formProducto = document.getElementById('formulario-producto');
const cuerpoTabla = document.getElementById('cuerpo-tabla-productos');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

function mostrarError(idError, mensaje) {
    const spanError = document.getElementById(idError);
    if(spanError) { spanError.textContent = mensaje; spanError.style.display = 'block'; }
}

function limpiarErrores() {
    document.querySelectorAll('.mensaje-error').forEach(span => span.style.display = 'none');
}

if (formProducto) {
    formProducto.addEventListener('submit', function(evento) {
        evento.preventDefault(); 
        limpiarErrores();
        let formularioValido = true;

        const codigo = document.getElementById('prod-codigo').value.trim();
        const nombre = document.getElementById('prod-nombre').value.trim();
        const categoria = document.getElementById('prod-categoria').value.trim();
        const material = document.getElementById('prod-material').value.trim();
        const medidas = document.getElementById('prod-medidas').value.trim();
        const precio = parseInt(document.getElementById('prod-precio').value);
        const imagen = document.getElementById('prod-imagen').value.trim();

        const regexCodigo = /^[A-Za-z]{3}-\d{2}$/;
        if (!regexCodigo.test(codigo)) {
            mostrarError('error-codigo', 'El código debe tener 3 letras, un guion y 2 números (Ej: MES-01).');
            formularioValido = false;
        } else {
            const existe = productos.find(p => p.codigo === codigo);
            if (existe && codigo !== codigoEnEdicion) {
                mostrarError('error-codigo', 'Este código ya existe en el sistema.');
                formularioValido = false;
            }
        }
        if (nombre === '') { mostrarError('error-nombre', 'El nombre es obligatorio.'); formularioValido = false; }
        if (medidas === '') { mostrarError('error-medidas', 'Las medidas son obligatorias.'); formularioValido = false; }
        if (isNaN(precio) || precio <= 0) { mostrarError('error-precio', 'El precio debe ser un número entero mayor a cero.'); formularioValido = false; }
        if (!/\.(jpg|png|webp)$/i.test(imagen)) { mostrarError('error-imagen', 'La ruta debe terminar en .jpg, .png o .webp.'); formularioValido = false; }

        if (formularioValido) {
            const nuevoProducto = { codigo, nombre, categoria, material, medidas, precio, imagen };
            if (codigoEnEdicion) {
                const indice = productos.findIndex(p => p.codigo === codigoEnEdicion);
                productos[indice] = nuevoProducto;
                codigoEnEdicion = null;
                document.getElementById('prod-codigo').disabled = false;
                if(btnCancelarEdicion) btnCancelarEdicion.style.display = 'none';
            } else {
                productos.push(nuevoProducto);
            }
            guardarEnLocalStorage(); 
            filtrarYOrdenar(); 
            renderizarTablaProductos(); 
            formProducto.reset(); 
            alert('¡Producto guardado con éxito!');
        }
    });
}

function renderizarTablaProductos() {
    if (!cuerpoTabla) return;
    cuerpoTabla.innerHTML = ''; 
    productos.forEach(producto => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><img src="${producto.imagen}" alt="${producto.nombre}" class="miniatura-tabla" onerror="this.outerHTML='<div style=\'font-size:2rem;\'>📦</div>'"></td>
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>$${producto.precio}</td>
            <td>
                <button onclick="cargarEdicion('${producto.codigo}')" style="padding:0.3rem; margin-right:0.5rem; background-color:var(--color-madera);">✏️ Editar</button>
                <button onclick="eliminarProducto('${producto.codigo}')" style="padding:0.3rem; background-color:red; color:white;">🗑️ Borrar</button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}

window.eliminarProducto = function(codigoABorrar) {
    if (confirm(`¿Estás seguro que deseás eliminar el producto ${codigoABorrar}?`)) {
        productos = productos.filter(p => p.codigo !== codigoABorrar);
        guardarEnLocalStorage();
        filtrarYOrdenar();
        renderizarTablaProductos();
    }
};

window.cargarEdicion = function(codigoAEditar) {
    const producto = productos.find(p => p.codigo === codigoAEditar);
    if (producto) {
        document.getElementById('prod-codigo').value = producto.codigo;
        document.getElementById('prod-nombre').value = producto.nombre;
        document.getElementById('prod-categoria').value = producto.categoria;
        document.getElementById('prod-material').value = producto.material;
        document.getElementById('prod-medidas').value = producto.medidas;
        document.getElementById('prod-precio').value = producto.precio;
        document.getElementById('prod-imagen').value = producto.imagen;
        codigoEnEdicion = producto.codigo;
        document.getElementById('prod-codigo').disabled = true;
        if(btnCancelarEdicion) btnCancelarEdicion.style.display = 'inline-block';
        limpiarErrores();
        document.getElementById('seccion-administracion').scrollIntoView({ behavior: 'smooth' });
    }
};

if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener('click', function() {
        if(formProducto) formProducto.reset();
        codigoEnEdicion = null;
        document.getElementById('prod-codigo').disabled = false;
        btnCancelarEdicion.style.display = 'none';
        limpiarErrores();
    });
}

// ==========================================
// 4. CARRITO DE COMPRAS
// ==========================================
function actualizarContadorCarrito() {
    const contador = document.getElementById('contador-carrito');
    if(contador) contador.textContent = carrito.reduce((suma, item) => suma + item.cantidad, 0);
}

window.agregarAlCarrito = function(codigoProducto) {
    const productoEncontrado = productos.find(p => p.codigo === codigoProducto);
    if (!productoEncontrado) return;
    const itemEnCarrito = carrito.find(item => item.codigo === codigoProducto);
    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < 20) {
            itemEnCarrito.cantidad++;
            alert(`Sumamos otra unidad de ${productoEncontrado.nombre} al carrito.`);
        } else {
            alert("La cantidad máxima por producto es 20 unidades.");
        }
    } else {
        carrito.push({ ...productoEncontrado, cantidad: 1 });
        alert(`¡${productoEncontrado.nombre} agregado al carrito!`);
    }
    guardarEnLocalStorage();
    actualizarContadorCarrito();
    renderizarCarrito();
};

function renderizarCarrito() {
    const panelCarrito = document.getElementById("panel-carrito");
    const montoTotalDOM = document.getElementById("monto-total");
    if (!panelCarrito || !montoTotalDOM) return;
    panelCarrito.innerHTML = "";
    let total = 0;
    if (carrito.length === 0) {
        panelCarrito.innerHTML = "<p>El carrito está vacío. ¡Andá al catálogo a buscar muebles!</p>";
        montoTotalDOM.textContent = "0";
        return;
    }
    const formateadorPesos = new Intl.NumberFormat('es-AR');
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        const filaItem = document.createElement("div");
        filaItem.style = "display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #ccc; padding: 1rem 0; flex-wrap: wrap;";
        filaItem.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}" class="miniatura-tabla" onerror="this.outerHTML='<div class=\\'miniatura-tabla\\' style=\\'background:#eee; display:flex; align-items:center; justify-content:center;\\'>📦</div>'">
            <div style="flex-grow: 1; min-width: 150px;">
                <h4 style="margin-bottom: 0;">${item.nombre}</h4>
                <p style="margin: 0; font-size: 0.9rem;">$${formateadorPesos.format(item.precio)} c/u</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button onclick="modificarCantidad('${item.codigo}', -1)" style="padding: 0.3rem 0.7rem;">-</button>
                <strong style="width: 20px; text-align: center;">${item.cantidad}</strong>
                <button onclick="modificarCantidad('${item.codigo}', 1)" style="padding: 0.3rem 0.7rem;">+</button>
            </div>
            <div style="min-width: 100px; text-align: right;"><strong>$${formateadorPesos.format(subtotal)}</strong></div>
            <button onclick="quitarDelCarrito('${item.codigo}')" style="background-color: red; padding: 0.4rem; border-radius: 4px;">🗑️</button>
        `;
        panelCarrito.appendChild(filaItem);
    });
    montoTotalDOM.textContent = formateadorPesos.format(total);
}

window.modificarCantidad = function(codigoProducto, cambio) {
    const item = carrito.find(i => i.codigo === codigoProducto);
    if (!item) return;
    let nuevaCantidad = item.cantidad + cambio;
    if (nuevaCantidad >= 1 && nuevaCantidad <= 20) {
        item.cantidad = parseInt(nuevaCantidad);
        guardarEnLocalStorage();
        actualizarContadorCarrito();
        renderizarCarrito();
    } else if (nuevaCantidad > 20) {
        alert("No podés llevar más de 20 unidades de este mueble.");
    }
};

window.quitarDelCarrito = function(codigoProducto) {
    carrito = carrito.filter(item => item.codigo !== codigoProducto);
    guardarEnLocalStorage();
    actualizarContadorCarrito();
    renderizarCarrito();
};

const btnVaciarCarrito = document.getElementById("btn-vaciar-carrito");
if (btnVaciarCarrito) {
    btnVaciarCarrito.addEventListener("click", function() {
        if (carrito.length > 0) {
            if (confirm("¿Estás seguro de que querés vaciar todo el carrito?")) {
                carrito = [];
                guardarEnLocalStorage();
                actualizarContadorCarrito();
                renderizarCarrito();
            }
        } else {
            alert("El carrito ya está vacío.");
        }
    });
}

// ==========================================
// 5. NAVEGACIÓN DEL MENÚ
// ==========================================
const btnCatalogo = document.getElementById('btn-menu-catalogo');
const btnCarrito = document.getElementById('btn-menu-carrito');
const btnPresupuestos = document.getElementById('btn-menu-presupuestos');
const btnAdministracion = document.getElementById('btn-menu-administracion');

const seccionCatalogo = document.getElementById('seccion-catalogo');
const seccionCarrito = document.getElementById('seccion-carrito');
const seccionPresupuesto = document.getElementById('seccion-presupuesto');
const seccionAdministracion = document.getElementById('seccion-administracion');

function ocultarTodasLasSecciones() {
    if(seccionCatalogo) seccionCatalogo.style.display = 'none';
    if(seccionCarrito) seccionCarrito.style.display = 'none';
    if(seccionPresupuesto) seccionPresupuesto.style.display = 'none';
    if(seccionAdministracion) seccionAdministracion.style.display = 'none';
}

if(btnCatalogo) btnCatalogo.addEventListener('click', () => { ocultarTodasLasSecciones(); seccionCatalogo.style.display = 'block'; });
if(btnCarrito) btnCarrito.addEventListener('click', () => { ocultarTodasLasSecciones(); seccionCarrito.style.display = 'block'; });
if(btnPresupuestos) btnPresupuestos.addEventListener('click', () => { ocultarTodasLasSecciones(); seccionPresupuesto.style.display = 'block'; });
if(btnAdministracion) btnAdministracion.addEventListener('click', () => { ocultarTodasLasSecciones(); seccionAdministracion.style.display = 'block'; });


// ==========================================
// 6. SISTEMA DE PRESUPUESTOS
// ==========================================
const formPresupuesto = document.getElementById('formulario-presupuesto');
const areaPresupuesto = document.getElementById('area-presupuesto');

if (formPresupuesto) {
    formPresupuesto.addEventListener('submit', function(e) {
        e.preventDefault();

        if (carrito.length === 0) {
            alert("El carrito está vacío. Agregá productos primero para generar un presupuesto.");
            return;
        }

        const cliente = document.getElementById('presupuesto-cliente').value.trim();
        const descuento = parseFloat(document.getElementById('presupuesto-descuento').value) || 0;
        const validezDias = parseInt(document.getElementById('presupuesto-validez').value) || 15;

        if (descuento < 0 || descuento > 30) {
            alert("El descuento debe estar entre 0% y 30%.");
            return;
        }

        const numeroCorrelativo = presupuestos.length + 1;
        const numeroPresupuesto = `PRE-${String(numeroCorrelativo).padStart(4, '0')}`;

        const fechaHoy = new Date();
        const fechaValidez = new Date();
        fechaValidez.setDate(fechaHoy.getDate() + validezDias);
        const formateadorFecha = new Intl.DateTimeFormat('es-AR');

        let subtotal = 0;
        const itemsCopia = carrito.map(item => {
            const subtotalItem = item.precio * item.cantidad;
            subtotal += subtotalItem;
            return { ...item, subtotalItem }; 
        });

        const montoDescuento = subtotal * (descuento / 100);
        const total = subtotal - montoDescuento;

        const nuevoPresupuesto = {
            numero: numeroPresupuesto,
            cliente: cliente,
            fecha: formateadorFecha.format(fechaHoy),
            validez: formateadorFecha.format(fechaValidez),
            descuentoPorcentaje: descuento,
            subtotal: subtotal,
            montoDescuento: montoDescuento,
            total: total,
            items: itemsCopia
        };

        presupuestos.push(nuevoPresupuesto);
        guardarEnLocalStorage();

        formPresupuesto.reset();
        renderizarPresupuestoDocumento(nuevoPresupuesto);
        renderizarListaPresupuestos();
        alert(`¡Presupuesto ${numeroPresupuesto} generado con éxito!`);
    });
}

function renderizarPresupuestoDocumento(presup) {
    if (!areaPresupuesto) return;
    const formateadorPesos = new Intl.NumberFormat('es-AR');
    let filasTabla = '';
    
    presup.items.forEach(item => {
        filasTabla += `
            <tr>
                <td style="padding: 0.5rem; border: 1px solid #ccc;">${item.codigo}</td>
                <td style="padding: 0.5rem; border: 1px solid #ccc;">${item.nombre}</td>
                <td style="padding: 0.5rem; border: 1px solid #ccc; text-align: center;">${item.cantidad}</td>
                <td style="padding: 0.5rem; border: 1px solid #ccc; text-align: right;">$${formateadorPesos.format(item.precio)}</td>
                <td style="padding: 0.5rem; border: 1px solid #ccc; text-align: right;">$${formateadorPesos.format(item.subtotalItem)}</td>
            </tr>
        `;
    });

    let textoWhatsApp = `¡Hola ${presup.cliente}! Te envío el Presupuesto ${presup.numero} de Mueblería Roble:\n\n`;
    presup.items.forEach(i => {
        textoWhatsApp += `- ${i.cantidad}x ${i.nombre} ($${formateadorPesos.format(i.subtotalItem)})\n`;
    });
    textoWhatsApp += `\nSubtotal: $${formateadorPesos.format(presup.subtotal)}`;
    if (presup.descuentoPorcentaje > 0) {
        textoWhatsApp += `\nDescuento (${presup.descuentoPorcentaje}%): -$${formateadorPesos.format(presup.montoDescuento)}`;
    }
    textoWhatsApp += `\n*Total Final: $${formateadorPesos.format(presup.total)}*`;
    textoWhatsApp += `\nVálido hasta el ${presup.validez}.`;

    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`;

    const htmlDocumento = `
        <div id="documento-imprimir" style="background: white; padding: 2rem; border: 1px solid #ccc; border-radius: 8px; margin-top: 2rem; color: #333;">
            <div style="text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid var(--color-madera); padding-bottom: 1rem;">
                <h2 style="margin: 0; color: var(--color-madera);">Mueblería Roble</h2>
                <p style="margin: 0;">Presupuesto Oficial</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <p><strong>Cliente:</strong> ${presup.cliente}</p>
                    <p><strong>N° Presupuesto:</strong> ${presup.numero}</p>
                </div>
                <div style="text-align: right;">
                    <p><strong>Fecha de Emisión:</strong> ${presup.fecha}</p>
                    <p><strong>Válido hasta:</strong> ${presup.validez}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
                <thead>
                    <tr style="background-color: var(--color-beige);">
                        <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: left;">Código</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: left;">Descripción</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc;">Cant.</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: right;">Precio Unit.</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasTabla}
                </tbody>
            </table>

            <div style="text-align: right; font-size: 1.1rem;">
                <p><strong>Subtotal:</strong> $${formateadorPesos.format(presup.subtotal)}</p>
                <p><strong>Descuento (${presup.descuentoPorcentaje}%):</strong> -$${formateadorPesos.format(presup.montoDescuento)}</p>
                <h3 style="color: var(--color-oliva); margin-top: 0.5rem; font-size: 1.3rem;">Total Final: $${formateadorPesos.format(presup.total)}</h3>
            </div>

            <div style="text-align: center; margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button type="button" onclick="window.print()" style="background-color: var(--color-madera); color: white; padding: 0.6rem 1.2rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">
                    🖨️ Imprimir / Guardar PDF
                </button>
                <a href="${urlWhatsApp}" target="_blank" style="background-color: #25D366; color: white; padding: 0.6rem 1.2rem; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 1rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                    💬 Enviar por WhatsApp
                </a>
            </div>
        </div>
    `;
    areaPresupuesto.innerHTML = htmlDocumento;
}

function renderizarListaPresupuestos() {
    let contenedorLista = document.getElementById("lista-presupuestos-historicos");
    
    if (!contenedorLista) {
        contenedorLista = document.createElement("div");
        contenedorLista.id = "lista-presupuestos-historicos";
        if(areaPresupuesto && areaPresupuesto.parentNode) {
            areaPresupuesto.parentNode.appendChild(contenedorLista);
        }
    }
    
    if (presupuestos.length === 0) {
        contenedorLista.innerHTML = "";
        return;
    }

    const formateadorPesos = new Intl.NumberFormat('es-AR');
    let htmlLista = `
        <h3 style="margin-top: 3rem; border-top: 2px solid #eee; padding-top: 1.5rem;">Historial de Presupuestos</h3>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; background: white; border: 1px solid #ccc;">
                <thead>
                    <tr style="background-color: var(--color-fondo);">
                        <th style="padding: 0.5rem; border: 1px solid #ccc;">Número</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc;">Fecha</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc;">Cliente</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc;">Total</th>
                        <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: center;">Acción</th>
                    </tr>
                </thead>
                <tbody>
    `;

    presupuestos.slice().reverse().forEach(p => {
        htmlLista += `
            <tr>
                <td style="padding: 0.5rem; border: 1px solid #ccc;"><strong>${p.numero}</strong></td>
                <td style="padding: 0.5rem; border: 1px solid #ccc;">${p.fecha}</td>
                <td style="padding: 0.5rem; border: 1px solid #ccc;">${p.cliente}</td>
                <td style="padding: 0.5rem; border: 1px solid #ccc;">$${formateadorPesos.format(p.total)}</td>
                <td style="padding: 0.5rem; border: 1px solid #ccc; text-align: center;">
                    <button onclick="verPresupuestoHistorico('${p.numero}')" style="padding: 0.3rem 0.6rem; font-size: 0.9rem; background-color: var(--color-madera); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        📄 Ver
                    </button>
                </td>
            </tr>
        `;
    });

    htmlLista += `</tbody></table></div>`;
    contenedorLista.innerHTML = htmlLista;
}

window.verPresupuestoHistorico = function(numero) {
    const presup = presupuestos.find(p => p.numero === numero);
    if (presup) {
        renderizarPresupuestoDocumento(presup);
        areaPresupuesto.scrollIntoView({ behavior: 'smooth' }); 
    }
};

// ==========================================
// 7. EXPORTAR E IMPORTAR DATOS (JSON)
// ==========================================
const btnExportar = document.getElementById('btn-exportar');
const inputImportar = document.getElementById('input-importar');

if (btnExportar) {
    btnExportar.addEventListener('click', function() {
        const datos = {
            productos: productos,
            carrito: carrito,
            presupuestos: presupuestos
        };
        
        const textoJson = JSON.stringify(datos, null, 2);
        const blob = new Blob([textoJson], { type: "application/json" });
        
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "muebleria.json";
        
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    });
}

if (inputImportar) {
    inputImportar.addEventListener('change', function(evento) {
        const archivo = evento.target.files[0];
        if (!archivo) return;

        const lector = new FileReader();
        
        lector.onload = function(e) {
            try {
                const datosImportados = JSON.parse(e.target.result);
                
                if (!datosImportados.hasOwnProperty('productos') || 
                    !datosImportados.hasOwnProperty('carrito') || 
                    !datosImportados.hasOwnProperty('presupuestos')) {
                    throw new Error("El archivo no tiene el formato esperado para la Mueblería (faltan listas).");
                }

                const confirmacion = confirm("¿Estás seguro de que querés cargar este archivo? Esto reemplazará todo tu catálogo, carritos y presupuestos actuales.");
                
                if (confirmacion) {
                    productos = datosImportados.productos;
                    carrito = datosImportados.carrito;
                    presupuestos = datosImportados.presupuestos;
                    
                    guardarEnLocalStorage();
                    
                    filtrarYOrdenar();
                    renderizarTablaProductos();
                    actualizarContadorCarrito();
                    renderizarCarrito();
                    renderizarListaPresupuestos();
                    
                    alert("¡Datos importados y restaurados con éxito!");
                }
            } catch (error) {
                alert("Error al importar: " + error.message);
            }
            inputImportar.value = "";
        };

        lector.readAsText(archivo);
    });
}

// ==========================================
// 8. ARRANQUE Y CÓDIGO PWA (Service Worker + Aviso)
// ==========================================
inicializarDatos();
filtrarYOrdenar(); 
renderizarTablaProductos();
actualizarContadorCarrito();
renderizarCarrito();
renderizarListaPresupuestos();

// Registro del Service Worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(reg => console.log("Service Worker registrado con éxito:", reg.scope))
            .catch(err => console.error("Error al registrar el Service Worker:", err));
    });
}

// Aviso discreto de conexión (Online / Offline)
const avisoConexion = document.createElement("div");
avisoConexion.id = "aviso-conexion";
avisoConexion.style.cssText = "display: none; position: fixed; bottom: 0; left: 0; width: 100%; background-color: #d9534f; color: white; text-align: center; padding: 0.5rem; font-size: 0.9rem; z-index: 1000; font-weight: 600;";
avisoConexion.textContent = "Sin conexión: tus datos se siguen guardando en este celular";
document.body.appendChild(avisoConexion);

window.addEventListener("online", () => { avisoConexion.style.display = "none"; });
window.addEventListener("offline", () => { avisoConexion.style.display = "block"; });
if (!navigator.onLine) { avisoConexion.style.display = "block"; }