# Fix para validación de precios en createOffer y updateOffer

## Problema
Cuando se envían datos a través de FormData desde el frontend, todos los valores se convierten a strings. El backend está comparando strings en lugar de números, causando que la validación `final_price > original_price` falle incorrectamente.

Por ejemplo: `"80" > "100"` es `true` en comparación de strings (porque "8" > "1" lexicográficamente).

## Solución

En el archivo `rewardController.js` del backend, agregar conversión de tipos numéricos al inicio de las funciones `createOffer` y `updateOffer`.

### Para createOffer

Reemplazar esta sección:

```javascript
export const createOffer = async (req, res) => {
  try {
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
      // ... resto de campos
    } = req.body;
```

Con:

```javascript
export const createOffer = async (req, res) => {
  try {
    // Extraer y convertir campos numéricos
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
    
    // Convertir campos numéricos explícitamente
    const points_required = req.body.points_required ? Number(req.body.points_required) : undefined;
    const discount_percentage = req.body.discount_percentage ? Number(req.body.discount_percentage) : undefined;
    const discount_fixed = req.body.discount_fixed ? Number(req.body.discount_fixed) : undefined;
    const original_price = req.body.original_price ? Number(req.body.original_price) : undefined;
    const final_price = req.body.final_price ? Number(req.body.final_price) : undefined;
    const max_uses = req.body.max_uses ? Number(req.body.max_uses) : undefined;
    const stock_available = req.body.stock_available ? Number(req.body.stock_available) : undefined;
```

### Para updateOffer

Agregar al inicio de la función, después de extraer `updateData`:

```javascript
export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const updateData = req.body;
    
    // Convertir campos numéricos si están presentes
    if (updateData.points_required !== undefined) {
      updateData.points_required = Number(updateData.points_required);
    }
    if (updateData.discount_percentage !== undefined) {
      updateData.discount_percentage = Number(updateData.discount_percentage);
    }
    if (updateData.discount_fixed !== undefined) {
      updateData.discount_fixed = Number(updateData.discount_fixed);
    }
    if (updateData.original_price !== undefined) {
      updateData.original_price = Number(updateData.original_price);
    }
    if (updateData.final_price !== undefined) {
      updateData.final_price = Number(updateData.final_price);
    }
    if (updateData.max_uses !== undefined) {
      updateData.max_uses = Number(updateData.max_uses);
    }
    if (updateData.stock_available !== undefined) {
      updateData.stock_available = Number(updateData.stock_available);
    }
    
    const offer = await models.reward_offer.findByPk(offerId);
    // ... resto del código
```

## Resultado

Después de aplicar estos cambios:
- Los valores numéricos se convertirán correctamente de strings a números
- Las comparaciones funcionarán correctamente: `80 < 100` ✓
- La validación de precios funcionará como se espera
