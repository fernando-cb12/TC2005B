const API_URL = "https://67de296b471aaaa742836ba8.mockapi.io/productos";

// Elementos del DOM
const productTable = document.querySelector("tbody");
const categorySelect = document.getElementById("category");
const addProductButton = document.getElementById("addProducto");
const saveButton = document.getElementById("saveProduct");
const returnButton = document.getElementById("return_button");
const saveChangesButton = document.getElementById("save_changes");

// Elementos del formulario modal
const newProductName = document.getElementById("newProductName");
const newProductPrice = document.getElementById("newProductPrice");
const newProductID = document.getElementById("newProductID");
const newProductCategory = document.getElementById("newProductCategory");

// Cargar productos desde la API al iniciar la página
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  // Configurar eventos
  categorySelect.addEventListener("change", filterProductsByCategory);
  saveButton.addEventListener("click", saveNewProduct);
  returnButton.addEventListener("click", () => window.history.back());
  saveChangesButton.addEventListener("click", updateProductDetails);
});

// Cargar productos desde la API
async function loadProducts() {
  try {
    // Mostrar indicador de carga
    productTable.innerHTML =
      '<tr><td colspan="5" class="text-center">Cargando productos...</td></tr>';

    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error("Error al cargar los productos:", error);
    productTable.innerHTML =
      '<tr><td colspan="5" class="text-center text-danger">Error al cargar los productos. Intente más tarde.</td></tr>';
  }
}

// Mostrar productos en la tabla
function displayProducts(products) {
  // Filtrar productos si hay un filtro activo
  const selectedCategory = categorySelect.value;
  if (selectedCategory && selectedCategory !== "Todos") {
    products = products.filter(
      (product) => product.categoria === selectedCategory
    );
  }

  // Limpiar tabla
  productTable.innerHTML = "";

  // Verificar si hay productos
  if (products.length === 0) {
    productTable.innerHTML =
      '<tr><td colspan="5" class="text-center">No hay productos para mostrar</td></tr>';
    return;
  }

  // Agregar productos a la tabla
  products.forEach((product) => {
    const row = document.createElement("tr");
    row.dataset.id = product.id; // Guardar el ID para futuras operaciones
    row.innerHTML = `
            <td>${product.nombre}</td>
            <td>${parseFloat(product.precio).toFixed(2)}</td>
            <td>${product.identificador}</td>
            <td>
                <input type="text" class="form-control quantity-input" 
                      value="${product.cantidad}" data-id="${product.id}">
            </td>
            <td>${product.categoria}</td>
        `;
    productTable.appendChild(row);
  });

  // Añadir evento para detectar cambios en las cantidades
  document.querySelectorAll(".quantity-input").forEach((input) => {
    input.addEventListener("change", updateProductQuantity);
  });

  // Añadir evento de clic para seleccionar productos para edición
  document.querySelectorAll("tbody tr").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (!event.target.classList.contains("quantity-input")) {
        selectProductForEdit(row.dataset.id);
      }
    });
  });
}

// Filtrar productos por categoría
function filterProductsByCategory() {
  loadProducts();
}

// Actualizar cantidad de un producto
async function updateProductQuantity(event) {
  const productId = event.target.dataset.id;
  const newQuantity = parseInt(event.target.value);

  if (isNaN(newQuantity) || newQuantity < 0) {
    showAlert("La cantidad debe ser un número entero positivo", "danger");
    loadProducts();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cantidad: newQuantity }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    showAlert("Cantidad actualizada correctamente", "success");
  } catch (error) {
    console.error("Error al actualizar la cantidad:", error);
    showAlert("No se pudo actualizar la cantidad", "danger");
    loadProducts();
  }
}

// Seleccionar un producto para editar
async function selectProductForEdit(productId) {
  try {
    const response = await fetch(`${API_URL}/${productId}`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const product = await response.json();

    // Cargar datos en el formulario de edición
    const editForm = document.querySelector(".edit-item");
    const inputs = editForm.querySelectorAll("input");

    // Asignar valores a los inputs (nombre, precio, ID, categoría)
    inputs[0].value = product.nombre;
    inputs[1].value = product.precio;
    inputs[2].value = product.identificador;
    inputs[3].value = product.categoria;

    // Guardar ID del producto en un atributo data para usarlo al guardar
    editForm.dataset.productId = product.id;
  } catch (error) {
    console.error("Error al cargar el producto para editar:", error);
    showAlert("No se pudo cargar el producto para editar", "danger");
  }
}

// Actualizar detalles de un producto
async function updateProductDetails() {
  const editForm = document.querySelector(".edit-item");
  const productId = editForm.dataset.productId;

  if (!productId) {
    showAlert("No hay producto seleccionado para editar", "warning");
    return;
  }

  const inputs = editForm.querySelectorAll("input");
  const productData = {
    nombre: inputs[0].value,
    precio: parseFloat(inputs[1].value),
    identificador: inputs[2].value,
    categoria: inputs[3].value,
  };

  if (
    !productData.nombre ||
    isNaN(productData.precio) ||
    !productData.identificador ||
    !productData.categoria
  ) {
    showAlert("Por favor complete todos los campos correctamente", "warning");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    showAlert("Producto actualizado correctamente", "success");
    loadProducts(); // Recargar la lista
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    showAlert("No se pudo actualizar el producto", "danger");
  }
}

// Guardar nuevo producto
async function saveNewProduct() {
  // Obtener datos del formulario
  const productData = {
    nombre: newProductName.value,
    precio: parseFloat(newProductPrice.value),
    identificador: newProductID.value,
    categoria: newProductCategory.value,
    cantidad: 0,
  };

  if (
    !productData.nombre ||
    isNaN(productData.precio) ||
    !productData.identificador ||
    !productData.categoria
  ) {
    showAlert("Por favor complete todos los campos correctamente", "warning");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    addProductModal.hide();

    // Limpiar formulario
    newProductName.value = "";
    newProductPrice.value = "";
    newProductID.value = "";
    newProductCategory.value = "";

    showAlert("Producto agregado correctamente", "success");
    loadProducts();
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    showAlert("No se pudo guardar el producto", "danger");
  }
}

// Mostrar alertas
function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute("role", "alert");
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  const container = document.querySelector(".main-content");
  container.insertBefore(alertDiv, container.firstChild);

  // Auto-eliminar la alerta después de 3 segundos
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}
