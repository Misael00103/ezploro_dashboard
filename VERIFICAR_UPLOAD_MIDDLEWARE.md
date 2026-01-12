# Verificación del Middleware de Upload

## Problema Potencial

En las rutas veo:
```javascript
upload.single("image", 5)
```

El segundo parámetro `5` **no es estándar de multer**. La sintaxis correcta es:
```javascript
upload.single("image")
```

## Verificar archivo `middleware/upload.js`

Necesitas verificar cómo está configurado el middleware de upload. Debería verse algo así:

```javascript
import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // o la carpeta que uses
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

export default upload;
```

## Corrección en las Rutas

Si el middleware está configurado correctamente, las rutas deberían ser:

```javascript
// INCORRECTO (si upload.single no acepta segundo parámetro)
router.post('/rewards/offers', protectRoute(['admin']), upload.single("image", 5), createOffer);

// CORRECTO
router.post('/rewards/offers', protectRoute(['admin']), upload.single("image"), createOffer);
```

El límite de tamaño (5MB) se configura en el middleware de multer, no en la ruta.

## Acción Requerida

1. Verifica el archivo `middleware/upload.js`
2. Si el middleware ya tiene configurado el límite de tamaño, **elimina el segundo parámetro `5`** de las rutas
3. Las rutas deberían quedar:

```javascript
router.post('/rewards/offers', 
  protectRoute(['admin']), 
  upload.single("image"),
  createOffer
);

router.put('/rewards/offers/:offerId', 
  protectRoute(['admin']),
  upload.single("image"),
  updateOffer
);
```

## Nota

Si `upload.single("image", 5)` es una implementación personalizada que funciona, entonces ignora esto. Pero si estás usando multer estándar, esto podría estar causando problemas.
