# Fix Backend - Parsear números de FormData

## Problema
FormData envía todos los valores como strings. El backend debe convertirlos a números antes de usarlos.

## Archivo: `rewardController.js`

### 1. Función `createOffer` - Línea ~40-50

**BUSCAR estas líneas:**
```javascript
const {
  // Básicos
  title,
  description,
  points_required,
  image,
  category,
  // Pricing
  discount_percentage,
  discount_fixed,
  original_price,
  final_price,
```

**REEMPLAZAR con:**
```javascript
const {
  // Básicos
  title,
  description,
  image,
  category,
  // Tipo y audiencia
  offer_type,
  target_audience,
  // Código promocional
  promo_code,
  // Fechas
  start_date,
  end_date,
  expires_at,
  // Legal
  terms_and_conditions,
  // Estado
  is_active
} = req.body;

// Convertir campos numéricos (vienen como strings desde FormData)
const points_required = req.body.points_required ? parseFloat(req.body.points_required) : undefined;
const discount_percentage = req.body.discount_percentage ? parseFloat(req.body.discount_percentage) : undefined;
const discount_fixed = req.body.discount_fixed ? parseFloat(req.body.discount_fixed) : undefined;
const original_price = req.body.original_price ? parseFloat(req.body.original_price) : undefined;
const final_price = req.body.final_price ? parseFloat(req.body.final_price) : undefined;
const max_uses = req.body.max_uses ? parseInt(req.body.max_uses, 10) : undefined;
const stock_available = req.body.stock_available ? parseInt(req.body.stock_available, 10) : undefined;
```

### 2. Función `updateOffer` - Línea ~250-260

**BUSCAR estas líneas:**
```javascript
export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const updateData = req.body;
    
    const offer = await models.reward_offer.findByPk(offerId);
```

**REEMPLAZAR con:**
```javascript
export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const updateData = req.body;
    
    // Convertir campos numéricos (vienen como strings desde FormData)
    if (updateData.points_required !== undefined) {
      updateData.points_required = parseFloat(updateData.points_required);
    }
    if (updateData.discount_percentage !== undefined) {
      updateData.discount_percentage = parseFloat(updateData.discount_percentage);
    }
    if (updateData.discount_fixed !== undefined) {
      updateData.discount_fixed = parseFloat(updateData.discount_fixed);
    }
    if (updateData.original_price !== undefined) {
      updateData.original_price = parseFloat(updateData.original_price);
    }
    if (updateData.final_price !== undefined) {
      updateData.final_price = parseFloat(updateData.final_price);
    }
    if (updateData.max_uses !== undefined) {
      updateData.max_uses = parseInt(updateData.max_uses, 10);
    }
    if (updateData.stock_available !== undefined) {
      updateData.stock_available = parseInt(updateData.stock_available, 10);
    }
    
    const offer = await models.reward_offer.findByPk(offerId);
```

## Resultado Esperado

Después de estos cambios:
- ✅ Crear ofertas funcionará correctamente
- ✅ Actualizar ofertas funcionará correctamente  
- ✅ Las validaciones de precios funcionarán: `80 < 100` = true
- ✅ Eliminar ofertas ya funciona (el error es por validación de negocio correcta)

## Nota sobre Eliminar Ofertas

El error "No se puede eliminar una oferta que tiene canjes asociados" es **correcto y esperado**. 
Es una protección de integridad de datos. Si quieres eliminar una oferta con canjes, primero debes:
1. Eliminar los canjes asociados, O
2. Modificar la lógica del backend para permitir eliminación (no recomendado)
